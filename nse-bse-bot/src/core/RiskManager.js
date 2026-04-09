/**
 * Risk Manager
 * Max Loss Circuit, Trailing SL/TP, Position Sizing
 */

const Logger = require('../utils/logger');

class RiskManager {
  constructor(options = {}) {
    this.logger = options.logger || new Logger({ module: 'RiskManager' });
    this.config = {
      maxDailyLoss: parseFloat(process.env.MAX_DAILY_LOSS || 2000),      // ₹2000 max loss/day
      maxPerTradeRisk: parseFloat(process.env.MAX_PER_TRADE_RISK || 10),  // 10% per trade
      maxPositions: parseInt(process.env.MAX_POSITIONS || 5),
      maxPortfolioRisk: parseFloat(process.env.MAX_PORTFOLIO_RISK || 25),  // 25% total portfolio risk
      trailingStopPercent: parseFloat(process.env.TRAILING_STOP_PCT || 2), // 2% trailing SL
      trailingTPPercent: parseFloat(process.env.TRAILING_TP_PCT || 5),     // 5% take profit level
      trailingTPBooking: parseFloat(process.env.TRAILING_TP_BOOKING || 50), // book 50% at TP1
      dailyLossResetHour: 9,  // Reset at market open (IST 9 AM)
      isPaused: false,
      pauseReason: '',
      lastResetDate: this.getTodayIST(),
    };

    this.dailyStats = {
      trades: 0,
      pnl: 0,
      wins: 0,
      losses: 0,
    };
  }

  getTodayIST() {
    return new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  resetIfNewDay() {
    const today = this.getTodayIST();
    if (today !== this.lastResetDate) {
      this.dailyStats = { trades: 0, pnl: 0, wins: 0, losses: 0 };
      this.lastResetDate = today;
      this.config.isPaused = false;
      this.config.pauseReason = '';
      this.logger.info('📅 New day — Daily loss tracker reset');
    }
  }

  // ─── Pre-Trade Checks ───────────────────────────────────────────────

  canTrade(symbol, portfolio, proposedTrade) {
    this.resetIfNewDay();

    // 1. Check if bot is paused due to daily loss
    if (this.config.isPaused) {
      return { allowed: false, reason: `Bot PAUSED: ${this.config.pauseReason}`, code: 'PAUSED' };
    }

    // 2. Check max open positions
    if (portfolio.positions.length >= this.config.maxPositions) {
      return { allowed: false, reason: `Max positions (${this.config.maxPositions}) reached`, code: 'MAX_POSITIONS' };
    }

    // 3. Check if already in this stock
    const existing = portfolio.positions.find(p => p.symbol === symbol);
    if (existing) {
      return { allowed: false, reason: `Already holding ${symbol}`, code: 'DUPLICATE_POSITION' };
    }

    // 4. Check trade size limit
    const tradeValue = proposedTrade.quantity * proposedTrade.price;
    const capitalPercent = (tradeValue / portfolio.cash) * 100;
    if (capitalPercent > this.config.maxPerTradeRisk) {
      return { allowed: false, reason: `Trade size ${capitalPercent.toFixed(1)}% exceeds ${this.config.maxPerTradeRisk}% limit`, code: 'SIZE_LIMIT' };
    }

    // 5. Check daily loss limit (would it breach?)
    const projectedLoss = this.dailyStats.pnl - (proposedTrade.riskPerShare * proposedTrade.quantity);
    if (projectedLoss < -this.config.maxDailyLoss) {
      return { allowed: false, reason: `Would breach daily loss limit (₹${this.config.maxDailyLoss})`, code: 'DAILY_LOSS' };
    }

    // 6. Correlation check — don't pile into same sector
    const sectorExposure = this.getSectorExposure(portfolio, symbol);
    if (sectorExposure > this.config.maxPortfolioRisk) {
      return { allowed: false, reason: `Sector exposure ${sectorExposure.toFixed(0)}% too high`, code: 'SECTOR_OVEREXPOSURE' };
    }

    return { allowed: true, reason: 'All checks passed', code: 'OK' };
  }

  // ─── Sector Exposure ───────────────────────────────────────────────
  getSectorExposure(portfolio, newSymbol) {
    const sectors = {
      IT: ['INFY', 'TCS', 'WIPRO', 'TECHM', 'HCLTECH', 'LTIM', 'MindTree'],
      BANKING: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK', 'AXISBANK', 'INDUSINDBK', 'BANDHANBNK'],
      FMCG: ['ITC', 'HUL', 'NESTLEIND', 'BRITANNIA', 'COLPAL', 'MARICO'],
      PHARMA: ['SUNPHARMA', 'DRREDDY', 'CIPLA', 'LUPIN', 'APLLTD', 'BIOCON'],
      AUTO: ['MARUTI', 'M&M', 'TATAMOTORS', 'BAJAJ-AUTO', 'HEROMOTOCO', 'EicherMOTORS'],
      ENERGY: ['RELIANCE', 'ONGC', 'IOC', 'BPCL', 'HINDPETRO', 'GAIL', 'POWERGRID'],
      FINANCE: ['BAJFINANCE', 'BAJAJFINSV', 'MUTUALFUND', 'HDFCLIFE', 'ICICIPrudential'],
    };

    let totalValue = portfolio.cash;
    const symbolSectors = {};

    for (const [sec, syms] of Object.entries(sectors)) {
      for (const sym of syms) {
        const pos = portfolio.positions.find(p => p.symbol === sym);
        if (pos) {
          totalValue += pos.quantity * pos.currentPrice || pos.entryPrice;
          symbolSectors[sym] = sec;
        }
      }
    }

    // Add new symbol sector
    let newSector = 'OTHER';
    for (const [sec, syms] of Object.entries(sectors)) {
      if (syms.includes(newSymbol)) { newSector = sec; break; }
    }

    const newValue = this.getSymbolValue(newSymbol);
    totalValue += newValue;

    const sectorSymbols = [newSymbol, ...portfolio.positions.map(p => p.symbol)]
      .filter(s => symbolSectors[s] === newSector);
    const sectorValue = sectorSymbols.reduce((sum, s) => sum + (s === newSymbol ? newValue : (portfolio.positions.find(p => p.symbol === s)?.currentPrice || 0) * (portfolio.positions.find(p => p.symbol === s)?.quantity || 0)), 0);

    return (sectorValue / totalValue) * 100;
  }

  getSymbolValue(symbol) {
    // Rough estimate based on NSE price data
    return 0; // Will be updated by adapter data
  }

  // ─── Trailing Stop Loss + Take Profit ──────────────────────────────
  evaluatePosition(pos, currentPrice, highOfDay) {
    if (!pos || !pos.entryPrice) return null;

    const entry = pos.entryPrice;
    const pnlPercent = ((currentPrice - entry) / entry) * 100;
    const highSinceEntry = highOfDay || entry;

    // ── Trailing Stop Loss ──────────────────────────────────────────
    let stopLoss = pos.stopLoss || (entry * (1 - (this.config.trailingStopPercent / 100)));

    // Trail SL upward when in profit
    if (pnlPercent > 0) {
      const trailingSL = entry * (1 + (pnlPercent - this.config.trailingStopPercent) / 100);
      if (trailingSL > stopLoss) {
        stopLoss = trailingSL;
      }
    }

    // ── Trailing Take Profit ────────────────────────────────────────
    let action = null;
    let targetPrices = [];
    let bookPercent = 0;

    if (!pos.tp1Hit && pnlPercent >= this.config.trailingTPPercent) {
      // TP1 reached — book 50%
      action = 'BOOK_HALF';
      bookPercent = this.config.trailingTPBooking;
      targetPrices.push({ level: 'TP1', percent: this.config.trailingTPPercent, book: 50 });
    }

    if (pos.tp1Hit && !pos.tp2Hit && pnlPercent >= this.config.trailingTPPercent * 2) {
      // TP2 reached — book remaining
      action = 'BOOK_REMAINING';
      bookPercent = 100 - this.config.trailingTPBooking;
      targetPrices.push({ level: 'TP2', percent: this.config.trailingTPPercent * 2, book: 50 });
    }

    // ── Hard Stop — SL hit ────────────────────────────────────────
    if (currentPrice <= stopLoss) {
      return {
        action: 'STOP_OUT',
        reason: `Stop loss hit @ ₹${currentPrice.toFixed(2)} (SL: ₹${stopLoss.toFixed(2)})`,
        pnlPercent: pnlPercent.toFixed(2),
      };
    }

    // ── Emergency: price falls 3% from high of day in profit ──────
    if (pnlPercent > 2 && highSinceEntry > entry * 1.02) {
      const pullback = ((highSinceEntry - currentPrice) / highSinceEntry) * 100;
      if (pullback > 1.5) {
        return {
          action: 'PROFIT_TAKING',
          reason: `Pullback detected ${pullback.toFixed(1)}% from high — booking profit`,
          pnlPercent: pnlPercent.toFixed(2),
        };
      }
    }

    return {
      action,
      bookPercent,
      targetPrices,
      trailingStop: stopLoss,
      pnlPercent: pnlPercent.toFixed(2),
      highOfDay: highSinceEntry,
    };
  }

  // ─── Post-Trade Record ─────────────────────────────────────────────
  recordTrade(trade) {
    this.dailyStats.trades++;
    this.dailyStats.pnl += trade.pnl || 0;
    if ((trade.pnl || 0) > 0) this.dailyStats.wins++;
    else this.dailyStats.losses++;

    // Check daily loss circuit
    if (this.dailyStats.pnl <= -this.config.maxDailyLoss) {
      this.config.isPaused = true;
      this.config.pauseReason = `Daily loss limit ₹${this.config.maxDailyLoss} reached (current: ₹${this.dailyStats.pnl.toFixed(0)})`;
      this.logger.error('🛑 BOT PAUSED:', this.config.pauseReason);
    }
  }

  // ─── Risk Metrics ──────────────────────────────────────────────────
  updateLimit(key, value) {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return { success: false, error: 'Invalid value' };
    
    const validKeys = {
      maxDailyLoss: 'MAX_DAILY_LOSS',
      maxPerTradeRisk: 'MAX_PER_TRADE_RISK',
      maxPositions: 'MAX_POSITIONS',
      maxPortfolioRisk: 'MAX_PORTFOLIO_RISK',
      trailingStopPercent: 'TRAILING_STOP_PCT',
      trailingTPPercent: 'TRAILING_TP_PCT',
      trailingTPBooking: 'TRAILING_TP_BOOKING',
    };
    
    if (!validKeys[key]) return { success: false, error: 'Unknown parameter' };
    this.config[key] = num;
    this.logger?.info(`✅ Risk limit updated: ${key} = ${num}`);
    return { success: true, key, value: num, label: validKeys[key] };
  }

  getRiskMetrics(portfolio) {
    const dailyLossUsed = Math.max(0, -this.dailyStats.pnl);
    const dailyLossPercent = (dailyLossUsed / this.config.maxDailyLoss) * 100;

    return {
      dailyLossUsed: dailyLossUsed.toFixed(0),
      maxDailyLoss: this.config.maxDailyLoss,
      dailyLossPercent: dailyLossPercent.toFixed(1),
      isPaused: this.config.isPaused,
      pauseReason: this.config.pauseReason,
      openPositions: portfolio.positions.length,
      maxPositions: this.config.maxPositions,
      portfolioRisk: this.getPortfolioRisk(portfolio),
      trailingSLPercent: this.config.trailingStopPercent,
      trailingTPPercent: this.config.trailingTPPercent,
      dayStats: {
        trades: this.dailyStats.trades,
        wins: this.dailyStats.wins,
        losses: this.dailyStats.losses,
        pnl: this.dailyStats.pnl.toFixed(0),
        winRate: this.dailyStats.trades > 0 ? ((this.dailyStats.wins / this.dailyStats.trades) * 100).toFixed(1) : '0',
      },
    };
  }

  getPortfolioRisk(portfolio) {
    if (portfolio.positions.length === 0) return 0;
    const totalValue = portfolio.cash + portfolio.positions.reduce((s, p) => s + (p.currentPrice || p.entryPrice) * p.quantity, 0);
    const positionValue = portfolio.positions.reduce((s, p) => s + (p.currentPrice || p.entryPrice) * p.quantity, 0);
    return ((positionValue / totalValue) * 100).toFixed(1);
  }
}

module.exports = RiskManager;
