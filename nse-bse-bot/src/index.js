/**
 * NSE & BSE AI Trading Bot
 * Main Entry Point
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs-extra');

// Logger
function createLogger(module) {
  const logDir = path.join(__dirname, '../logs');
  fs.ensureDirSync(logDir);
  const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
  
  return {
    module,
    info: (...args) => {
      const msg = `[${new Date().toISOString()}] [${module}] INFO: ${args.join(' ')}`;
      console.log(msg);
      fs.appendFileSync(logFile, msg + '\n');
    },
    warn: (...args) => {
      const msg = `[${new Date().toISOString()}] [${module}] WARN: ${args.join(' ')}`;
      console.warn(msg);
      fs.appendFileSync(logFile, msg + '\n');
    },
    error: (...args) => {
      const msg = `[${new Date().toISOString()}] [${module}] ERROR: ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`;
      console.error(msg);
      fs.appendFileSync(logFile, msg + '\n');
    },
  };
}

const logger = createLogger('Main');

// Core modules
const NSEBSEEngine = require('./core/NSEBSETradingEngine');
const NSEAdapter = require('./platforms/stocks/NSEBSEAdapter');
const StockKnowledgeBase = require('./shared/knowledge/StockKnowledgeBase');
const DashboardServer = require('./ui/dashboard/server');
const aiClient = require('./utils/aiClient');
const TelegramAlerts = require('./utils/telegramAlert');
const TrailingManager = require('./core/TrailingManager');
const SectorRotation = require('./core/SectorRotation');
const NewsFetcher = require('./utils/newsFetcher');
const EarningsCalendar = require('./core/EarningsCalendar');
const MultiTimeframeEngine = require('./core/MultiTimeframeEngine');

class TradingBot {
  constructor() {
    this.logger = createLogger('Bot');
    this.nseAdapter = null;
    this.engine = null;
    this.knowledgeBase = null;
    this.newsFetcher = null;
    this.isRunning = false;
    this.intervalId = null;
    this.marketCheckInterval = null;
  }

  async initialize() {
    this.logger.info('🚀 NSE/BSE Trading Bot initializing...');

    // Initialize NSE/BSE adapter
    this.nseAdapter = new NSEAdapter({ logger: this.logger });
    this.trailingManager = new TrailingManager({ logger: this.logger });
    this.earningsCalendar = new EarningsCalendar({ logger: this.logger });
    this.mtfEngine = new MultiTimeframeEngine({ logger: this.logger, adapter: this.nseAdapter });
    this.sectorRotation = new SectorRotation({ logger: this.logger });
    this.telegram = new TelegramAlerts({ logger: this.logger });
    await this.nseAdapter.initialize();

    // Initialize knowledge base
    this.knowledgeBase = new StockKnowledgeBase({
      logger: this.logger,
      dataPath: path.join(__dirname, '../knowledge-base/stocks'),
    });
    await this.knowledgeBase.initialize();

    // Initialize news fetcher
    this.newsFetcher = new NewsFetcher({ logger: this.logger });

    // Initialize trading engine
    this.engine = new NSEBSEEngine({
      logger: this.logger,
      adapter: this.nseAdapter,
      knowledgeBase: this.knowledgeBase,
    });

    this.logger.info('✅ All modules initialized');
  }

  async start() {
    if (this.isRunning) {
      this.logger.warn('Bot already running!');
      return;
    }

    this.logger.info('▶️ Starting NSE/BSE Trading Bot...');
    this.isRunning = true;

    // Start dashboard server
    this.dashboardServer = new DashboardServer({
      logger: this.logger,
      engine: this.engine,
      adapter: this.nseAdapter,
      port: parseInt(process.env.DASHBOARD_PORT) || 3005,
    });
    await this.dashboardServer.start();

    // Main trading loop — respect SPEED_MODE from .env
    const SPEED_INTERVALS = {
      LIGHT: 60000,
      NORMAL: 30000,
      TURBO: 10000,
      HYPERSCAN: 5000,
    };
    const speedMode = process.env.SPEED_MODE || 'NORMAL';
    const checkInterval = SPEED_INTERVALS[speedMode] || 30000;
    this.logger.info(`📊 Main loop starting (every ${checkInterval / 1000}s) [${speedMode}]`);

    this.intervalId = setInterval(async () => {
      try {
        await this.runCycle();
      } catch (error) {
        this.logger.error('Cycle error:', String(error));
      }
    }, checkInterval);

    // Run first cycle immediately
    await this.runCycle();

    // Start market hours monitoring
    this.startMarketMonitor();

    this.logger.info('✅ Bot fully running!');
    return true;
  }

  async runCycle() {
    const cycleStart = Date.now();
    this.logger.info(`🔄 Cycle starting at ${new Date().toLocaleTimeString()}`);

    try {
      // 1. Fetch latest market data
      await this.nseAdapter.refreshMarketData();

      // 1b. Check trailing SL/TP for open positions
      const prices = this.nseAdapter.prices;
      const trailingActions = this.trailingManager.processPortfolio(
        this.engine.portfolio.positions,
        prices
      );
      if (trailingActions.length > 0) {
        for (const action of trailingActions) {
          this.logger?.info(`📋 ${action.symbol}: ${action.action} — ${action.reason}`);
          await this.closePosition(action);
        }
      }

      // 2. Get current positions
      const positions = this.engine.portfolio.positions;

      // 3. Get market sentiment
      const sentiment = await this.engine.getMarketSentiment();

      // 4. Generate trading signals
      const rawSignals = await this.engine.generateSignals();
      // Filter signals near earnings
      const signals = this.earningsCalendar.filterEarningsStocks(rawSignals);

      // 4c. Sector rotation — get rotation-aware recommendations
      const rotationData = this.sectorRotation.analyzeSectors(this.nseAdapter.marketData);
      const rotationSignals = this.sectorRotation.getRotationRecommendations(this.nseAdapter.marketData, this.engine.portfolio.positions);
      // Merge rotation signals into main signals if they're stronger
      for (const rs of rotationSignals) {
        const existing = signals.find(s => s.symbol === rs.symbol);
        if (!existing) {
          signals.push({ symbol: rs.symbol, action: 'BUY', confidence: rs.confidence, strategy: rs.strategy || 'SectorRotation', reason: rs.reason, rotation: true });
        }
      }

      // 4d. Check rotation exits
      const exitSignals = this.sectorRotation.getRotationExits(this.nseAdapter.marketData, this.engine.portfolio.positions);
      for (const exit of exitSignals) {
        this.logger?.info(`📊 ${exit.symbol} rotation exit: ${exit.reason}`);
        // Execute exit via closePosition
      }
      if (rawSignals.length !== signals.length) {
        this.logger?.info(`📅 Filtered ${rawSignals.length - signals.length} signals near earnings`);
      }

      // 5. Execute paper trades
      const trades = await this.engine.executeSignals(signals);

      // 6. Update knowledge base with learnings
      await this.knowledgeBase.updateFromCycle({
        sentiment,
        signals,
        trades,
        positions,
      });

      // 7. Calculate portfolio metrics
      const metrics = this.engine.calculateMetrics();

      const cycleTime = Date.now() - cycleStart;
      this.logger.info(
        `✅ Cycle complete in ${cycleTime}ms | Signals: ${signals.length} | Trades: ${trades.length} | Sentiment: ${sentiment.overall}`
      );

      // Fetch latest news
      let news = [];
      try {
        news = await this.newsFetcher.getAllNews();
        this.logger?.info(`Fetched ${news.length} news items`);
      } catch (err) {
        this.logger?.warn('News fetch failed:', String(err));
      }

      // Broadcast to dashboard
      if (this.dashboardServer) {
        this.dashboardServer.updateData({
          metrics,
          positions,
          signals,
          trades,
          sentiment,
          news,
          marketData: this.nseAdapter.marketData,
          risk: this.engine?.riskManager?.getRiskMetrics(this.engine.portfolio) || {},
        });
      }

      // Generate AI summary asynchronously (non-blocking)
      if (aiClient && (process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || process.env.HF_TOKEN)) {
        this._generateAISummary(trades, metrics, sentiment).catch(() => {});
      }
    } catch (error) {
      this.logger.error('Cycle failed:', String(error));
    }
  }

  async _generateAISummary(trades, metrics, sentiment) {
    try {
      const result = await aiClient.generateTradeSummary(trades, metrics, sentiment);
      if (this.dashboardServer) {
        this.dashboardServer.cachedSummary = result;
        this.dashboardServer.summaryCacheTime = Date.now();
        this.dashboardServer.broadcast({ type: 'ai_summary', data: result });
      }
      this.logger.info(`🤖 AI summary generated via ${result.provider} (${result.latency}ms)`);
    } catch (err) {
      this.logger.warn('AI summary generation failed:', String(err));
    }
  }

  startMarketMonitor() {
    this.marketCheckInterval = setInterval(() => {
      const now = new Date();
      const istHour = parseInt(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }));
      const istMinute = parseInt(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', minute: '2-digit' }));
      const istDay = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' });

      const isWeekday = !['Sat', 'Sun'].includes(istDay);
      const isMarketHours = (istHour === 9 && istMinute >= 15) || (istHour >= 10 && istHour < 15) || (istHour === 15 && istMinute < 30);

      if (!isWeekday) this.logger.info('🌙 Weekend - Market closed');
      else if (!isMarketHours) this.logger.info('🌙 After hours - Market closed');
      else this.logger.info('📈 Market OPEN');

      if (this.dashboardServer) {
        this.dashboardServer.broadcast({
          type: 'market_status',
          data: {
            isOpen: isWeekday && isMarketHours,
            isWeekday,
            timeIST: `${istHour}:${istMinute}`,
            day: istDay,
          },
        });
      }
    }, 60000);
  }

  async closePosition(action) {
    try {
      const pos = action.position;
      const exitPrice = action.exitPrice || action.trailSL;
      const qty = action.exitQuantity || pos.quantity;
      const pnl = (exitPrice - pos.entryPrice) * qty;

      // Update cash
      this.engine.portfolio.cash += qty * exitPrice;

      // Remove or update position
      const idx = this.engine.portfolio.positions.findIndex(p => p.symbol === pos.symbol);
      if (idx >= 0) {
        if (qty >= pos.quantity) {
          this.engine.portfolio.positions.splice(idx, 1);
        } else {
          this.engine.portfolio.positions[idx].quantity -= qty;
        }
      }

      // Record trade
      const tradeRecord = {
        symbol: pos.symbol,
        action: 'SELL',
        quantity: qty,
        price: exitPrice,
        pnl: parseFloat(pnl.toFixed(2)),
        strategy: pos.strategy || 'TrailingManager',
        reason: action.reason,
        quality: action.quality,
        entryPrice: pos.entryPrice,
        entryTime: pos.timestamp,
        exitTime: new Date().toISOString(),
        confidence: 1.0,
        timestamp: new Date().toISOString(),
      };
      this.engine.portfolio.history.push(tradeRecord);
      this.engine.riskManager?.recordTrade(tradeRecord);
      this.logger?.info(`✅ ${pos.symbol} ${action.action}: qty=${qty} @ ₹${exitPrice.toFixed(2)} | P&L: ₹${pnl.toFixed(0)}`);
    } catch(e) { this.logger?.error('closePosition error:', e.message); }
  }

  async stop() {
    this.logger.info('⏹️ Stopping bot...');
    this.isRunning = false;
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.marketCheckInterval) clearInterval(this.marketCheckInterval);
    if (this.dashboardServer) await this.dashboardServer.stop();
    this.logger.info('✅ Bot stopped');
    this.telegram.sendBotStatus('STOPPED');
  }
}

// Handle graceful shutdown
const bot = new TradingBot();

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received');
  await bot.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received');
  await bot.stop();
  process.exit(0);
});

// Start the bot
(async () => {
  try {
    await bot.initialize();
    await bot.start();
    logger.info('🎉 NSE/BSE Bot is LIVE! Dashboard: http://139.59.65.82:3005');
  } catch (error) {
    logger.error('Fatal error:', String(error));
    process.exit(1);
  }
})();

module.exports = bot;
