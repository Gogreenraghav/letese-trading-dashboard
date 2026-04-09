/**
 * News Fetcher — Indian Market & Political News
 * Sources: Moneycontrol RSS, Hindi News, NSE/BSE announcements
 */

const Parser = require('rss-parser');
const cheerio = require('cheerio');
const Logger = require('./logger');

class NewsFetcher {
  constructor(options = {}) {
    this.logger = options.logger || new Logger({ module: 'News' });
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  async fetchMoneycontrol() {
    try {
      const parser = new Parser();
      const feed = await parser.parseURL('https://www.moneycontrol.com/rss/MCtopnews.xml');
      return (feed.items || []).slice(0, 15).map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        source: 'Moneycontrol',
        category: this.categorize(item.title || ''),
        sentiment: this.analyzeSentiment(item.title || ''),
      }));
    } catch (e) {
      this.logger.warn('Moneycontrol RSS failed:', e.message);
      return [];
    }
  }

  async fetchETMarket() {
    try {
      const response = await require('axios').get('https://economictimes.indiatimes.com/markets/stocks/rssfeeds/55017203.cms', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 8000,
      });
      const $ = cheerio.load(response.data);
      const items = [];
      $('item').slice(0, 10).each((i, el) => {
        items.push({
          title: $(el).find('title').text().trim(),
          link: $(el).find('link').text().trim(),
          pubDate: $(el).find('pubDate').text().trim(),
          source: 'Economic Times',
          category: 'markets',
          sentiment: this.analyzeSentiment($(el).find('title').text()),
        });
      });
      return items;
    } catch (e) {
      this.logger.warn('ET RSS failed:', e.message);
      return [];
    }
  }

  async fetchNSEAnnouncements() {
    try {
      const response = await require('axios').get('https://www.nseindia.com/api/corporate-announcements?index=equities&category=&segment=Equity', {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
          'Referer': 'https://www.nseindia.com/',
        },
        timeout: 8000,
      });
      return (response.data || []).slice(0, 10).map(a => ({
        symbol: a.symbol || a.companyName,
        description: a.description || a.announcement,
        submittedDate: a.submittedDate,
        attchmntFileSize: a.attchmntFileSize,
        source: 'NSE India',
        category: 'corporate',
        sentiment: this.analyzeSentiment(a.description || ''),
      }));
    } catch (e) {
      this.logger.warn('NSE announcements failed:', e.message);
      return [];
    }
  }

  async fetchMarketHeadlines() {
    try {
      const response = await require('axios').get('https://www.moneycontrol.com/india/business-stock-market/', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 8000,
      });
      const $ = cheerio.load(response.data);
      const headlines = [];
      $('h2 a, h3 a').slice(0, 10).each((i, el) => {
        const title = $(el).text().trim();
        const link = $(el).attr('href');
        if (title && title.length > 10) {
          headlines.push({
            title,
            link: link || '',
            source: 'Moneycontrol',
            category: this.categorize(title),
            sentiment: this.analyzeSentiment(title),
          });
        }
      });
      return headlines;
    } catch (e) {
      return [];
    }
  }

  categorize(text) {
    const t = text.toLowerCase();
    if (/\b(fii|dii|foreign|institutional|flow|buy|sell|rally|bull|surge|gain|up|momentum)\b/.test(t)) return 'bullish';
    if (/\b(bear|crash|fall|drop|loss|worried|fear|red|down|bleed)\b/.test(t)) return 'bearish';
    if (/\b(rbi|rate|cut|policy|inflation|repo|reverse repo)\b/.test(t)) return 'macro';
    if (/\b(election|govt|bjp|congress|modi|parliament|laws?\b)/.test(t)) return 'political';
    if (/\b(result|quarter|earning|revenue|profit|loss|eps)\b/.test(t)) return 'earnings';
    if (/\b(bonus|split|merger|acquisition|buyback|dividend)\b/.test(t)) return 'corporate';
    return 'general';
  }

  analyzeSentiment(text) {
    const t = text.toLowerCase();
    let score = 0;
    const positives = ['rally', 'surge', 'gain', 'up', 'bull', 'profit', 'soar', 'jump', 'high', 'growth', 'beat', 'upgrade', 'strong', 'record high', 'historic'];
    const negatives = ['fall', 'drop', 'crash', 'loss', 'bear', 'bleed', 'cut', 'downgrade', 'weak', 'lower', 'below', 'concern', 'worried', 'fears'];
    const neutrals = ['stable', 'flat', 'unchanged', 'mixed', 'range'];
    positives.forEach(p => { if (t.includes(p)) score += 1; });
    negatives.forEach(p => { if (t.includes(p)) score -= 1; });
    if (score >= 1) return { label: 'POSITIVE', score };
    if (score <= -1) return { label: 'NEGATIVE', score };
    return { label: 'NEUTRAL', score: 0 };
  }

  async getAllNews() {
    const cached = this.cache.get('all_news');
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const [mc, et, nse] = await Promise.allSettled([
      this.fetchMoneycontrol(),
      this.fetchETMarket(),
      this.fetchNSEAnnouncements(),
    ]);

    const news = [
      ...(mc.status === 'fulfilled' ? mc.value : []),
      ...(et.status === 'fulfilled' ? et.value : []),
      ...(nse.status === 'fulfilled' ? nse.value : []),
    ].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    this.cache.set('all_news', { data: news, timestamp: Date.now() });
    return news;
  }

  getNewsForStock(stockSymbol, news) {
    const s = stockSymbol.toUpperCase();
    return news.filter(n => {
      const t = (n.title || '').toUpperCase();
      return t.includes(s) || t.includes(s.slice(0, 4));
    });
  }
}

module.exports = NewsFetcher;
