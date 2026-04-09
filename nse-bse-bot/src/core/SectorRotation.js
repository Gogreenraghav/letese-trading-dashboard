/**
 * Sector Rotation Strategy
 * Rotates between sectors based on momentum and market regime
 */

const Logger = require('../utils/logger');

class SectorRotation {
  constructor(options = {}) {
    this.logger = options.logger || new Logger({ module: 'SectorRotation' });

    this.sectors = {
      IT: {
        stocks: ['TCS', 'INFY', 'WIPRO', 'TECHM', 'HCLTECH', 'LTIM'],
        momentum: 0,
        allocation: 0,
      },
      BANKING: {
        stocks: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK', 'AXISBANK', 'INDUSINDBK'],
        momentum: 0,
        allocation: 0,
      },
      FMCG: {
        stocks: ['ITC', 'HUL', 'NESTLEIND', 'BRITANNIA', 'COLPAL', 'MARICO'],
        momentum: 0,
        allocation: 0,
      },
      PHARMA: {
        stocks: ['SUNPHARMA', 'DRREDDY', 'CIPLA', 'LUPIN', 'APLLTD', 'BIOCON'],
        momentum: 0,
        allocation: 0,
      },
      AUTO: {
        stocks: ['MARUTI', 'M&M', 'TATAMOTORS', 'BAJAJ-AUTO', 'HEROMOTOCO'],
        momentum: 0,
        allocation: 0,
      },
      ENERGY: {
        stocks: ['RELIANCE', 'ONGC', 'IOC', 'BPCL', 'POWERGRID'],
        momentum: 0,
        allocation: 0,
      },
      FINANCE: {
        stocks: ['BAJFINANCE', 'BAJAJFINSV', 'HDFCLIFE', 'ICICIPrudential'],
        momentum: 0,
        allocation: 0,
      },
    };

    this.marketRegime = 'SIDEWAYS'; // BULL, BEAR, SIDEWAYS
    this.cycleDays = 21; // Check rotation every 21 trading days
    this.topSectors = [];
  }

  /**
   * Analyze sector momentum based on recent performance
   * @param {Object} marketData - { symbol: { prices, dayChange, rsi } }
   */
  analyzeSectors(marketData) {
    const results = {};

    for (const [sectorName, sector] of Object.entries(this.sectors)) {
      const stockPerformances = [];

      for (const symbol of sector.stocks) {
        const data = marketData[symbol];
        if (!data?.prices || data.prices.length < 5) continue;

        // Calculate recent momentum (last 5 days)
        const recent = data.prices.slice(-5);
        const change = ((recent[recent.length - 1] - recent[0]) / recent[0]) * 100;
        const volumeOk = data.volumes?.length > 0;
        const rsiOk = (data.rsi > 40 && data.rsi < 70);

        stockPerformances.push({
          symbol,
          change,
          rsi: data.rsi || 50,
          volumeOk,
          score: change + (rsiOk ? 5 : -5) + (volumeOk ? 3 : 0),
        });
      }

      if (stockPerformances.length === 0) {
        results[sectorName] = { momentum: 0, stocks: sector.stocks, topStocks: [], recommendation: 'AVOID' };
        continue;
      }

      // Sector momentum = average of top-3 stocks
      const topStocks = stockPerformances.sort((a, b) => b.score - a.score).slice(0, 3);
      const sectorMomentum = topStocks.reduce((s, st) => s + st.change, 0) / topStocks.length;
      const avgRSI = topStocks.reduce((s, st) => s + st.rsi, 0) / topStocks.length;

      let recommendation = 'HOLD';
      if (sectorMomentum > 2 && avgRSI > 50 && avgRSI < 70) recommendation = 'OVERWEIGHT';
      else if (sectorMomentum > 4) recommendation = 'BUY';
      else if (sectorMomentum < -2 && avgRSI < 50) recommendation = 'UNDERWEIGHT';
      else if (sectorMomentum < -4) recommendation = 'SELL';

      results[sectorName] = {
        momentum: parseFloat(sectorMomentum.toFixed(2)),
        avgRSI: Math.round(avgRSI),
        topStocks,
        recommendation,
        stockCount: stockPerformances.length,
      };
    }

    // Rank sectors by momentum
    const ranked = Object.entries(results)
      .sort((a, b) => b[1].momentum - a[1].momentum);

    this.topSectors = ranked.map(([name, data]) => ({ name, ...data }));

    // Detect market regime
    const positive = ranked.filter(([, d]) => d.momentum > 0).length;
    const negative = ranked.filter(([, d]) => d.momentum < 0).length;
    const totalMomentum = ranked.reduce((s, [, d]) => s + d.momentum, 0);

    if (positive >= 5 && totalMomentum > 10) this.marketRegime = 'BULL';
    else if (negative >= 5 && totalMomentum < -10) this.marketRegime = 'BEAR';
    else this.marketRegime = 'SIDEWAYS';

    this.logger?.info(`📊 Market Regime: ${this.marketRegime} | Top sector: ${this.topSectors[0]?.name} (${this.topSectors[0]?.momentum}%)`);

    return {
      regimes: this.marketRegime,
      sectors: results,
      topSectors: this.topSectors,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get stocks to buy in top-performing sectors
   * @param {Object} marketData 
   * @param {Array} existingPositions 
   * @param {number} maxPerSector 
   */
  getRotationRecommendations(marketData, existingPositions = [], maxPerSector = 2) {
    const recommendations = [];
    const existingSymbols = existingPositions.map(p => p.symbol);

    // Only buy from top 3 sectors
    for (const sector of this.topSectors.slice(0, 3)) {
      if (sector.momentum < 1) continue; // Skip weak sectors
      if (sector.recommendation === 'AVOID' || sector.recommendation === 'SELL') continue;

      const sectorStocks = sector.topStocks.filter(st => {
        if (existingSymbols.includes(st.symbol)) return false;
        if (st.rsi > 70 || st.rsi < 30) return false; // Skip overbought/oversold
        return true;
      });

      for (const stock of sectorStocks.slice(0, maxPerSector)) {
        recommendations.push({
          symbol: stock.symbol,
          sector: sector.name,
          change: stock.change,
          rsi: stock.rsi,
          score: stock.score,
          reason: `${sector.name} momentum +${sector.momentum}%, RSI ${stock.rsi}`,
          confidence: Math.min(0.9, 0.5 + Math.abs(stock.change) / 20),
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Get stocks to SELL from underperforming sectors
   */
  getRotationExits(marketData, existingPositions) {
    const exitSignals = [];
    const exitSectors = this.topSectors.slice(-2); // Bottom 2 sectors

    for (const pos of existingPositions) {
      const holdingSector = this.getStockSector(pos.symbol);
      const sectorData = this.sectors[holdingSector];
      const marketDataStock = marketData[pos.symbol];

      if (!sectorData || !marketDataStock?.rsi) continue;

      // Sell if in weak sector + RSI overbought
      const sectorWeak = exitSectors.find(s => s.name === holdingSector);
      if (sectorWeak && marketDataStock.rsi > 65) {
        exitSignals.push({
          symbol: pos.symbol,
          sector: holdingSector,
          reason: `${holdingSector} weak (${sectorWeak.momentum}%), RSI overbought ${marketDataStock.rsi.toFixed(0)}`,
          action: 'SELL',
          urgency: 'HIGH',
        });
      }

      // Sell if in sector with negative momentum and stock showing loss
      if (sectorWeak?.momentum < -3 && (pos.pnl || 0) < 0) {
        exitSignals.push({
          symbol: pos.symbol,
          sector: holdingSector,
          reason: `${holdingSector} down ${sectorWeak.momentum}%, position at loss`,
          action: 'SELL',
          urgency: 'MEDIUM',
        });
      }
    }

    return exitSignals;
  }

  /**
   * Get sector for a symbol
   */
  getStockSector(symbol) {
    for (const [name, sector] of Object.entries(this.sectors)) {
      if (sector.stocks.includes(symbol)) return name;
    }
    return 'OTHER';
  }

  /**
   * Get regime-based strategy adjustment
   */
  getStrategyForRegime() {
    switch (this.marketRegime) {
      case 'BULL':
        return {
          strategy: 'MOMENTUM',
          description: 'Ride the trend — momentum + breakout stocks',
          positionSize: 1.5,  // increase size by 50%
          stopLossPercent: 3,
          targetPercent: 8,
          maxPositions: 8,
        };
      case 'BEAR':
        return {
          strategy: 'DEFENSIVE',
          description: 'Reduce exposure — pharma/FMCG/finance only',
          positionSize: 0.5,  // cut size by 50%
          stopLossPercent: 1.5,
          targetPercent: 4,
          maxPositions: 3,
        };
      case 'SIDEWAYS':
      default:
        return {
          strategy: 'SWING',
          description: 'Range-bound — buy dips, sell rips',
          positionSize: 1.0,
          stopLossPercent: 2,
          targetPercent: 5,
          maxPositions: 5,
        };
    }
  }
}

module.exports = SectorRotation;
