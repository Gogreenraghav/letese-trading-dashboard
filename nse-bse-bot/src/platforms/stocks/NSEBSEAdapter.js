/**
 * NSE/BSE Stock Market Adapter
 * Fetches real-time data from Yahoo Finance
 * Supports NSE (.NS suffix) and BSE (.BO suffix)
 */

const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const Logger = require(path.join(__dirname, '../../utils/logger'));
const logger = new Logger('NSEAdapter');

class NSEBSEAdapter {
  constructor(options = {}) {
    this.logger = options.logger || logger;
    this.mode = options.mode || 'paper';
    this.marketData = {};
    this.positions = [];
    this.prices = {}; // Current prices cache
    
    // Default tracked symbols (NSE stocks with Yahoo Finance suffix)
    // Note: HUL=HINDUNILVR (NSE symbol), HDFC merged into HDFC Bank
    this.trackedSymbols = [
      // ── Finance & Banking ────────────────────────────
      'RELIANCE.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS',
      'KOTAKBANK.NS', 'AXISBANK.NS', 'BAJFINANCE.NS', 'BAJAJFINSV.NS',
      'HDFCLIFE.NS', 'SBILIFE.NS', 'ICICIPRULI.NS', 'SHRIRAMFIN.NS',
      // ── IT & Technology ─────────────────────────────
      'TCS.NS', 'INFY.NS', 'TECHM.NS', 'WIPRO.NS', 'HCLTECH.NS', 'LTIM.NS',
      // ── FMCG & Consumer ────────────────────────────
      'HINDUNILVR.NS', 'NESTLEIND.NS', 'ITC.NS', 'BRITANNIA.NS', 'TITAN.NS',
      // ── Pharmaceuticals & Healthcare ──────────────
      'SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'APOLLOHOSP.NS', 'DIVISLAB.NS',
      // ── Automobile ─────────────────────────────────
      'MARUTI.NS', 'M&M.NS', 'HEROMOTOCO.NS', 'EICHERMOT.NS', 'BAJAJ-AUTO.NS',
      // ── Infrastructure & Industrial ───────────────
      'LT.NS', 'ADANIPORTS.NS', 'GRASIM.NS', 'ULTRACEMCO.NS', 'DALBHARAT.NS',
      // ── Energy & Utilities ─────────────────────────
      'ONGC.NS', 'NTPC.NS', 'POWERGRID.NS', 'COALINDIA.NS', 'ADANIENT.NS',
      // ── Paints & Chemicals ─────────────────────────
      'ASIANPAINT.NS', 'BERGEPAINT.NS', 'PIDILITIND.NS',
      // ── Telecom & Others ──────────────────────────
      'BHARTIARTL.NS', 'JSWSTEEL.NS', 'TATASTEEL.NS',

      // ── BSE Stocks (.BO suffix — Bombay Stock Exchange) ──────────────
      // These are BSE-listed companies, many with significant trading volume on BSE
      // Use .NS for NSE listing, .BO for BSE listing (prices may differ slightly)
      'COFORGE.BO',      // Coforge Ltd (IT services)
      'LALPATHLAB.BO',   // Dr Lal Pathlabs (Healthcare)
      'METROBRAND.BO',   // Metro Brands (Retail)
      'CROMPTON.BO',     // Crompton Greaves (Consumer electricals)
      'WHIRLPOOL.BO',    // Whirlpool India (Consumer appliances)
      'BAJAJELEC.BO',    // Bajaj Electricals
      'CASTROLIND.BO',   // Castrol India (Lubricants)
      'GLAXO.BO',        // GlaxoSmithKline (Pharma)
      'HINDZINC.BO',     // Hindustan Zinc (Metals)
      'NMDC.BO',         // NMDC Ltd (Mining)
      'RBLBANK.BO',      // RBL Bank (Banking)
      'FORTIS.BO',       // Fortis Healthcare
      'INDIACEM.BO',     // India Cements
      'JINDALSTEL.BO',   // Jindal Steel & Power
      'MFSL.BO',         // Max Financial Services
      'PERSISTENT.BO',   // Persistent Systems (IT)
      'RAMCOCEM.BO',     // Ramco Cements
      'SBILIFE.BO',      // SBI Life Insurance (already in NSE as SBILIFE.NS)
      'SUNTV.BO',        // Sun TV Network
      'UPL.BO',          // UPL Ltd (Agri chemicals)
      'VOLTAS.BO',       // Voltas (Blue Star)
      'ZYDUSLIFE.BO',    // Zydus Lifesciences
    ];

    // Index symbols (NSE + BSE indices)
    this.indexSymbols = {
      // NSE Indices
      'NIFTY50': '^NSEI',
      'BANKNIFTY': '^NSEBANK',
      // BSE Indices
      'SENSEX': '^BSESN',
      'BSE100': '^BSESN',     // BSE 100 (using SENSEX as proxy)
      'BSEBANK': '^BSEBANK',  // BSE Bankex
      'BSESENSEX': '^BSESN',  // BSE Sensex (30 stocks)
    };

    this.updateInterval = null;
  }

  async initialize() {
    this.logger.info('📡 Initializing NSE/BSE Adapter...');
    
    // Fetch initial data
    await this.refreshMarketData();
    
    this.logger.info(`✅ NSE/BSE Adapter ready — tracking ${this.trackedSymbols.length} symbols`);
    return true;
  }

  // Main data refresh - fetch all tracked symbols
  async refreshMarketData() {
    const fetchPromises = this.trackedSymbols.map(symbol => 
      this.fetchSymbolData(symbol).catch(err => {
        this.logger.warn(`Failed to fetch ${symbol}: ${err.message}`);
        return null;
      })
    );

    // Also fetch index data
    const indexPromises = Object.values(this.indexSymbols).map(symbol =>
      this.fetchSymbolData(symbol).catch(err => null)
    );

    await Promise.all([...fetchPromises, ...indexPromises]);
  }

  // Fetch data for a single symbol using Yahoo Finance
  async fetchSymbolData(yahooSymbol) {
    try {
      // Use Yahoo Finance API (unofficial but reliable)
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
      const response = await axios.get(url, {
        params: {
          interval: '1d',
          range: '2mo', // 2 months of daily data
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) return null;

      const timestamps = result.timestamp || [];
      const quotes = result.indicators?.quote?.[0] || {};
      const adjClose = result.indicators?.adjclose?.[0]?.adjclose || quotes.close;

      const prices = quotes.close?.filter(p => p !== null) || [];
      const volumes = quotes.volume?.filter(v => v !== null) || [];
      const highs = quotes.high?.filter(h => h !== null) || [];
      const lows = quotes.low?.filter(h => h !== null) || [];

      // Current price
      const currentPrice = prices[prices.length - 1];
      const prevClose = prices[prices.length - 2] || currentPrice;
      const dayOpen = prices[prices.length - 5] || prices[0]; // Approximate

      // Calculate RSI (14-day)
      const rsi = this.calculateRSI(prices.slice(-15), 14);

      // Calculate SMA
      const sma20 = this.sma(prices.slice(-20));
      const sma50 = prices.length >= 50 ? this.sma(prices.slice(-50)) : null;

      // Calculate EMA
      const ema9 = this.ema(prices.slice(-20), 9);

      // Calculate ATR (14-day)
      const atr = this.calculateATR(highs, lows, prices, 14);

      // Volume analysis
      const avgVolume = this.sma(volumes.slice(-20));
      const volumeRatio = volumes[volumes.length - 1] / avgVolume;

      const symbol = yahooSymbol.replace('.NS', '').replace('.BO', '');
      
      this.marketData[symbol] = {
        yahooSymbol,
        prices,
        volumes,
        highs,
        lows,
        currentPrice,
        prevClose,
        dayOpen,
        dayChange: ((currentPrice - prevClose) / prevClose) * 100,
        high52w: Math.max(...prices.slice(-252).filter(p => p)),
        low52w: Math.min(...prices.slice(-252).filter(p => p)),
        rsi,
        sma20,
        sma50,
        ema9,
        atr,
        avgVolume,
        volumeRatio,
        timestamp: new Date().toISOString(),
      };

      this.prices[symbol] = currentPrice;
      
      return this.marketData[symbol];
    } catch (error) {
      this.logger.warn(`Error fetching ${yahooSymbol}: ${error.message}`);
      return null;
    }
  }

  // Fetch from NSE India website (backup method)
  async fetchNSEWebsite(symbol) {
    try {
      // Remove .NS suffix for NSE website
      const nseSymbol = symbol.replace('.NS', '').toUpperCase();
      const url = `https://www.nseindia.com/api/quoteEquity?symbol=${nseSymbol}`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.nseindia.com/',
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      this.logger.warn(`NSE website fetch failed for ${symbol}: ${error.message}`);
      return null;
    }
  }

  // Get market breadth (advance/decline)
  async getMarketBreadth() {
    try {
      const url = 'https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050';
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://www.nseindia.com/',
        },
        timeout: 10000,
      });

      const stocks = response.data?.data || [];
      let advances = 0, declines = 0;
      
      for (const stock of stocks) {
        const change = stock.pChange || 0;
        if (change > 0) advances++;
        else if (change < 0) declines++;
      }

      return { advances, declines, total: stocks.length };
    } catch (error) {
      return { advances: 0, declines: 0, total: 0 };
    }
  }

  // Get all market data
  getMarketData() {
    return this.marketData;
  }

  // Get current price for a symbol
  getCurrentPrice(symbol) {
    return this.prices[symbol] || this.prices[symbol + '.NS'] || null;
  }

  // Get lot size for a symbol (NSE futures/options lot sizes)
  getLotSize(symbol) {
    const lotSizes = {
      'RELIANCE': 250, 'TCS': 100, 'HDFCBANK': 250, 'INFY': 125,
      'ICICIBANK': 275, 'SBIN': 1500, 'BHARTIARTL': 1250, 'ITC': 1200,
      'KOTAKBANK': 200, 'LT': 150, 'HUL': 125, 'SUNPHARMA': 125,
      'ASIANPAINT': 125, 'NESTLEIND': 50, 'MARUTI': 50, 'AXISBANK': 200,
      'BAJFINANCE': 125, '': 250, 'ADANIPORTS': 500, 'ONGC': 2500,
      'NIFTY50': 75, 'BANKNIFTY': 30, 'SENSEX': 1,
    };
    return lotSizes[symbol] || 1;
  }

  // Get positions
  async getPositions() {
    return this.positions;
  }

  // Place order (paper trading - simulates)
  async placeOrder(symbol, type, quantity, price) {
    if (this.mode !== 'paper') {
      // Live trading - integrate with broker API here
      throw new Error('Live trading not configured');
    }

    const order = {
      symbol,
      type,
      quantity,
      price,
      orderId: `PAPER-${Date.now()}`,
      status: 'FILLED',
      timestamp: new Date().toISOString(),
      mode: 'paper',
    };

    this.logger.info(`📝 Paper Order: ${type} ${quantity} ${symbol} @ ₹${price}`);
    return order;
  }

  // Calculate RSI
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;
    
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // Calculate SMA
  sma(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  // Calculate EMA
  ema(prices, period) {
    if (prices.length < period) return prices[prices.length - 1];
    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
  }

  // Calculate ATR
  calculateATR(highs, lows, closes, period = 14) {
    if (highs.length < period + 1) return 0;
    const trueRanges = [highs[0] - lows[0]];
    for (let i = 1; i < highs.length; i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      trueRanges.push(tr);
    }
    return this.sma(trueRanges.slice(-period));
  }

  // Stop the adapter
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.logger.info('NSE/BSE Adapter stopped');
  }
}

module.exports = NSEBSEAdapter;
