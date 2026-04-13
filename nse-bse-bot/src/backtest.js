/**
 * Backtesting Engine for NSE/BSE Stocks
 * Tests trading strategies against historical data
 * 
 * Run: node src/backtest.js
 */

require('dotenv').config();
const yfinance = require('yfinance');

const STRATEGIES = {
  momentum: require('./strategies/momentumStrategy'),
  mean_reversion: require('./strategies/meanReversionStrategy'),
  breakout: require('./strategies/breakoutStrategy'),
};

async function fetchHistoricalData(symbol, days = 365) {
  try {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    
    const data = await yfinance.download(symbol, {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      interval: '1d',
    });
    
    if (!data || data.length === 0) return null;
    
    // yfinance returns DataFrame with Close, Open, High, Low, Volume columns
    return {
      symbol,
      closes: Array.from(data['Close'].values()),
      highs: Array.from(data['High'].values()),
      lows: Array.from(data['Low'].values()),
      opens: Array.from(data['Open'].values()),
      volumes: Array.from(data['Volume'].values()),
      dates: data.index.map(d => new Date(d)),
    };
  } catch (err) {
    console.error(`Failed to fetch ${symbol}:`, err.message);
    return null;
  }
}

function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) return [];
  const changes = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }
  
  const gains = changes.map(c => (c > 0 ? c : 0));
  const losses = changes.map(c => (c < 0 ? -c : 0));
  
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  const rsi = [null]; // First period values are null
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }
  return rsi;
}

function calculateSMA(closes, period) {
  const sma = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      const slice = closes.slice(i - period + 1, i + 1);
      sma.push(slice.reduce((a, b) => a + b, 0) / period);
    }
  }
  return sma;
}

function calculateEMA(closes, period) {
  const k = 2 / (period + 1);
  const ema = [closes[0]];
  for (let i = 1; i < closes.length; i++) {
    ema.push(closes[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

function calculateBollingerBands(closes, period = 20, stdDev = 2) {
  const sma = calculateSMA(closes, period);
  const bands = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      bands.push({ upper: null, middle: null, lower: null });
    } else {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      bands.push({
        upper: mean + stdDev * std,
        middle: mean,
        lower: mean - stdDev * std,
      });
    }
  }
  return bands;
}

function generateSignal(symbol, data, index, strategy) {
  const { closes, highs, lows, volumes } = data;
  const i = index;
  
  if (i < 20) return null; // Need at least 20 days
  
  const close = closes[i];
  const prevClose = closes[i - 1];
  const rsi = calculateRSI(closes);
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const bb = calculateBollingerBands(closes);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const volume = volumes[i];
  const avgVolume = volumes.slice(Math.max(0, i - 20), i).reduce((a, b) => a + b, 0) / Math.min(21, i);
  
  switch (strategy) {
    case 'momentum': {
      // BUY: Price above both EMAs, RSI in 40-70, volume above average
      if (close > ema9[i] && close > ema21[i] && ema9[i] > ema21[i] &&
          rsi[i] > 45 && rsi[i] < 70 && volume > avgVolume * 1.2) {
        const stopLoss = close * 0.97;
        const target = close * 1.06;
        return { action: 'BUY', confidence: 0.7, stopLoss, target, reason: 'Momentum: EMA crossover + RSI confirmation' };
      }
      // SELL: Price below EMA or RSI overbought
      if (close < ema9[i] * 0.97 || rsi[i] > 80) {
        return { action: 'SELL', confidence: 0.6, reason: 'Momentum: Trend reversal' };
      }
      return null;
    }
    
    case 'mean_reversion': {
      // BUY: Price near lower Bollinger Band, RSI < 40, above SMA50
      if (close <= bb[i].lower * 1.02 && rsi[i] < 40 && close > sma50[i]) {
        const stopLoss = bb[i].lower * 0.98;
        const target = bb[i].middle;
        return { action: 'BUY', confidence: 0.72, stopLoss, target, reason: 'Mean reversion: At lower band + RSI oversold' };
      }
      // SELL: Price at upper band or RSI > 65
      if (close >= bb[i].upper * 0.98 || rsi[i] > 65) {
        return { action: 'SELL', confidence: 0.68, reason: 'Mean reversion: At upper band' };
      }
      return null;
    }
    
    case 'breakout': {
      // Find 20-day high and low
      const high20 = Math.max(...highs.slice(i - 20, i));
      const low20 = Math.min(...lows.slice(i - 20, i));
      
      // BUY: Breakout above 20-day high with volume
      if (close > high20 * 1.01 && volume > avgVolume * 1.5) {
        const stopLoss = low20;
        const target = close + (close - low20) * 2;
        return { action: 'BUY', confidence: 0.75, stopLoss, target, reason: `Breakout: New 20-day high (${high20.toFixed(0)})` };
      }
      // SELL: Breakdown below 20-day low
      if (close < low20 * 0.99) {
        return { action: 'SELL', confidence: 0.7, reason: `Breakout: Breakdown below 20-day low (${low20.toFixed(0)})` };
      }
      return null;
    }
    
    default:
      return null;
  }
}

async function runBacktest(symbol, strategy, options = {}) {
  const {
    capital = 1000000,
    maxRiskPerTrade = 2,
    days = 365,
    stopLossPct = 3,
    targetPct = 6,
  } = options;
  
  console.log(`\n📊 Backtesting ${symbol} with ${strategy.toUpperCase()} strategy (${days} days)...`);
  
  const data = await fetchHistoricalData(symbol, days);
  if (!data) return null;
  
  const { closes, dates } = data;
  console.log(`  Loaded ${closes.length} days of data (${dates[0].toLocaleDateString()} to ${dates[dates.length-1].toLocaleDateString()})`);
  
  let cash = capital;
  let position = null;
  const trades = [];
  const equityCurve = [];
  
  for (let i = 21; i < closes.length; i++) {
    const date = dates[i];
    const price = closes[i];
    
    // Calculate current portfolio value
    const portfolioValue = position ? position.quantity * price + cash : cash;
    equityCurve.push({ date, value: portfolioValue });
    
    // Check trailing stop for existing position
    if (position) {
      const pnlPct = (price - position.entryPrice) / position.entryPrice * 100;
      
      // Trailing stop: move stop loss as price rises
      const newStop = Math.max(position.stopLoss, position.entryPrice * (1 + (pnlPct - 5) / 100));
      
      // Exit conditions
      const shouldExit = (
        price <= newStop || // Trailing stop hit
        price >= position.target || // Target hit
        pnlPct <= -stopLossPct // Max loss hit
      );
      
      if (shouldExit) {
        const pnl = (price - position.entryPrice) * position.quantity;
        cash += position.quantity * price;
        trades.push({
          entryDate: position.entryDate,
          exitDate: date,
          symbol,
          action: 'SELL',
          entryPrice: position.entryPrice,
          exitPrice: price,
          quantity: position.quantity,
          pnl,
          pnlPct,
          strategy,
          holdingDays: Math.round((date - position.entryDate) / (1000 * 60 * 60 * 24)),
        });
        position = null;
      }
    }
    
    // Check for new entry signal
    if (!position) {
      const signal = generateSignal(symbol, data, i, strategy);
      
      if (signal && signal.action === 'BUY') {
        const riskAmount = cash * (maxRiskPerTrade / 100);
        const stopDistance = price - signal.stopLoss;
        if (stopDistance > 0) {
          const quantity = Math.floor(riskAmount / stopDistance);
          if (quantity >= 1 && quantity * price <= cash * 0.3) { // Max 30% in one trade
            cash -= quantity * price;
            position = {
              symbol,
              quantity,
              entryPrice: price,
              entryDate: date,
              stopLoss: signal.stopLoss || price * (1 - stopLossPct / 100),
              target: signal.target || price * (1 + targetPct / 100),
              strategy,
              confidence: signal.confidence,
            };
          }
        }
      }
    }
  }
  
  // Close any open position at end
  if (position) {
    const exitPrice = closes[closes.length - 1];
    const pnl = (exitPrice - position.entryPrice) * position.quantity;
    trades.push({
      entryDate: position.entryDate,
      exitDate: dates[closes.length - 1],
      symbol,
      action: 'CLOSE',
      entryPrice: position.entryPrice,
      exitPrice,
      quantity: position.quantity,
      pnl,
      pnlPct: (exitPrice - position.entryPrice) / position.entryPrice * 100,
      strategy,
      holdingDays: Math.round((dates[closes.length - 1] - position.entryDate) / (1000 * 60 * 60 * 24)),
    });
  }
  
  // Calculate statistics
  const finalValue = position ? position.quantity * closes[closes.length - 1] + cash : cash;
  const totalReturn = (finalValue - capital) / capital * 100;
  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl <= 0);
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
  const profitFactor = avgLoss > 0 ? (avgWin * wins.length) / (avgLoss * losses.length) : 0;
  
  // Max drawdown
  let peak = capital;
  let maxDrawdown = 0;
  for (const point of equityCurve) {
    if (point.value > peak) peak = point.value;
    const drawdown = (peak - point.value) / peak * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  
  // Sharpe ratio (simplified)
  const dailyReturns = [];
  for (let i = 1; i < equityCurve.length; i++) {
    dailyReturns.push((equityCurve[i].value - equityCurve[i - 1].value) / equityCurve[i - 1].value);
  }
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);
  const sharpe = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
  
  const stats = {
    symbol,
    strategy,
    period: { start: dates[0].toISOString().split('T')[0], end: dates[closes.length - 1].toISOString().split('T')[0], days: closes.length },
    capital,
    finalValue: Math.round(finalValue),
    totalReturn: totalReturn.toFixed(2),
    totalPnl: Math.round(totalPnl),
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: winRate.toFixed(1),
    avgWin: Math.round(avgWin),
    avgLoss: Math.round(avgLoss),
    profitFactor: profitFactor.toFixed(2),
    maxDrawdown: maxDrawdown.toFixed(2),
    sharpeRatio: sharpe.toFixed(2),
    bestTrade: Math.max(...trades.map(t => t.pnl)),
    worstTrade: Math.min(...trades.map(t => t.pnl)),
    avgHoldingDays: trades.length > 0 ? Math.round(trades.reduce((s, t) => s + t.holdingDays, 0) / trades.length) : 0,
    trades,
  };
  
  return stats;
}

async function runMultiStrategy(symbol, options = {}) {
  const results = {};
  for (const [name, strategy] of Object.entries(STRATEGIES)) {
    results[name] = await runBacktest(symbol, name, options);
  }
  return results;
}

async function runTopStocksBacktest(options = {}) {
  const stocks = [
    'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS',
    'ICICIBANK.NS', 'SBIN.NS', 'BAJFINANCE.NS', 'HINDUNILVR.NS',
    'ITC.NS', 'KOTAKBANK.NS', 'LT.NS', 'SUNPHARMA.NS',
    'ADANIENT.NS', 'COALINDIA.NS', 'NESTLEIND.NS', 'TATAMOTORS.NS',
  ];
  
  const allResults = [];
  
  for (const stock of stocks) {
    const result = await runBacktest(stock, 'momentum', { ...options, days: options.days || 180 });
    if (result) allResults.push(result);
  }
  
  // Sort by win rate
  allResults.sort((a, b) => b.winRate - a.winRate);
  
  // Find best strategy per stock
  const summary = allResults.map(r => ({
    symbol: r.symbol,
    totalReturn: r.totalReturn + '%',
    winRate: r.winRate + '%',
    trades: r.totalTrades,
    pnl: '₹' + r.totalPnl.toLocaleString('en-IN'),
    sharpe: r.sharpeRatio,
    maxDD: r.maxDrawdown + '%',
  }));
  
  return { summary, results: allResults };
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.length === 0) {
    console.log(`
📊 NSE-BSE Backtesting Engine

Usage:
  node src/backtest.js <symbol> <strategy> [days] [capital]
  node src/backtest.js --all [days]  — Test all major stocks
  node src/backtest.js --strategies <symbol> [days] — Compare all strategies

Examples:
  node src/backtest.js RELIANCE.NS momentum 365 1000000
  node src/backtest.js TCS.NS mean_reversion 180
  node src/backtest.js --all 180
  node src/backtest.js --strategies RELIANCE.NS 365

Strategies: momentum, mean_reversion, breakout
    `);
    return;
  }
  
  if (args[0] === '--all') {
    const days = parseInt(args[1]) || 180;
    console.log(`\n🚀 Running backtest on 16 NSE stocks (${days} days)...`);
    const result = await runTopStocksBacktest({ days });
    
    console.log(`\n📊 BACKTEST RESULTS — Top NSE Stocks (${days} days, momentum strategy)`);
    console.log('═'.repeat(100));
    console.log(`${'Symbol'.padEnd(15)} ${'Return'.padEnd(10)} ${'Win%'.padEnd(8)} ${'Trades'.padEnd(7)} ${'P&L'.padEnd(12)} ${'Sharpe'.padEnd(8)} ${'Max DD'}`);
    console.log('─'.repeat(100));
    
    for (const s of result.summary) {
      console.log(
        `${s.symbol.padEnd(15)} ${s.totalReturn.padEnd(10)} ${s.winRate.padEnd(8)} ${s.trades.toString().padEnd(7)} ${s.pnl.padEnd(12)} ${s.sharpe.padEnd(8)} ${s.maxDD}`
      );
    }
    
    return result;
  }
  
  if (args[0] === '--strategies') {
    const symbol = args[1] || 'RELIANCE.NS';
    const days = parseInt(args[2]) || 365;
    
    const results = await runMultiStrategy(symbol, { days });
    
    console.log(`\n📊 STRATEGY COMPARISON — ${symbol} (${days} days)`);
    console.log('═'.repeat(80));
    
    for (const [name, r] of Object.entries(results)) {
      if (!r) { console.log(`${name}: No data`); continue; }
      console.log(`\n${name.toUpperCase()} Strategy:`);
      console.log(`  Return: ${r.totalReturn}%  |  Win Rate: ${r.winRate}%  |  Sharpe: ${r.sharpeRatio}  |  Max DD: ${r.maxDrawdown}%`);
      console.log(`  Trades: ${r.totalTrades}  |  P&L: ₹${r.totalPnl.toLocaleString('en-IN')}  |  Profit Factor: ${r.profitFactor}`);
      if (r.trades.length > 0) {
        console.log(`  Best: ₹${r.bestTrade.toLocaleString('en-IN')}  |  Worst: ₹${r.worstTrade.toLocaleString('en-IN')}`);
      }
    }
    
    return results;
  }
  
  // Single stock backtest
  const symbol = args[0] || 'RELIANCE.NS';
  const strategy = args[1] || 'momentum';
  const days = parseInt(args[2]) || 365;
  const capital = parseInt(args[3]) || 1000000;
  
  const result = await runBacktest(symbol, strategy, { days, capital });
  
  if (!result) {
    console.error(`❌ Failed to backtest ${symbol}`);
    return;
  }
  
  console.log(`\n📊 BACKTEST RESULTS — ${symbol} (${strategy.toUpperCase()})`);
  console.log('═'.repeat(70));
  console.log(`Period:     ${result.period.start} to ${result.period.end} (${result.period.days} days)`);
  console.log(`Capital:     ₹${result.capital.toLocaleString('en-IN')} → ₹${result.finalValue.toLocaleString('en-IN')}`);
  console.log(`Return:     ${result.totalReturn}%`);
  console.log(`Total P&L:  ₹${result.totalPnl.toLocaleString('en-IN')}`);
  console.log('');
  console.log(`Trades:     ${result.totalTrades} total | ${result.wins} wins | ${result.losses} losses`);
  console.log(`Win Rate:   ${result.winRate}%`);
  console.log(`Avg Win:    ₹${result.avgWin.toLocaleString('en-IN')}  |  Avg Loss: ₹${result.avgLoss.toLocaleString('en-IN')}`);
  console.log(`Profit F:   ${result.profitFactor}x`);
  console.log(`Sharpe:     ${result.sharpeRatio}`);
  console.log(`Max DD:     ${result.maxDrawdown}%`);
  console.log(`Best Trade: ₹${result.bestTrade.toLocaleString('en-IN')}`);
  console.log(`Worst Trade: ₹${result.worstTrade.toLocaleString('en-IN')}`);
  console.log(`Avg Hold:   ${result.avgHoldingDays} days`);
  
  if (result.trades.length > 0) {
    console.log(`\n📋 Trade History:`);
    console.log('─'.repeat(70));
    console.log(`${'Date'.padEnd(12)} ${'Action'.padEnd(6)} ${'Entry'.padEnd(10)} ${'Exit'.padEnd(10)} ${'Qty'.padEnd(5)} ${'P&L'.padEnd(10)} ${'Return'}`);
    console.log('─'.repeat(70));
    for (const t of result.trades) {
      const date = new Date(t.exitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      console.log(
        `${date.padEnd(12)} ${t.action.padEnd(6)} ₹${t.entryPrice.toFixed(0).padEnd(9)} ₹${t.exitPrice.toFixed(0).padEnd(9)} ${t.quantity.toString().padEnd(5)} ${(t.pnl >= 0 ? '+' : '') + '₹' + t.pnl.toFixed(0).padEnd(9)} ${t.pnlPct.toFixed(1)}%`
      );
    }
  }
  
  return result;
}

module.exports = { runBacktest, runMultiStrategy, runTopStocksBacktest };

if (require.main === module) {
  main().catch(console.error);
}
