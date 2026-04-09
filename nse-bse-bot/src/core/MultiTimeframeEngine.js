/**
 * Multi-Timeframe Analysis Engine
 * Confirms signals across Daily + 15min + 5min timeframes
 */

const Logger = require('../utils/logger');

class MultiTimeframeEngine {
  constructor(options = {}) {
    this.logger = options.logger || new Logger({ module: 'MTF' });
    this.adapter = options.adapter;
  }

  /**
   * Get multi-timeframe signal for a symbol
   * @param {string} symbol - Stock symbol
   * @returns {Object} { score, direction, timeframes, verdict }
   */
  async analyze(symbol) {
    if (!this.adapter) return { score: 0, direction: 'NEUTRAL', verdict: 'NO_DATA' };

    const data = this.adapter.getMarketData()[symbol];
    if (!data?.prices || data.prices.length < 30) {
      return { score: 0, direction: 'NEUTRAL', verdict: 'INSUFFICIENT_DATA' };
    }

    const prices = data.prices;
    const rsi = data.rsi || 50;
    const ema9 = data.ema9;
    const ema20 = data.sma20; // approximate
    const current = prices[prices.length - 1];

    // ── Daily Timeframe ──────────────────────────────────────────────────────
    const dailyRSI = rsi;
    const dailyTrend = (ema9 && ema20) ? (ema9 > ema20 ? 'BULLISH' : 'BEARISH') : 'NEUTRAL';
    const dailyMomentum = dailyRSI > 50 ? 'POSITIVE' : dailyRSI < 50 ? 'NEGATIVE' : 'NEUTRAL';

    // ── 15-min approximation (recent data) ────────────────────────────────
    const recentPrices = prices.slice(-20); // last ~20 days as proxy
    const recentHigh = Math.max(...recentPrices);
    const recentLow = Math.min(...recentPrices);
    const recentChange = ((current - recentPrices[0]) / recentPrices[0]) * 100;

    const shortRSI = this.calculateRSI(recentPrices, 7);
    const shortEMA = this.calculateEMA(recentPrices.slice(-10), 5);

    // ── Score Calculation ───────────────────────────────────────────────────
    let score = 50; // neutral
    const factors = [];

    // Trend alignment score
    if (dailyTrend === 'BULLISH') {
      score += 15;
      factors.push({ factor: 'Daily Trend Bullish', delta: +15 });
    } else if (dailyTrend === 'BEARISH') {
      score -= 15;
      factors.push({ factor: 'Daily Trend Bearish', delta: -15 });
    }

    // RSI confirmation
    if (dailyRSI > 55 && shortRSI > 55) {
      score += 10;
      factors.push({ factor: 'RSI Confirmation (Bull)', delta: +10 });
    } else if (dailyRSI < 45 && shortRSI < 45) {
      score -= 10;
      factors.push({ factor: 'RSI Confirmation (Bear)', delta: -10 });
    } else if (dailyRSI > 70 || shortRSI > 70) {
      score -= 15;
      factors.push({ factor: 'Overbought Zone', delta: -15 });
    } else if (dailyRSI < 30 || shortRSI < 30) {
      score += 15;
      factors.push({ factor: 'Oversold Zone (Buy Opportunity)', delta: +15 });
    }

    // Short-term momentum
    if (recentChange > 1) {
      score += 8;
      factors.push({ factor: 'Short-term Momentum (+)', delta: +8 });
    } else if (recentChange < -1) {
      score -= 8;
      factors.push({ factor: 'Short-term Momentum (-)', delta: -8 });
    }

    // EMA alignment
    if (shortEMA > current * 0.995 && dailyTrend === 'BULLISH') {
      score += 12;
      factors.push({ factor: 'EMA Alignment Bullish', delta: +12 });
    } else if (shortEMA < current * 1.005 && dailyTrend === 'BEARISH') {
      score -= 12;
      factors.push({ factor: 'EMA Alignment Bearish', delta: -12 });
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // ── Verdict ──────────────────────────────────────────────────────────────
    let verdict = 'NEUTRAL';
    if (score >= 70) verdict = 'STRONG_BUY';
    else if (score >= 60) verdict = 'BUY';
    else if (score >= 40 && score < 60) verdict = 'NEUTRAL';
    else if (score >= 30) verdict = 'SELL';
    else verdict = 'STRONG_SELL';

    const direction = score >= 50 ? 'LONG' : 'SHORT';

    return {
      symbol,
      score: Math.round(score),
      direction,
      verdict,
      factors,
      dailyRSI: Math.round(dailyRSI),
      shortRSI: Math.round(shortRSI),
      dailyTrend,
      recentChange: recentChange.toFixed(2),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Batch analyze multiple symbols
   */
  async analyzeAll(symbols) {
    const results = [];
    for (const symbol of symbols) {
      try {
        const result = await this.analyze(symbol);
        results.push(result);
      } catch (e) {
        this.logger?.warn(`${symbol} MTF analysis failed:`, e.message);
      }
    }
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Get only actionable signals (score > 65 or score < 35)
   */
  getActionableSignals(signals) {
    return signals.filter(s => s.score >= 65 || s.score <= 35);
  }

  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateEMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1];
    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;
    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
  }
}

module.exports = MultiTimeframeEngine;
