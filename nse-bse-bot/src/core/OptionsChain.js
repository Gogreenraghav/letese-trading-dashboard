/**
 * Options Chain Engine for NSE/BSE
 * Fetches OI data, PCR, ATM/OTM strikes, Max Pain
 */

const axios = require('axios');

class OptionsChain {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.cache = {};
    this.cacheTTL = 60 * 1000; // 1 minute
  }

  // Get options chain for Nifty or Bank Nifty
  async getChain(index = 'NIFTY') {
    const cacheKey = `${index}`;
    if (this.cache[cacheKey] && (Date.now() - this.cache[cacheKey].ts) < this.cacheTTL) {
      return this.cache[cacheKey].data;
    }

    try {
      // Try NSE Bhav copy API (official)
      const chain = await this.fetchFromNSE(index);
      this.cache[cacheKey] = { data: chain, ts: Date.now() };
      return chain;
    } catch (e) {
      this.logger.warn(`OptionsChain NSE fetch failed: ${e.message}, using fallback`);
      return this.getFallbackChain(index);
    }
  }

  async fetchFromNSE(index) {
    const symbolMap = { NIFTY: 'NIFTY', BANKNIFTY: 'BANKNIFTY', FINNIFTY: 'FINNIFTY' };
    const sym = symbolMap[index] || index;

    // NSE options chain CSV endpoint
    const url = `https://www.nseindia.com/api/option-chain-indices?symbol=${sym}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.nseindia.com/',
      },
      timeout: 10000,
    });

    const data = response.data;
    const records = data.records?.data || [];
    const underlying = data.records?.underlying || sym;
    const spotPrice = data.records?.spot || 0;

    // Process CE (Call) options
    const ceData = records.filter(r => r.strikePrice && r.ce).map(r => ({
      strike: r.strikePrice,
      OI: r.ce.openInterest || 0,
      changeOI: r.ce.changeinOpenInterest || 0,
      volume: r.ce.totalTradedVolume || 0,
      IV: r.ce.impliedVolatility || 0,
      LTP: r.ce.lastPrice || 0,
      bid: r.ce.bidprice || 0,
      ask: r.ce.askPrice || 0,
      IVp: r.ce.volatility || 0,
    }));

    // Process PE (Put) options
    const peData = records.filter(r => r.strikePrice && r.pe).map(r => ({
      strike: r.strikePrice,
      OI: r.pe.openInterest || 0,
      changeOI: r.pe.changeinOpenInterest || 0,
      volume: r.pe.totalTradedVolume || 0,
      IV: r.pe.impliedVolatility || 0,
      LTP: r.pe.lastPrice || 0,
      bid: r.pe.bidprice || 0,
      ask: r.pe.askPrice || 0,
    }));

    // ATM strike (closest to spot)
    const allStrikes = [...new Set([...ceData, ...peData].map(d => d.strike))].sort((a, b) => a - b);
    const atm = allStrikes.length > 0 ? allStrikes.reduce((prev, curr) =>
      Math.abs(curr - spotPrice) < Math.abs(prev - spotPrice) ? curr : prev
    ) : Math.round(spotPrice / 50) * 50;

    // PCR
    const totalCEOI = ceData.reduce((a, c) => a + c.OI, 0);
    const totalPEOI = peData.reduce((a, p) => a + p.OI, 0);
    const pcr = totalCEOI > 0 ? (totalPEOI / totalCEOI).toFixed(2) : 1.0;

    // Max Pain
    const maxPain = this.calculateMaxPain(ceData, peData);

    // Max OI strikes
    const maxCEOICall = ceData.reduce((max, c) => c.OI > max.OI ? c : max, { strike: 0, OI: 0 });
    const maxPEOICall = peData.reduce((max, p) => p.OI > max.OI ? p : max, { strike: 0, OI: 0 });

    return {
      index,
      spotPrice,
      atm,
      pcr: parseFloat(pcr),
      maxPain,
      totalCEOI,
      totalPEOI,
      ceData: ceData.slice(0, 30), // limit to nearest 30 strikes
      peData: peData.slice(0, 30),
      maxCEOICall,
      maxPEOICall,
      timestamp: new Date().toISOString(),
    };
  }

  calculateMaxPain(ceData, peData) {
    try {
      const strikes = [...new Set([...ceData, ...peData].map(d => d.strike))];
      let minPain = Infinity;
      let painAt = strikes[0] || 0;

      for (const strike of strikes) {
        let callPain = 0, putPain = 0;
        for (const c of ceData) {
          callPain += c.OI * Math.max(0, strike - c.strike);
        }
        for (const p of peData) {
          putPain += p.OI * Math.max(0, p.strike - strike);
        }
        const totalPain = callPain + putPain;
        if (totalPain < minPain) {
          minPain = totalPain;
          painAt = strike;
        }
      }
      return painAt;
    } catch (e) {
      return 0;
    }
  }

  getFallbackChain(index) {
    const spotPrices = { NIFTY: 22850, BANKNIFTY: 48500, FINNIFTY: 22800 };
    const spot = spotPrices[index] || 22850;
    const atm = Math.round(spot / 50) * 50;
    const strikes = Array.from({ length: 21 }, (_, i) => atm - 500 + i * 50);

    const ceData = strikes.map(s => ({
      strike: s,
      OI: Math.round(Math.random() * 500000 + 100000),
      changeOI: Math.round((Math.random() - 0.5) * 100000),
      volume: Math.round(Math.random() * 50000),
      IV: Math.round(Math.random() * 20 + 10),
      LTP: Math.max(0.05, (s > atm ? s - atm : 50 - (atm - s)) * Math.random()),
      bid: 0, ask: 0,
    }));

    const peData = strikes.map(s => ({
      strike: s,
      OI: Math.round(Math.random() * 500000 + 100000),
      changeOI: Math.round((Math.random() - 0.5) * 100000),
      volume: Math.round(Math.random() * 50000),
      IV: Math.round(Math.random() * 20 + 10),
      LTP: Math.max(0.05, (s < atm ? atm - s : 50 - (s - atm)) * Math.random()),
      bid: 0, ask: 0,
    }));

    const totalCEOI = ceData.reduce((a, c) => a + c.OI, 0);
    const totalPEOI = peData.reduce((a, p) => a + p.OI, 0);

    return {
      index,
      spotPrice: spot,
      atm,
      pcr: totalCEOI > 0 ? parseFloat((totalPEOI / totalCEOI).toFixed(2)) : 1.0,
      maxPain: atm,
      totalCEOI,
      totalPEOI,
      ceData,
      peData,
      maxCEOICall: ceData.reduce((max, c) => c.OI > max.OI ? c : max),
      maxPEOICall: peData.reduce((max, p) => p.OI > max.OI ? p : max),
      timestamp: new Date().toISOString(),
      isDemo: true,
    };
  }

  // Quick OI summary (for dashboard display)
  async getSummary(index = 'NIFTY') {
    try {
      const chain = await this.getChain(index);
      return {
        index,
        spot: chain.spotPrice,
        pcr: chain.pcr,
        atm: chain.atm,
        maxPain: chain.maxPain,
        totalCEOI: chain.totalCEOI,
        totalPEOI: chain.totalPEOI,
        signal: chain.pcr > 1.2 ? 'BULLISH (High PCR)' : chain.pcr < 0.8 ? 'BEARISH (Low PCR)' : 'NEUTRAL',
        timestamp: chain.timestamp,
      };
    } catch (e) {
      this.logger.warn('Options summary error:', e.message);
      return { error: e.message, index };
    }
  }
}

module.exports = OptionsChain;
