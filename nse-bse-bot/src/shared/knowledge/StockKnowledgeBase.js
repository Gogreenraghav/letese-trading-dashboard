/**
 * Indian Stock Market Knowledge Base
 * Contains trading knowledge, patterns, sector analysis
 */

const fs = require('fs-extra');
const path = require('path');

class StockKnowledgeBase {
  constructor(options = {}) {
    this.logger = options.logger;
    this.dataPath = options.dataPath || path.join(__dirname, '../../knowledge-base/stocks');
    this.learnings = [];
    this.sectorKnowledge = {};
    this.patterns = [];
  }

  async initialize() {
    await fs.ensureDir(this.dataPath);
    await this.loadKnowledge();
    this.buildIndianMarketKnowledge();
    this.logger?.info(`📚 Knowledge Base initialized with ${this.patterns.length} patterns`);
  }

  async loadKnowledge() {
    const knowledgeFile = path.join(this.dataPath, 'knowledge.json');
    const learningsFile = path.join(this.dataPath, 'learnings.json');

    try {
      if (await fs.pathExists(knowledgeFile)) {
        const data = await fs.readJson(knowledgeFile);
        this.patterns = data.patterns || [];
      }
      if (await fs.pathExists(learningsFile)) {
        this.learnings = await fs.readJson(learningsFile);
      }
    } catch (error) {
      this.logger?.warn('Could not load knowledge files:', error.message);
    }
  }

  async saveKnowledge() {
    const knowledgeFile = path.join(this.dataPath, 'knowledge.json');
    const learningsFile = path.join(this.dataPath, 'learnings.json');

    try {
      await fs.writeJson(knowledgeFile, { patterns: this.patterns, updated: new Date().toISOString() });
      await fs.writeJson(learningsFile, this.learnings.slice(-100)); // Keep last 100
    } catch (error) {
      this.logger?.warn('Could not save knowledge:', error.message);
    }
  }

  buildIndianMarketKnowledge() {
    // Indian Market-specific patterns
    this.patterns = [
      // --- NIFTY Patterns ---
      {
        name: 'Nifty Opening Gap Fill',
        description: 'Nifty often fills opening gaps within first hour',
        market: 'NIFTY',
        type: 'mean_reversion',
        reliability: 0.72,
        indicators: ['Gap Up/Down > 0.5%', 'First hour volume > 20% avg'],
        action: 'Fade the gap with stop at day high/low'
      },
      {
        name: 'Bank Nifty ITF Pattern',
        description: 'Intraday trend following for Bank Nifty',
        market: 'BANKNIFTY',
        type: 'momentum',
        reliability: 0.68,
        indicators: ['Price > SMA 20', 'RSI > 55', 'Volume > 1.2x avg'],
        action: 'Buy with trailing stop at previous candle low'
      },
      {
        name: 'FII Dumps buying',
        description: 'FII buying > ₹1000Cr often leads to continued rally',
        market: 'NIFTY',
        type: 'sentiment',
        reliability: 0.75,
        indicators: ['FII Net Buying > 1000Cr', 'DII Selling', 'Price up > 1%'],
        action: 'Continue long with stop at day low'
      },

      // --- Sector Rotation ---
      {
        name: 'IT Sector Outperformance',
        description: 'When INR weakens > 0.5%, IT stocks rally',
        market: 'IT',
        type: 'sector_correlation',
        reliability: 0.70,
        indicators: ['USD/INR > 83.5', 'IT index > Nifty', 'Global cues positive'],
        action: 'Long IT majors (TCS, INFY, WIPRO)'
      },
      {
        name: 'Banking Sector Leadership',
        description: 'Banking sector leads during economic growth cycles',
        market: 'BANKING',
        type: 'sector_leadership',
        reliability: 0.73,
        indicators: ['BankNifty > Nifty50', 'NPA trends improving', 'Credit growth > 15%'],
        action: 'Long private banks (HDFC, ICICI, Kotak)'
      },
      {
        name: 'Metal Sector Cycle',
        description: 'Metals rally on global commodity price increases',
        market: 'METALS',
        type: 'commodity_correlation',
        reliability: 0.65,
        indicators: ['Gold/Commodity index up', 'China PMI > 50', 'INR stable'],
        action: 'Long SAIL, Tata Steel, Hindalco'
      },

      // --- Intraday Patterns ---
      {
        name: '9:30-10:00 AM Reversal',
        description: 'First 30 min volatility often reverses by 10 AM',
        market: 'NIFTY',
        type: 'intraday_timing',
        reliability: 0.60,
        indicators: ['Opening move > 1%', 'Volume spiking first 15min'],
        action: 'Fade the initial move, book by 10 AM'
      },
      {
        name: 'Last Hour Momentum',
        description: 'Institutional buying often happens in last hour',
        market: 'NIFTY',
        type: 'intraday_timing',
        reliability: 0.67,
        indicators: ['Last hour volume > 25% of day', 'Price trending'],
        action: 'Follow institutional flow in last hour'
      },

      // --- Options & F&O ---
      {
        name: 'Expiry Week Effect',
        description: 'Short covering often seen on expiry day',
        market: 'NIFTY',
        type: 'weekly_effect',
        reliability: 0.62,
        indicators: ['Thursday/Friday of expiry week', 'VIX < 15'],
        action: 'Straddle/Strangle on Wednesday, close Thursday'
      },
      {
        name: 'PCR Reversal Signal',
        description: 'When PCR falls below 0.8, reversal signal',
        market: 'NIFTY',
        type: 'options_sentiment',
        reliability: 0.70,
        indicators: ['Nifty PCR < 0.8', 'Put volume increasing', 'Price oversold'],
        action: 'Buy calls, stop at 0.5% below'
      },

      // --- Macro Events ---
      {
        name: 'RBI Policy Reaction',
        description: 'Markets react sharply to RBI policy announcements',
        market: 'NIFTY',
        type: 'event_based',
        reliability: 0.78,
        indicators: ['RBI Policy Date', 'Expected vs Actual rates', 'Guidance tone'],
        action: 'Avoid taking positions 1 hour before and after policy'
      },
      {
        name: 'US Market Lag',
        description: 'Nifty follows Dow Jones with 30-60 min delay',
        market: 'NIFTY',
        type: 'global_correlation',
        reliability: 0.65,
        indicators: ['Dow futures down > 1%', 'Asia markets negative'],
        action: 'Short on gap down, cover on recovery'
      },

      // --- Technical Patterns ---
      {
        name: 'Double Bottom on Daily',
        description: 'Strong reversal pattern on daily timeframe',
        market: 'STOCK',
        type: 'technical',
        reliability: 0.74,
        indicators: ['Two lows at same level', 'Neckline breakout', 'Volume confirmation'],
        action: 'Buy on neckline breakout with stop at second bottom'
      },
      {
        name: 'RSI Divergence',
        description: 'Price making new high but RSI lower = bearish divergence',
        market: 'STOCK',
        type: 'technical',
        reliability: 0.72,
        indicators: ['Price > Previous high', 'RSI < Previous RSI high', 'Volume declining'],
        action: 'Exit longs / initiate shorts'
      },
    ];

    // Sector knowledge
    this.sectorKnowledge = {
      'IT': {
        leaders: ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM'],
        correlated: ['USD/INR', 'US Tech stocks', 'Global IT spending'],
        drivers: ['Dollar strength', 'US Fed rates', 'IT spending'],
      },
      'BANKING': {
        leaders: ['HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'SBIN', 'AXISBANK'],
        correlated: ['GDP growth', 'Credit growth', 'NPA levels'],
        drivers: ['Interest rates', 'Deposit growth', 'Asset quality'],
      },
      'FMCG': {
        leaders: ['HUL', 'NESTLEIND', 'ITC', 'COLPAL', 'BRITANNIA'],
        correlated: ['Rural demand', 'Monsoon', 'Inflation'],
        drivers: ['Volume growth', 'Rural income', 'Monsoon'],
      },
      'PHARMA': {
        leaders: ['SUNPHARMA', 'DRL', 'CIPLA', 'LUPIN', 'ZYDUSLIFE'],
        correlated: ['USFDA approvals', 'Healthcare spend', 'Export demand'],
        drivers: ['USFDA', 'API prices', 'Emerging markets'],
      },
      'AUTO': {
        leaders: ['MARUTI', 'TATAMOTORS', 'M&M', 'BAJAJ-AUTO', 'HEROMOTOCO'],
        correlated: ['Fuel prices', 'BSVI transition', 'EV trend'],
        drivers: ['Festival demand', 'Interest rates', 'EV adoption'],
      },
    };
  }

  // Get relevant patterns for current market condition
  getRelevantPatterns(marketCondition) {
    return this.patterns.filter(p => {
      if (marketCondition.market && p.market !== marketCondition.market && p.market !== 'NIFTY') {
        return false;
      }
      return true;
    }).sort((a, b) => b.reliability - a.reliability);
  }

  // Get sector knowledge
  getSectorKnowledge(sector) {
    return this.sectorKnowledge[sector] || null;
  }

  // Update from trading cycle
  async updateFromCycle(data) {
    const { sentiment, signals, trades } = data;
    
    // Learn from trades
    for (const trade of trades) {
      if (trade.status === 'CLOSED') {
        const learning = {
          symbol: trade.symbol,
          action: trade.action,
          pnl: trade.pnl,
          pnlPercent: trade.pnlPercent,
          confidence: trade.confidence,
          strategy: trade.strategy,
          holdingPeriod: trade.holdingPeriod,
          sentiment: sentiment.overall,
          timestamp: new Date().toISOString(),
        };

        this.learnings.push(learning);

        // Adjust pattern reliability based on results
        const pattern = this.patterns.find(p => p.name.includes(trade.strategy));
        if (pattern) {
          const factor = trade.pnl > 0 ? 0.02 : -0.02;
          pattern.reliability = Math.max(0.4, Math.min(0.95, pattern.reliability + factor));
        }
      }
    }

    // Keep learnings manageable
    if (this.learnings.length > 200) {
      this.learnings = this.learnings.slice(-200);
    }

    await this.saveKnowledge();
  }

  // Get trading advice based on knowledge
  getAdvice(symbol, data) {
    const advice = [];
    
    // Check sector patterns
    const sector = this.getSectorForSymbol(symbol);
    if (sector && this.sectorKnowledge[sector]) {
      advice.push({
        type: 'sector',
        text: `Sector: ${sector}`,
        details: this.sectorKnowledge[sector].drivers,
      });
    }

    // Check technical patterns
    const relevantPatterns = this.getRelevantPatterns({ market: symbol });
    for (const pattern of relevantPatterns.slice(0, 2)) {
      advice.push({
        type: 'pattern',
        text: pattern.name,
        confidence: pattern.reliability,
        action: pattern.action,
      });
    }

    return advice;
  }

  getSectorForSymbol(symbol) {
    const sectorMap = {
      'TCS': 'IT', 'INFY': 'IT', 'WIPRO': 'IT', 'HCLTECH': 'IT', 'TECHM': 'IT',
      'HDFCBANK': 'BANKING', 'ICICIBANK': 'BANKING', 'KOTAKBANK': 'BANKING', 'SBIN': 'BANKING', 'AXISBANK': 'BANKING',
      'HUL': 'FMCG', 'NESTLEIND': 'FMCG', 'ITC': 'FMCG', 'COLPAL': 'FMCG', 'BRITANNIA': 'FMCG',
      'SUNPHARMA': 'PHARMA', 'CIPLA': 'PHARMA', 'LUPIN': 'PHARMA',
      'MARUTI': 'AUTO', 'TATAMOTORS': 'AUTO', 'M&M': 'AUTO', 'BAJAJ-AUTO': 'AUTO',
    };
    return sectorMap[symbol] || null;
  }
}

module.exports = StockKnowledgeBase;
