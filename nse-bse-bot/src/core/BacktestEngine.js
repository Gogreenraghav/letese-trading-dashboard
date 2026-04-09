/**
 * Backtesting Engine
 * Validates trading strategies on historical NSE/BSE data
 */

const axios = require('axios');

class BacktestEngine {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.results = null;
  }

  // Fetch historical OHLCV data from Yahoo Finance
  async fetchHistoricalData(symbol, interval = '1d', range = '3mo') {
    try {
      const sym = symbol.includes('.NS') || symbol.includes('.BO') ? symbol : `${symbol}.NS`;
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=${interval}&range=${range}`;
      const response = await axios.get(url, { timeout: 15000 });
      const result = response.data?.chart?.result?.[0];
      if (!result) throw new Error('No data from Yahoo Finance');

      const timestamps = result.timestamp || [];
      const quote = result.indicators?.quote?.[0] || {};

      return timestamps.map((t, i) => ({
        time: t * 1000,
        date: new Date(t * 1000).toISOString().split('T')[0],
        open: quote.open?.[i] || 0,
        high: quote.high?.[i] || 0,
        low: quote.low?.[i] || 0,
        close: quote.close?.[i] || 0,
        volume: quote.volume?.[i] || 0,
      })).filter(d => d.close > 0);
    } catch (e) {
      this.logger.warn(`Backtest data fetch failed for ${symbol}: ${e.message}`);
      return [];
    }
  }

  // Simple RSI calculation
  calculateRSI(closes, period = 14) {
    const rsi = [];
    for (let i = 0; i < closes.length; i++) {
      if (i < period) { rsi.push(50); continue; }
      let gains = 0, losses = 0;
      for (let j = i - period + 1; j <= i; j++) {
        const diff = closes[j] - closes[j - 1];
        if (diff > 0) gains += diff;
        else losses += Math.abs(diff);
      }
      const avgGain = gains / period;
      const avgLoss = losses / period;
      if (avgLoss === 0) { rsi.push(100); continue; }
      rsi.push(100 - 100 / (1 + avgGain / avgLoss));
    }
    return rsi;
  }

  // SMA calculation
  calculateSMA(data, period) {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) { sma.push(null); continue; }
      const slice = data.slice(i - period + 1, i + 1);
      sma.push(slice.reduce((a, b) => a + b, 0) / period);
    }
    return sma;
  }

  // Simple momentum
  calculateMomentum(closes, period = 10) {
    return closes.map((c, i) => i < period ? 0 : ((c - closes[i - period]) / closes[i - period]) * 100);
  }

  // Run breakout strategy backtest
  async runBreakoutBacktest(symbol, options = {}) {
    const {
      lookbackHigh = 20,
      lookbackLow = 20,
      stopLossPct = 2,
      targetPct = 5,
      capital = 50000,
    } = options;

    const data = await this.fetchHistoricalData(symbol, '1d', '3mo');
    if (data.length < lookbackHigh + 5) {
      return { error: 'Insufficient data', symbol };
    }

    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);
    const rsi = this.calculateRSI(closes);
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);

    const trades = [];
    let portfolio = capital;
    let position = null;
    const avgVolume = volumes.slice(0, 20).reduce((a, b) => a + b, 0) / 20;

    for (let i = lookbackHigh; i < data.length; i++) {
      const day = data[i];
      const prevHigh = Math.max(...highs.slice(i - lookbackHigh, i));
      const prevLow = Math.min(...lows.slice(i - lookbackLow, i));
      const volRatio = day.volume / avgVolume;
      const rsiVal = rsi[i] || 50;
      const sma20Val = sma20[i];
      const sma50Val = sma50[i];

      // Close existing position
      if (position) {
        const daysHeld = (new Date(day.time) - new Date(position.entryTime)) / (1000 * 60 * 60 * 24);
        const pnlPct = ((day.close - position.entryPrice) / position.entryPrice) * 100;

        // Exit conditions
        let exitReason = null;
        if (pnlPct <= -stopLossPct) exitReason = 'STOP_LOSS';
        else if (pnlPct >= targetPct) exitReason = 'TARGET_HIT';
        else if (daysHeld >= 5) exitReason = 'TIME_EXIT';
        else if (sma20Val && day.close < sma20Val) exitReason = 'SMA_CROSS';

        if (exitReason) {
          const pnl = position.shares * (day.close - position.entryPrice);
          trades.push({
            entryDate: position.entryDate,
            exitDate: day.date,
            entryPrice: position.entryPrice,
            exitPrice: day.close,
            pnl: parseFloat(pnl.toFixed(2)),
            pnlPct: parseFloat(pnlPct.toFixed(2)),
            shares: position.shares,
            reason: exitReason,
            daysHeld: Math.round(daysHeld),
            rsi: rsiVal.toFixed(1),
          });
          portfolio += pnl;
          position = null;
        }
        continue;
      }

      // Entry signal: breakout above 20-day high with RSI in range
      const isBreakout = day.close > prevHigh && day.close > sma20Val && rsiVal > 45 && rsiVal < 70;
      const isBreakdown = day.close < prevLow && day.close < sma20Val && rsiVal < 55 && rsiVal > 30;

      if (isBreakout) {
        const riskPerTrade = portfolio * 0.05; // 5% risk
        const stopPrice = day.close * (1 - stopLossPct / 100);
        const riskAmount = day.close - stopPrice;
        const shares = Math.floor(riskPerTrade / riskAmount);
        if (shares < 1) continue;

        position = {
          type: 'LONG',
          entryDate: day.date,
          entryTime: day.time,
          entryPrice: day.close,
          stopLoss: stopPrice,
          target: day.close * (1 + targetPct / 100),
          shares,
          rsi: rsiVal.toFixed(1),
        };
      }
    }

    // Close open position at end
    if (position && data.length > 0) {
      const lastDay = data[data.length - 1];
      const pnl = position.shares * (lastDay.close - position.entryPrice);
      trades.push({
        entryDate: position.entryDate,
        exitDate: lastDay.date,
        entryPrice: position.entryPrice,
        exitPrice: lastDay.close,
        pnl: parseFloat(pnl.toFixed(2)),
        pnlPct: parseFloat(((lastDay.close - position.entryPrice) / position.entryPrice * 100).toFixed(2)),
        shares: position.shares,
        reason: 'END_BACKTEST',
        daysHeld: Math.round((new Date(lastDay.time) - new Date(position.entryTime)) / (1000 * 60 * 60 * 24)),
        rsi: '—',
      });
    }

    // Calculate results
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
    const totalPnL = trades.reduce((a, t) => a + t.pnl, 0);
    const finalCapital = capital + totalPnL;
    const returnPct = (totalPnL / capital) * 100;

    // Max drawdown
    let peak = capital;
    let maxDD = 0;
    let runningCapital = capital;
    for (const t of trades) {
      runningCapital += t.pnl;
      if (runningCapital > peak) peak = runningCapital;
      const dd = peak - runningCapital;
      if (dd > maxDD) maxDD = dd;
    }
    const maxDDPct = peak > 0 ? (maxDD / peak) * 100 : 0;

    // Sortino
    const returns = trades.map(t => (t.pnl / capital) * 100);
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const negReturns = returns.filter(r => r < 0);
    const downsideDev = negReturns.length > 0 ? Math.sqrt(negReturns.reduce((a, r) => a + r * r, 0) / returns.length) : 0.001;
    const sortino = downsideDev > 0 ? (avgReturn / downsideDev) * Math.sqrt(252 / (trades.length || 1)) : 0;
    const sharpe = Math.sqrt(returns.reduce((a, r) => a + (r - avgReturn) ** 2, 0) / Math.max(1, returns.length)) > 0
      ? (avgReturn / Math.sqrt(returns.reduce((a, r) => a + (r - avgReturn) ** 2, 0) / Math.max(1, returns.length))) * Math.sqrt(252 / (trades.length || 1))
      : 0;

    // Monthly breakdown
    const monthlyPnL = {};
    trades.forEach(t => {
      const month = t.exitDate.substring(0, 7);
      if (!monthlyPnL[month]) monthlyPnL[month] = { month, pnl: 0, trades: 0 };
      monthlyPnL[month].pnl += t.pnl;
      monthlyPnL[month].trades++;
    });

    // Equity curve
    let equityCapital = capital;
    const equityCurve = [{ day: 0, value: capital }];
    trades.forEach((t, i) => {
      equityCapital += t.pnl;
      equityCurve.push({ day: i + 1, value: Math.round(equityCapital) });
    });

    return {
      symbol,
      config: { lookbackHigh, lookbackLow, stopLossPct, targetPct, capital },
      dataPoints: data.length,
      tradesExecuted: trades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: winRate.toFixed(1),
      totalPnL: totalPnL.toFixed(2),
      returnPct: returnPct.toFixed(2),
      finalCapital: finalCapital.toFixed(2),
      sharpe: sharpe.toFixed(2),
      sortino: sortino.toFixed(2),
      maxDrawdown: maxDD.toFixed(2),
      maxDrawdownPct: maxDDPct.toFixed(1),
      avgWin: wins.length > 0 ? (wins.reduce((a, t) => a + t.pnl, 0) / wins.length).toFixed(2) : '0.00',
      avgLoss: losses.length > 0 ? (losses.reduce((a, t) => a + t.pnl, 0) / losses.length).toFixed(2) : '0.00',
      bestTrade: wins.length > 0 ? Math.max(...wins.map(t => t.pnl)).toFixed(2) : '0.00',
      worstTrade: losses.length > 0 ? Math.min(...losses.map(t => t.pnl)).toFixed(2) : '0.00',
      monthlyPnL: Object.values(monthlyPnL),
      equityCurve,
      trades: trades.slice(0, 50), // last 50 trades
    };
  }

  // Multi-symbol backtest
  async runMultiBacktest(symbols = [], options = {}) {
    const results = [];
    for (const symbol of symbols) {
      try {
        const result = await this.runBreakoutBacktest(symbol, options);
        if (!result.error) results.push(result);
      } catch (e) {
        this.logger.warn(`Backtest failed for ${symbol}: ${e.message}`);
      }
    }

    // Aggregate stats
    const totalTrades = results.reduce((a, r) => a + r.tradesExecuted, 0);
    const totalPnL = results.reduce((a, r) => a + parseFloat(r.totalPnL), 0);
    const totalWins = results.reduce((a, r) => a + r.wins, 0);
    const avgWinRate = totalTrades > 0 ? (totalWins / totalTrades * 100).toFixed(1) : '0.0';

    return {
      symbols: results.map(r => r.symbol),
      totalTradesExecuted: totalTrades,
      totalPnL: totalPnL.toFixed(2),
      avgWinRate,
      strategies: results.map(r => ({
        symbol: r.symbol,
        trades: r.tradesExecuted,
        pnl: r.totalPnL,
        returnPct: r.returnPct,
        winRate: r.winRate,
        sharpe: r.sharpe,
      })),
    };
  }
}

module.exports = BacktestEngine;
