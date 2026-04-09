/**
 * Multi-Provider AI Client with Automatic Failover
 * Supports: Groq, OpenRouter, Gemini, HuggingFace
 */

const axios = require('axios');

const PROVIDERS = [
  {
    name: 'groq',
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    timeout: 5000,
    priority: 1,
  },
  {
    name: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.3-70b-instruct',
    timeout: 8000,
    priority: 2,
  },
  {
    name: 'gemini',
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'models/gemini-2.0-flash',
    timeout: 5000,
    priority: 3,
  },
  {
    name: 'huggingface',
    apiKey: process.env.HF_TOKEN,
    baseURL: 'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
    model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    timeout: 10000,
    priority: 4,
  },
];

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const PROMPT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const FALLBACK_SUMMARY = `📊 *Daily Trading Summary* — ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}

🔄 Total Trades: N/A | ✅ Profitable: N/A | ❌ Losses: N/A

🏆 Best Performer: --

📈 Market Sentiment: Neutral — Unable to generate AI summary. Configure an API key in Settings ⚙️.

💡 *Insight:* Market data unavailable. Please ensure your NSE/BSE data feed is active and API keys are configured for AI summaries.

_This is a fallback summary. Configure GROQ_API_KEY or other AI provider for live summaries._`;

class AIClient {
  constructor() {
    this.summaryCache = null;
    this.summaryCacheTime = 0;
  }

  /**
   * Make an HTTP call to a single provider
   */
  async _callProvider(provider, messages, systemPrompt) {
    const headers = { 'Content-Type': 'application/json' };
    let url, data, transform;

    if (provider.name === 'groq') {
      url = `${provider.baseURL}/chat/completions`;
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
      data = {
        model: provider.model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      };
      transform = (r) => r.choices?.[0]?.message?.content || '';
    } else if (provider.name === 'openrouter') {
      url = `${provider.baseURL}/chat/completions`;
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
      headers['HTTP-Referer'] = 'http://localhost:3005';
      headers['X-Title'] = 'NSE-BSE Trading Bot';
      data = {
        model: provider.model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      };
      transform = (r) => r.choices?.[0]?.message?.content || '';
    } else if (provider.name === 'gemini') {
      url = `${provider.baseURL}/${provider.model}:generateContent?key=${provider.apiKey}`;
      const text = (systemPrompt ? systemPrompt + '\n\n' : '') + messages.map((m) => m.content).join('\n');
      data = { contents: [{ parts: [{ text }] }], generationConfig: { maxOutputTokens: 500, temperature: 0.7 } };
      transform = (r) => r.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (provider.name === 'huggingface') {
      url = `${provider.baseURL}`;
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
      const text = (systemPrompt ? systemPrompt + '\n\n' : '') + messages.map((m) => `${m.role}: ${m.content}`).join('\n');
      data = { inputs: text, parameters: { max_new_tokens: 300, temperature: 0.7 } };
      transform = (r) => (Array.isArray(r) ? r[0]?.generated_text || '' : typeof r === 'string' ? r : '');
    }

    const response = await axios.post(url, data, {
      headers,
      timeout: provider.timeout,
    });
    return transform(response.data);
  }

  /**
   * Try providers in priority order with retries
   * @returns {{ text: string, provider: string, latency: number }}
   */
  async chat(prompt, systemPrompt = null) {
    const available = PROVIDERS.filter((p) => p.apiKey);
    if (available.length === 0) {
      return { text: FALLBACK_SUMMARY, provider: 'none', latency: 0 };
    }

    available.sort((a, b) => (a.priority || 99) - (b.priority || 99));

    const messages = [{ role: 'user', content: prompt }];
    let attempt = 0;
    let providerIdx = 0;

    while (attempt < MAX_RETRIES) {
      const provider = available[providerIdx % available.length];
      attempt++;
      const start = Date.now();

      try {
        const text = await this._callProvider(provider, messages, systemPrompt);
        if (text && text.trim().length > 0) {
          return { text: text.trim(), provider: provider.name, latency: Date.now() - start };
        }
      } catch (err) {
        const latency = Date.now() - start;
        // Log but continue to next provider
        if (this.logger) {
          this.logger.warn(`AI provider ${provider.name} failed (${latency}ms): ${err.message}`);
        }
      }

      // Move to next provider if we've exhausted all
      if (providerIdx + 1 < available.length) {
        providerIdx++;
        attempt--; // don't count as retry when moving to next provider
      } else if (attempt < MAX_RETRIES) {
        // All providers tried, wait and retry from first
        providerIdx = 0;
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }

    return { text: FALLBACK_SUMMARY, provider: 'none', latency: 0 };
  }

  /**
   * Generate a Hinglish trading summary from trade/portfolio data
   */
  async generateTradeSummary(trades, portfolio, sentiment) {
    // Check cache first
    const now = Date.now();
    if (this.summaryCache && this.summaryCacheTime && (now - this.summaryCacheTime) < PROMPT_CACHE_TTL) {
      return this.summaryCache;
    }

    const profitable = (trades || []).filter((t) => t.profit > 0).length;
    const losses = (trades || []).filter((t) => t.profit < 0).length;
    const totalTrades = (trades || []).length;
    const totalProfit = (trades || []).reduce((s, t) => s + (t.profit || 0), 0);

    const bestTrade = (trades || []).reduce(
      (best, t) => (!best || t.profit > best.profit ? t : best),
      null
    );

    const sentimentMap = { bullish: '📈 Bullish', bearish: '📉 Bearish', neutral: '➡️ Neutral' };
    const sentimentStr = sentimentMap[sentiment?.overall] || '➡️ Neutral';

    const systemPrompt =
      'You are a professional Indian stock market analyst. You ALWAYS respond in Hinglish (Hindi-English mix).';

    const userPrompt = `Generate a brief daily trading summary for the NSE/BSE trading bot. Include:
- Total trades, profitable trades, loss trades
- Best performer (symbol and return %)
- Market sentiment
- 1-2 actionable insights for tomorrow

Keep it under 200 words. Use emojis. Be direct.

Data:
- Total trades: ${totalTrades}
- Profitable: ${profitable} | Losses: ${losses}
- Total P/L: ₹${totalProfit?.toFixed(2) || 'N/A'}
- Best performer: ${bestTrade ? `${bestTrade.symbol} (${((bestTrade.profit / (bestTrade.entryPrice * bestTrade.quantity)) * 100).toFixed(2)}% return)` : 'N/A'}
- Market sentiment: ${sentimentStr}
- Current portfolio value: ₹${parseFloat(String(portfolio?.totalValue || 0).replace(/,/g, '')) || 'N/A'}
- Cash available: ₹${parseFloat(String(portfolio?.cash || 0).replace(/,/g, '')) || 'N/A'}`;

    const result = await this.chat(userPrompt, systemPrompt);
    this.summaryCache = result;
    this.summaryCacheTime = now;
    return result;
  }
}

module.exports = new AIClient();
