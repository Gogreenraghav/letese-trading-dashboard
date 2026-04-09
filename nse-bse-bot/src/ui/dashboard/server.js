/**
 * NSE/BSE Trading Bot Dashboard Server
 * Real-time WebSocket + REST API
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const Logger = require('../../utils/logger');
const path = require('path');
const fs = require('fs');
const aiClient = require('../../utils/aiClient');

class DashboardServer {
  constructor(options = {}) {
    this.logger = options.logger || new Logger('Dashboard');
    this.engine = options.engine;
    this.adapter = options.adapter;
    this.port = options.port || 3005;
    this.app = express();
    this.server = null;
    this.wss = null;
    this.clients = new Set();
    this.data = {
      status: 'Initializing',
      portfolio: {},
      positions: [],
      signals: [],
      trades: [],
      sentiment: {},
      metrics: {},
      marketData: {},
      news: [],
      lastUpdate: null,
      aiSummary: null,
    };
    this.cachedSummary = null;
    this.summaryCacheTime = 0;
    this._speedMode = process.env.SPEED_MODE || 'NORMAL';
  }

  async start() {
    this.app.use(cors());
    this.app.use(express.json());

    // Helper: mask API keys (show last 4 chars only)
    const masked = (key) => {
      if (!key || key.length < 4) return '';
      return '****' + key.slice(-4);
    };

    // ── API Key Management ────────────────────────────────────────
    this.app.get('/api/keys', (req, res) => {
      const keys = {
        groq: masked(process.env.GROQ_API_KEY),
        openrouter: masked(process.env.OPENROUTER_API_KEY),
        gemini: masked(process.env.GEMINI_API_KEY),
        huggingface: masked(process.env.HF_TOKEN),
      };
      res.json({
        keys,
        configured: Object.values(keys).filter((k) => k !== '****').length,
      });
    });

    this.app.post('/api/keys', (req, res) => {
      try {
        const { groq, openrouter, gemini, huggingface } = req.body;
        const envPath = path.join(__dirname, '../../../.env');
        let envContent = '';
        try {
          envContent = fs.readFileSync(envPath, 'utf8');
        } catch (e) {
          envContent = '';
        }

        const keyMap = { GROQ_API_KEY: groq, OPENROUTER_API_KEY: openrouter, GEMINI_API_KEY: gemini, HF_TOKEN: huggingface };
        for (const key of Object.keys(keyMap)) {
          const val = keyMap[key];
          if (!val) continue;
          const regex = new RegExp(`^${key}=.*`, 'm');
          if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${val}`);
          } else {
            envContent += `\n${key}=${val}`;
          }
        }
        fs.writeFileSync(envPath, envContent.trim() + '\n');

        // Update current process.env
        if (groq) process.env.GROQ_API_KEY = groq;
        if (openrouter) process.env.OPENROUTER_API_KEY = openrouter;
        if (gemini) process.env.GEMINI_API_KEY = gemini;
        if (huggingface) process.env.HF_TOKEN = huggingface;

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ── AI Summary ────────────────────────────────────────────────
    const SUMMARY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    this.app.get('/api/summary', async (req, res) => {
      const now = Date.now();
      if (this.cachedSummary && this.summaryCacheTime && (now - this.summaryCacheTime) < SUMMARY_CACHE_TTL) {
        return res.json({ summary: this.cachedSummary, cached: true, age: now - this.summaryCacheTime });
      }
      try {
        const trades = this.engine?.portfolio?.history?.slice(-50) || [];
        const metrics = this.engine?.calculateMetrics?.() || {};
        const sentiment = this.data.sentiment || {};
        const result = await aiClient.generateTradeSummary(trades, metrics, sentiment);
        this.cachedSummary = result;
        this.summaryCacheTime = now;
        res.json({ summary: result, cached: false });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // ── Speed Modes ───────────────────────────────────────────────
    this.app.get('/api/speed-modes', (req, res) => {
      res.json({
        current: process.env.SPEED_MODE || 'NORMAL',
        modes: {
          LIGHT: { interval: 60000, label: '60 sec — Light scan' },
          NORMAL: { interval: 30000, label: '30 sec — Regular' },
          TURBO: { interval: 10000, label: '10 sec — Active intraday' },
          HYPERSCAN: { interval: 5000, label: '5 sec — Options scalping' },
        },
      });
    });

    this.app.post('/api/speed-mode', (req, res) => {
      const { mode } = req.body;
      if (!['LIGHT', 'NORMAL', 'TURBO', 'HYPERSCAN'].includes(mode)) {
        return res.status(400).json({ error: 'Invalid mode' });
      }
      try {
        const envPath = path.join(__dirname, '../../../.env');
        let envContent = '';
        try {
          envContent = fs.readFileSync(envPath, 'utf8');
        } catch (e) {
          envContent = '';
        }
        const regex = /^SPEED_MODE=.*/m;
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `SPEED_MODE=${mode}`);
        } else {
          envContent += `\nSPEED_MODE=${mode}`;
        }
        fs.writeFileSync(envPath, envContent.trim() + '\n');
        process.env.SPEED_MODE = mode;
        res.json({ success: true, mode });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ── Risk Metrics ─────────────────────────────────────────────────
    this.app.get('/api/risk', (req, res) => {
      const engine = this.engine;
      if (!engine?.riskManager) return res.json({ error: 'RiskManager not loaded' });
      res.json(engine.riskManager.getRiskMetrics(engine.portfolio));
    });

    this.app.post('/api/risk', (req, res) => {
      const engine = this.engine;
      if (!engine?.riskManager) return res.json({ error: 'RiskManager not loaded' });
      const { key, value } = req.body;
      if (!key || value === undefined) return res.status(400).json({ error: 'key and value required' });
      const result = engine.riskManager.updateLimit(key, value);
      res.json(result);
    });

    // ── Options Chain ───────────────────────────────────────────────
    this.app.get('/api/options/summary', async (req, res) => {
      if (!this.optionsChain) {
        const OptionsChain = require('../../core/OptionsChain');
        this.optionsChain = new OptionsChain({ logger: this.logger });
      }
      const index = req.query.index || 'NIFTY';
      try {
        const summary = await this.optionsChain.getSummary(index);
        res.json(summary);
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });

    this.app.get('/api/options/chain', async (req, res) => {
      if (!this.optionsChain) {
        const OptionsChain = require('../../core/OptionsChain');
        this.optionsChain = new OptionsChain({ logger: this.logger });
      }
      const index = req.query.index || 'NIFTY';
      try {
        const chain = await this.optionsChain.getChain(index);
        res.json(chain);
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });

    // ── Backtesting Engine ──────────────────────────────────────────
    this.app.get('/api/backtest', async (req, res) => {
      if (!this.backtestEngine) {
        const BacktestEngine = require('../../core/BacktestEngine');
        this.backtestEngine = new BacktestEngine({ logger: this.logger });
      }
      const { symbol, symbols, lookbackHigh, lookbackLow, stopLossPct, targetPct, capital } = req.query;
      const options = {
        lookbackHigh: parseInt(lookbackHigh) || 20,
        lookbackLow: parseInt(lookbackLow) || 20,
        stopLossPct: parseFloat(stopLossPct) || 2,
        targetPct: parseFloat(targetPct) || 5,
        capital: parseFloat(capital) || 50000,
      };

      try {
        let result;
        if (symbols) {
          const symList = symbols.split(',').map(s => s.trim());
          result = await this.backtestEngine.runMultiBacktest(symList, options);
        } else if (symbol) {
          result = await this.backtestEngine.runBreakoutBacktest(symbol, options);
        } else {
          // Default: top NSE stocks
          const defaultSymbols = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'SBIN.NS'];
          result = await this.backtestEngine.runMultiBacktest(defaultSymbols, options);
        }
        res.json(result);
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });

    // ── Performance Report ─────────────────────────────────────────────
    function calculateMaxDrawdown(initialCapital, trades) {
      let peak = initialCapital;
      let portfolio = initialCapital;
      let maxDD = 0;
      let maxDDPct = 0;
      trades.forEach(t => {
        portfolio += t.pnl || 0;
        if (portfolio > peak) peak = portfolio;
        const dd = peak - portfolio;
        const ddPct = (dd / peak) * 100;
        if (dd > maxDD) { maxDD = dd; maxDDPct = ddPct; }
      });
      return { max: maxDD, pct: maxDDPct };
    }

    this.app.get('/api/performance', (req, res) => {
      const engine = this.engine;
      if (!engine?.portfolio) return res.json({ error: 'Portfolio not available' });

      const history = engine.portfolio.history || [];
      const initialCapital = parseFloat(process.env.INITIAL_CAPITAL) || 50000;

      if (history.length === 0) {
        return res.json({
          summary: { totalTrades: 0, winRate: 0, avgWin: 0, avgLoss: 0, bestTrade: 0, worstTrade: 0, sharpe: 0, sortino: 0, calmar: 0, maxDrawdown: 0, maxDrawdownPct: 0 },
          equityCurve: [{ day: 0, value: initialCapital }],
          monthlyPnL: [],
          winStreak: 0, lossStreak: 0,
          stats: { avgHoldingHours: 0, profitFactor: 0 },
        });
      }

      const closedTrades = history.filter(t => t.pnl !== undefined && t.pnl !== null);
      const wins = closedTrades.filter(t => t.pnl > 0);
      const losses = closedTrades.filter(t => t.pnl < 0);
      const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
      const avgWin = wins.length > 0 ? wins.reduce((a, t) => a + t.pnl, 0) / wins.length : 0;
      const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, t) => a + t.pnl, 0) / losses.length) : 0;
      const bestTrade = closedTrades.length > 0 ? Math.max(...closedTrades.map(t => t.pnl)) : 0;
      const worstTrade = closedTrades.length > 0 ? Math.min(...closedTrades.map(t => t.pnl)) : 0;
      const profitFactor = losses.length > 0 && avgLoss > 0 ? ((wins.reduce((a, t) => a + t.pnl, 0)) / Math.abs(losses.reduce((a, t) => a + t.pnl, 0))) : (wins.length > 0 ? Infinity : 0);

      const returns = closedTrades.map(t => ((t.pnl || 0) / initialCapital) * 100);
      const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
      const variance = returns.length > 1 ? returns.reduce((a, r) => a + (r - avgReturn) ** 2, 0) / returns.length : 0;
      const stdDev = Math.sqrt(variance);
      const negativeReturns = returns.filter(r => r < 0);
      const downsideDev = Math.sqrt(negativeReturns.length > 0 ? negativeReturns.reduce((a, r) => a + r ** 2, 0) / returns.length : 0);
      const sharpe = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
      const sortino = downsideDev > 0 ? (avgReturn / downsideDev) * Math.sqrt(252) : 0;

      const totalReturn = closedTrades.reduce((a, t) => a + (t.pnl || 0), 0);
      const maxDrawdown = calculateMaxDrawdown(initialCapital, closedTrades);
      const tradingDays = Math.max(1, closedTrades.length);
      const annualizedReturn = (totalReturn / initialCapital) * (252 / tradingDays) * 100;
      const calmar = maxDrawdown.max > 0 ? annualizedReturn / maxDrawdown.max : 0;

      let portfolio = initialCapital;
      const equityCurve = [{ day: 0, value: initialCapital }];
      closedTrades.forEach((t, i) => {
        portfolio += t.pnl || 0;
        equityCurve.push({ day: i + 1, value: Math.round(portfolio) });
      });

      const monthlyPnL = {};
      closedTrades.forEach(t => {
        if (!t.timestamp && !t.exitTime) return;
        const dateStr = t.exitTime || t.timestamp;
        const d = new Date(dateStr);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyPnL[key]) monthlyPnL[key] = { month: key, pnl: 0, trades: 0, wins: 0 };
        monthlyPnL[key].pnl += t.pnl || 0;
        monthlyPnL[key].trades++;
        if (t.pnl > 0) monthlyPnL[key].wins++;
      });
      const monthlyData = Object.values(monthlyPnL).sort((a, b) => a.month.localeCompare(b.month));

      let winStreak = 0, lossStreak = 0, currentWin = 0, currentLoss = 0;
      closedTrades.forEach(t => {
        if (t.pnl > 0) { currentWin++; currentLoss = 0; winStreak = Math.max(winStreak, currentWin); }
        else if (t.pnl < 0) { currentLoss++; currentWin = 0; lossStreak = Math.max(lossStreak, currentLoss); }
      });

      const holdingHours = closedTrades.filter(t => t.exitTime && t.entryTime).map(t => {
        return (new Date(t.exitTime) - new Date(t.entryTime)) / (1000 * 60 * 60);
      });
      const avgHoldingHours = holdingHours.length > 0 ? holdingHours.reduce((a, b) => a + b, 0) / holdingHours.length : 0;

      res.json({
        summary: {
          totalTrades: closedTrades.length,
          winRate: winRate.toFixed(1),
          avgWin: avgWin.toFixed(2),
          avgLoss: avgLoss.toFixed(2),
          bestTrade: bestTrade.toFixed(2),
          worstTrade: worstTrade.toFixed(2),
          sharpe: isFinite(sharpe) ? sharpe.toFixed(2) : '0.00',
          sortino: isFinite(sortino) ? sortino.toFixed(2) : '0.00',
          calmar: isFinite(calmar) ? calmar.toFixed(2) : '0.00',
          maxDrawdown: maxDrawdown.max.toFixed(2),
          maxDrawdownPct: maxDrawdown.pct.toFixed(1),
          profitFactor: isFinite(profitFactor) ? profitFactor.toFixed(2) : '0.00',
          totalPnL: totalReturn.toFixed(2),
        },
        equityCurve,
        monthlyPnL: monthlyData,
        winStreak,
        lossStreak,
        stats: {
          avgHoldingHours: avgHoldingHours.toFixed(1),
          totalWins: wins.length,
          totalLosses: losses.length,
          initialCapital,
          currentCapital: portfolio,
        },
      });
    });

    // ── Portfolio with full details ──────────────────────────────────
    this.app.get('/api/portfolio', (req, res) => {
      const engine = this.engine;
      if (!engine) return res.json({ error: 'Engine not loaded' });
      const p = engine.portfolio;
      res.json({
        cash: p.cash,
        positions: p.positions,
        history: p.history?.slice(-20).reverse() || [],
        realizedPnL: p.realizedPnL,
        dailyStats: engine.riskManager?.dailyStats || {},
        metrics: engine.calculateMetrics ? engine.calculateMetrics() : {},
      });
    });

    // ── Trade Journal ───────────────────────────────────────────────
    this.app.get('/api/journal', (req, res) => {
      const engine = this.engine;
      const history = engine?.portfolio?.history || [];
      const journal = history.map(t => ({
        ...t,
        reason: t.reason || `Trade executed via ${t.strategy || 'system'}`,
        quality: t.pnl > 0 ? 'PROFIT' : t.pnl < 0 ? 'LOSS' : 'NEUTRAL',
        holdingPeriod: t.exitTime && t.entryTime
          ? Math.round((new Date(t.exitTime) - new Date(t.entryTime)) / (1000 * 60 * 60)) + 'h'
          : 'OPEN',
      }));
      res.json({ trades: journal, totalTrades: history.length });
    });

    // ── Full Trade Journal ─────────────────────────────────────────────
    this.app.get('/api/journal/full', (req, res) => {
      const engine = this.engine;
      const history = engine?.portfolio?.history || [];
      const journal = history.map((t, i) => ({
        id: i + 1,
        symbol: t.symbol,
        action: t.action || 'SELL',
        quantity: t.quantity,
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice || t.price,
        entryTime: t.entryTime || t.timestamp,
        exitTime: t.exitTime || new Date().toISOString(),
        pnl: t.pnl || 0,
        pnlPercent: t.pnlPercent || 0,
        reason: t.reason || t.strategy || 'Signal triggered',
        quality: t.quality || (t.pnl > 0 ? 'PROFIT' : 'LOSS'),
        holdingPeriod: t.holdingPeriod || 'N/A',
        strategy: t.strategy || 'System',
      }));
      res.json({ trades: journal, total: journal.length });
    });

    // ── Monte Carlo Simulation ──────────────────────────────────────
    this.app.post('/api/monte-carlo', (req, res) => {
      const { initialCapital = 50000, simulations = 1000, horizon = 30, tradesPerDay = 2 } = req.body;
      const engine = this.engine;
      const history = engine?.portfolio?.history || [];

      // Extract percentage returns from closed trades
      const returns = history
        .map(t => {
          if (!t.exitPrice || !t.entryPrice) return null;
          const pct = ((t.exitPrice - t.entryPrice) / t.entryPrice) * 100;
          return t.action?.toUpperCase() === 'SELL' ? -pct : pct;
        })
        .filter(r => r !== null && isFinite(r));

      if (returns.length === 0) {
        // Use realistic Indian market defaults when no history
        returns.push(1.2, -0.8, 2.1, -0.5, 1.8, 0.3, -1.1, 0.9, -0.3, 1.5);
      }

      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((a, b) => a + (b - avgReturn) ** 2, 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      const winRate = (returns.filter(r => r > 0).length / returns.length) * 100;

      // Monte Carlo: bootstrap resampling
      const outcomes = [];
      const dailyReturns = [];

      for (let sim = 0; sim < Math.min(simulations, 2000); sim++) {
        let portfolio = initialCapital;
        const simReturns = [];

        for (let day = 0; day < horizon; day++) {
          const numTrades = Math.floor(tradesPerDay * (0.5 + Math.random()));
          for (let t = 0; t < numTrades; t++) {
            const r = returns[Math.floor(Math.random() * returns.length)] * (1 + (Math.random() - 0.5) * 0.2);
            const pnl = portfolio * (r / 100);
            portfolio += pnl;
            simReturns.push(r);
          }
          dailyReturns.push(simReturns.reduce ? simReturns.reduce((a, b) => a + b, 0) : 0);
        }

        outcomes.push(portfolio);
      }

      outcomes.sort((a, b) => a - b);

      const p5 = outcomes[Math.floor(outcomes.length * 0.05)];
      const p25 = outcomes[Math.floor(outcomes.length * 0.25)];
      const p50 = outcomes[Math.floor(outcomes.length * 0.50)];
      const p75 = outcomes[Math.floor(outcomes.length * 0.75)];
      const p95 = outcomes[Math.floor(outcomes.length * 0.95)];

      // Max drawdown per simulation
      const maxDrawdowns = [];
      for (let sim = 0; sim < Math.min(simulations, 1000); sim++) {
        let portfolio = initialCapital;
        let peak = initialCapital;
        let maxDD = 0;
        for (let day = 0; day < horizon; day++) {
          const numTrades = Math.floor(tradesPerDay * (0.5 + Math.random()));
          for (let t = 0; t < numTrades; t++) {
            const r = returns[Math.floor(Math.random() * returns.length)];
            portfolio += portfolio * (r / 100);
          }
          if (portfolio > peak) peak = portfolio;
          const dd = ((peak - portfolio) / peak) * 100;
          if (dd > maxDD) maxDD = dd;
        }
        maxDrawdowns.push(maxDD);
      }
      maxDrawdowns.sort((a, b) => a - b);

      const avgMaxDD = maxDrawdowns.reduce((a, b) => a + b, 0) / maxDrawdowns.length;
      const sharpe = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
      const sortino = avgReturn > 0 ? (avgReturn / Math.sqrt(returns.filter(r => r < 0).reduce((a, b) => a + b * b, 0) / returns.length)) * Math.sqrt(252) : 0;

      // Histogram bins
      const min = outcomes[0];
      const max = outcomes[outcomes.length - 1];
      const numBins = 30;
      const binWidth = (max - min) / numBins;
      const bins = Array(numBins).fill(0);
      const binLabels = [];
      for (let i = 0; i < numBins; i++) {
        const binStart = min + i * binWidth;
        binLabels.push(Math.round(binStart));
      }
      for (const val of outcomes) {
        const idx = Math.min(Math.floor((val - min) / binWidth), numBins - 1);
        bins[idx]++;
      }

      res.json({
        summary: {
          initialCapital,
          finalMedian: p50,
          pnlMedian: p50 - initialCapital,
          pnlPercentMedian: ((p50 - initialCapital) / initialCapital) * 100,
          avgReturn,
          stdDev,
          winRate: winRate.toFixed(1),
          sharpe: sharpe.toFixed(2),
          sortino: sortino.toFixed(2),
        },
        percentiles: { p5: Math.round(p5), p25: Math.round(p25), p50: Math.round(p50), p75: Math.round(p75), p95: Math.round(p95) },
        risk: {
          maxDrawdownP95: maxDrawdowns[Math.floor(maxDrawdowns.length * 0.95)].toFixed(1),
          maxDrawdownAvg: avgMaxDD.toFixed(1),
          valueAtRisk95: (initialCapital - p5).toFixed(0),
          probabilityOfLoss: ((outcomes.filter(o => o < initialCapital).length / outcomes.length) * 100).toFixed(1),
        },
        histogram: { labels: binLabels, values: bins },
        usedTrades: returns.length,
      });
    });

    // ── Bot Mode ─────────────────────────────────────────────────────
    this.app.get('/api/mode', (req, res) => {
      res.json({
        mode: process.env.TRADING_MODE || 'paper',
        modes: { TEST: 'Paper trading — no real money', REAL: 'Live trading — real orders' },
      });
    });

    this.app.post('/api/mode', (req, res) => {
      const { mode } = req.body;
      if (!['paper', 'live', 'TEST', 'REAL'].includes(mode)) {
        return res.status(400).json({ error: 'Invalid mode' });
      }
      const actual = mode === 'REAL' ? 'live' : 'paper';
      process.env.TRADING_MODE = actual;
      fs.appendFileSync(path.join(__dirname, '../../../.env'), `\nTRADING_MODE=${actual}\n`);
      res.json({ success: true, mode: actual, label: mode === 'REAL' ? 'LIVE TRADING' : 'PAPER (TEST)' });
    });

    // ── Volume Spike Alerts ──────────────────────────────────────────
    this.app.get('/api/alerts', (req, res) => {
      const adapter = this.adapter;
      if (!adapter) return res.json([]);
      const marketData = adapter.getMarketData();
      const alerts = [];
      for (const [symbol, data] of Object.entries(marketData)) {
        if (!data?.volumes || !data?.avgVolume) continue;
        const ratio = data.volumeRatio || (data.volumes[data.volumes.length - 1] / data.avgVolume);
        if (ratio > 2.0) {
          alerts.push({ type: 'VOLUME_SPIKE', symbol, message: `${symbol} volume ${ratio.toFixed(1)}x above average`, severity: ratio > 3 ? 'HIGH' : 'MEDIUM', ratio: ratio.toFixed(2) });
        }
        if (data.rsi > 70) {
          alerts.push({ type: 'OVERBOUGHT', symbol, message: `${symbol} RSI overbought (${data.rsi.toFixed(1)})`, severity: 'HIGH' });
        }
        if (data.rsi < 30) {
          alerts.push({ type: 'OVERSOLD', symbol, message: `${symbol} RSI oversold (${data.rsi.toFixed(1)})`, severity: 'HIGH' });
        }
      }
      res.json(alerts.slice(0, 15));
    });

    // ── API Key Test ──────────────────────────────────────────────────
    this.app.post('/api/keys/test', async (req, res) => {
      const { provider, key } = req.body;
      try {
        const axios = require('axios');
        if (provider === 'groq') {
          const r = await axios.get('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${key}` }, timeout: 5000 });
          res.json({ success: true, provider, models: r.data.data?.length || 0 });
        } else if (provider === 'gemini') {
          const r = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, { timeout: 5000 });
          res.json({ success: true, provider, models: r.data.models?.length || 0 });
        } else {
          res.json({ success: false, error: 'Unknown provider' });
        }
      } catch (e) {
        res.json({ success: false, error: e.response?.data?.error?.message || e.message });
      }
    });

    this.app.use(express.static(path.join(__dirname, 'public')));

    // ── Existing API routes ────────────────────────────────────────
    this.app.get('/api/status', (req, res) => {
      res.json({ status: this.data.status, uptime: process.uptime(), mode: 'paper', timestamp: new Date().toISOString() });
    });
    this.app.get('/api/portfolio', (req, res) => {
      res.json(this.data.metrics);
    });
    this.app.get('/api/positions', (req, res) => {
      res.json(this.engine?.portfolio?.positions || []);
    });
    this.app.get('/api/trades', (req, res) => {
      res.json(this.engine?.portfolio?.history?.slice(-50).reverse() || []);
    });
    this.app.get('/api/signals', (req, res) => {
      res.json(this.engine?.lastSignals || []);
    });
    this.app.get('/api/sentiment', (req, res) => {
      res.json(this.data.sentiment);
    });
    this.app.get('/api/market', (req, res) => {
      const symbols = (req.query.symbols || '').split(',').filter(Boolean);
      if (symbols.length > 0) {
        const filtered = {};
        for (const s of symbols) filtered[s] = this.data.marketData[s] || this.data.marketData[s + '.NS'];
        return res.json(filtered);
      }
      res.json(this.data.marketData);
    });
    this.app.get('/api/news', (req, res) => {
      res.json(this.data.news || []);
    });
    this.app.get('/api/metrics', (req, res) => {
      res.json(this.engine?.calculateMetrics?.() || {});
    });

    this.app.post('/api/trade/execute', async (req, res) => {
      try {
        const { symbol, action, quantity, price } = req.body;
        if (!symbol || !action) return res.status(400).json({ error: 'Missing symbol or action' });
        const result = await this.engine?.adapter?.placeOrder(symbol, action.toUpperCase(), quantity, price);
        res.json({ success: true, order: result });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    const dashboardPath = path.join(__dirname, 'dashboard.html');
    this.app.get('/dashboard', (req, res) => {
      res.sendFile(dashboardPath);
    });
    this.app.get('/', (req, res) => {
      res.sendFile(dashboardPath);
    });

    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });

    this.wss.on('connection', (ws) => {
      this.logger?.info('Dashboard client connected');
      this.clients.add(ws);
      ws.send(JSON.stringify({ type: 'init', data: this.data }));
      ws.on('close', () => {
        this.clients.delete(ws);
        this.logger?.info('Dashboard client disconnected');
      });
      ws.on('message', (msg) => {
        try {
          const d = JSON.parse(msg);
          if (d.type === 'subscribe') this.logger?.info('Client subscribed:', d.channel);
        } catch (e) {}
      });
    });

    await new Promise((resolve) => {
      this.server.listen(this.port, '0.0.0.0', () => {
        this.logger?.info('Dashboard running at http://0.0.0.0:' + this.port);
        this.data.status = 'Running';
        resolve();
      });
    });
  }

  broadcast(message) {
    const payload = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    }
  }

  updateData(data) {
    Object.assign(this.data, data);
    this.data.aiSummary = this.cachedSummary || this.data.aiSummary;
    this.data.lastUpdate = new Date().toISOString();
    this.broadcast({ type: 'update', data: this.data });
  }

  async stop() {
    this.logger?.info('Stopping dashboard server...');
    for (const client of this.clients) client.close();
    if (this.server) await new Promise((r) => this.server.close(r));
  }
}

module.exports = DashboardServer;
