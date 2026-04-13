/**
 * Trading Orchestrator
 * Manages per-user bot instances — one engine per user
 * Uses node-postgres for database access
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs-extra');
const { Pool } = require('pg');

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

const logger = createLogger('Orchestrator');

// ── Import existing bot modules ──────────────────────────────────────
const NSEAdapter = require('./platforms/stocks/NSEBSEAdapter');
const NSEBSEEngine = require('./core/NSEBSETradingEngine');
const StockKnowledgeBase = require('./shared/knowledge/StockKnowledgeBase');
const TelegramAlerts = require('./utils/telegramAlert');
const aiClient = require('./utils/aiClient');
const NewsFetcher = require('./utils/newsFetcher');

const SPEED_INTERVALS = { LIGHT: 60000, NORMAL: 30000, TURBO: 10000, HYPERSCAN: 5000 };

// ── Per-User Bot Instance ──────────────────────────────────────────

class UserBot {
  constructor(user, pool) {
    this.user = user;
    this.pool = pool;
    this.userId = user.id;
    this.shortId = user.id.slice(0, 8);
    this.log = {
      info:  (...a) => logger.info(`[${this.shortId}]`, ...a),
      warn:  (...a) => logger.warn(`[${this.shortId}]`, ...a),
      error: (...a) => logger.error(`[${this.shortId}]`, ...a),
    };
    this.isRunning = false;
    this.engine = null;
    this.telegram = null;
    this.intervalId = null;
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Set per-user env BEFORE creating engine
    process.env.INITIAL_CAPITAL = String(this.user.initial_capital || 1000000);
    process.env.MAX_RISK_PER_TRADE = String(this.user.max_risk_per_trade || 10);
    process.env.TRADE_SIZE_PCT = '10';
    process.env.MAX_POSITIONS = '5';

    // Initialize modules
    const adapter = new NSEAdapter({ logger: this.log });
    await adapter.initialize();

    const knowledgeBase = new StockKnowledgeBase({
      logger: this.log,
      dataPath: path.join(__dirname, '../knowledge-base/stocks'),
    });
    await knowledgeBase.initialize();

    // Telegram (only if user has connected it)
    if (this.user.telegram_chat_id) {
      this.telegram = new TelegramAlerts({
        logger: this.log,
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: this.user.telegram_chat_id,
      });
    }

    // Per-user trading engine
    this.engine = new NSEBSEEngine({ logger: this.log, adapter, knowledgeBase });

    // Load existing positions from DB
    await this.loadPositionsFromDb();

    // Start cycle
    const speedMode = process.env.SPEED_MODE || 'NORMAL';
    const interval = SPEED_INTERVALS[speedMode] || 30000;
    this.log.info(`Starting (every ${interval/1000}s) | Capital: ₹${(this.user.initial_capital||1000000).toLocaleString()} | Mode: ${this.user.trading_mode}`);

    this.intervalId = setInterval(() => this.runCycle(), interval);
    await this.runCycle();
  }

  async loadPositionsFromDb() {
    try {
      const result = await this.pool.query(`
        SELECT symbol, quantity, entry_price, strategy, entry_time
        FROM trading_positions
        WHERE user_id = $1 AND status = 'open'
      `, [this.userId]);

      for (const row of result.rows) {
        this.engine.portfolio.positions.push({
          symbol: row.symbol,
          quantity: row.quantity,
          entryPrice: Number(row.entry_price),
          strategy: row.strategy,
          entryTime: new Date(row.entry_time),
        });
      }

      const invested = this.engine.portfolio.positions.reduce(
        (sum, p) => sum + p.quantity * p.entryPrice, 0
      );
      this.engine.portfolio.cash = (this.user.initial_capital || 1000000) - invested;
      this.log.info(`Loaded ${result.rows.length} positions, cash: ₹${this.engine.portfolio.cash.toLocaleString()}`);
    } catch (err) {
      this.log.warn('Could not load positions from DB:', err.message);
    }
  }

  async runCycle() {
    try {
      const cycleStart = Date.now();

      // 1. Fetch news
      const newsFetcher = new NewsFetcher({ logger: this.log });
      const news = await newsFetcher.getAllNews();

      // 2. AI sentiment
      let sentiment = 'NEUTRAL';
      try {
        const aiResult = await aiClient.chat(news[0]?.title || 'Indian stock market update');
        sentiment = aiResult.sentiment || 'NEUTRAL';
      } catch (_) { /* ignore */ }

      // 3. Generate + execute signals
      const signals = await this.engine.generateSignals();
      const trades = await this.engine.executeSignals(signals);

      // 4. Save to database
      await this.saveToDb(signals, trades);

      // 5. Telegram alert
      if (this.telegram && trades.length > 0) {
        const msg = `📈 *New Trades*\n` +
          trades.map(t => `✅ ${t.action} ${t.quantity}× ${t.symbol} @ ₹${Number(t.price).toLocaleString('en-IN')}`).join('\n') +
          `\n💰 Cash: ₹${this.engine.portfolio.cash.toLocaleString('en-IN')}`;
        this.telegram.send(msg, { type: 'TRADE' });
      }

      const ms = Date.now() - cycleStart;
      if (signals.length > 0 || trades.length > 0) {
        this.log.info(`Cycle ${ms}ms | Signals: ${signals.length} | Trades: ${trades.length}`);
      }

    } catch (err) {
      this.log.error('Cycle error:', String(err));
    }
  }

  async saveToDb(signals, trades) {
    try {
      const client = await this.pool.connect();

      for (const s of signals) {
        await client.query(`
          INSERT INTO trading_signals (user_id, symbol, action, confidence, strategy, price, stop_loss, target, reason, executed)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false)
        `, [this.userId, s.symbol, s.action, s.confidence, s.strategy, s.marketData?.price, s.stopLoss, s.target, s.reason]);
      }

      for (const t of trades) {
        await client.query(`
          INSERT INTO trading_trades (user_id, symbol, action, quantity, price, pnl, pnl_percent, strategy, signal_confidence)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        `, [this.userId, t.symbol, t.action, t.quantity, t.price, t.pnl || null, t.pnlPercent || null, t.strategy, t.confidence]);

        if (t.action === 'BUY') {
          await client.query(`
            INSERT INTO trading_positions (user_id, symbol, quantity, entry_price, strategy, status)
            VALUES ($1,$2,$3,$4,$5,'open')
            ON CONFLICT (user_id, symbol, status) DO UPDATE
            SET quantity = trading_positions.quantity + EXCLUDED.quantity,
                entry_price = (trading_positions.entry_price * trading_positions.quantity + EXCLUDED.entry_price * EXCLUDED.quantity) / (trading_positions.quantity + EXCLUDED.quantity),
                last_updated = NOW()
            WHERE trading_positions.status = 'open'
          `, [this.userId, t.symbol, t.quantity, t.price, t.strategy]);
        } else {
          await client.query(`
            UPDATE trading_positions SET status='closed'
            WHERE user_id=$1 AND symbol=$2 AND status='open'
          `, [this.userId, t.symbol]);
        }
      }

      client.release();
    } catch (err) {
      this.log.error('DB save error:', String(err));
    }
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) clearInterval(this.intervalId);
    this.log.info('Stopped');
  }
}

// ── Main Orchestrator ────────────────────────────────────────────────

class TradingOrchestrator {
  constructor() {
    this.userBots = new Map(); // userId → UserBot
    this.isRunning = false;
    this.pool = null;
    this.reloadInterval = null;
  }

  async initialize() {
    this.pool = new Pool({
      host: 'localhost', port: 5432,
      user: 'letese_user', password: 'letese_pass',
      database: 'letese_prod', max: 20,
    });
    logger.info('Database pool created');
  }

  async loadUsers() {
    const result = await this.pool.query(`
      SELECT id, email, telegram_chat_id, initial_capital,
             max_risk_per_trade, preferred_strategy, trading_mode
      FROM trading_users
      WHERE is_active = true AND subscription_status IN ('active', 'trial')
    `);
    return result.rows;
  }

  async startAll() {
    if (this.isRunning) return;
    this.isRunning = true;

    const users = await this.loadUsers();
    logger.info(`Found ${users.length} active users`);

    for (const user of users) {
      try {
        const bot = new UserBot(user, this.pool);
        await bot.start();
        this.userBots.set(user.id, bot);
        logger.info(`✅ Bot started: ${user.email}`);
      } catch (err) {
        logger.error(`❌ Failed to start bot for ${user.email}:`, err.message);
      }
    }

    logger.info(`✅ ${this.userBots.size} user bots running`);

    // Reload users every 5 min (new signups)
    this.reloadInterval = setInterval(async () => {
      try {
        const users = await this.loadUsers();
        for (const user of users) {
          if (!this.userBots.has(user.id)) {
            const bot = new UserBot(user, this.pool);
            await bot.start();
            this.userBots.set(user.id, bot);
            logger.info(`➕ New user bot: ${user.email}`);
          }
        }
      } catch (err) {
        logger.error('Reload error:', err.message);
      }
    }, 300000);
  }

  async stopAll() {
    this.isRunning = false;
    if (this.reloadInterval) clearInterval(this.reloadInterval);
    for (const bot of this.userBots.values()) bot.stop();
    this.userBots.clear();
    if (this.pool) await this.pool.end();
    logger.info('Orchestrator stopped');
  }
}

module.exports = { TradingOrchestrator, UserBot };
