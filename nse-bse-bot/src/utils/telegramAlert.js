/**
 * Telegram Alert System
 * Sends rich trade alerts, signals, and daily summaries to Telegram
 * Supports MarkdownV2, inline keyboards, and per-alert-type preferences
 */

const axios = require('axios');
const Logger = require('./logger');

class TelegramAlerts {
  constructor(options = {}) {
    this.logger = options.logger || new Logger({ module: 'Telegram' });
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.enabled = !!(this.botToken && this.chatId);
    this.baseURL = this.botToken ? `https://api.telegram.org/bot${this.botToken}` : null;
    this.messageQueue = [];
    this.lastAlertAt = 0;
    this.minInterval = 60000; // 60 sec rate limit between non-critical alerts

    // Alert preferences (loaded from /api/telegram/alerts)
    this.preferences = {
      tradeExec: true,
      signal: true,
      risk: true,
      volume: true,
      sentiment: false,
      price: false,
      severity: { high: true, medium: true, low: false },
      muted: false,
    };
  }

  // ── Core Send ─────────────────────────────────────────────────────────────
  async send(message, options = {}) {
    if (!this.enabled) {
      this.logger?.info('[Telegram] Not configured — queued:', message.slice(0, 60));
      return { queued: true };
    }

    const type = options.type || 'ALERT';
    const now = Date.now();

    // Skip muted alerts
    if (this.preferences.muted) {
      this.logger?.info('[Telegram] Alerts muted, skipping:', type);
      return { muted: true };
    }

    // Alert-type preference filter
    const typeMap = {
      TRADE: 'tradeExec', SIGNAL: 'signal', ALERT: 'risk', RISK: 'risk',
      STOP_LOSS: 'risk', TARGET: 'risk', DAILY: 'signal', NEWS: 'volume',
      ERROR: 'risk', SYSTEM: 'tradeExec', BUY: 'tradeExec', SELL: 'tradeExec',
      PROFIT: 'tradeExec', LOSS: 'tradeExec', QUEUED: 'volume',
    };
    const prefKey = typeMap[type] || 'signal';
    if (!this.preferences[prefKey]) {
      this.logger?.info(`[Telegram] Alert type ${type} disabled by preferences, skipping.`);
      return { disabled: true };
    }

    // Rate limiting for non-trade alerts
    if (type !== 'TRADE' && type !== 'BUY' && type !== 'SELL' && type !== 'PROFIT' && type !== 'LOSS' && this.lastAlertAt && (now - this.lastAlertAt) < this.minInterval) {
      this.logger?.info('[Telegram] Rate limited, queueing:', message.slice(0, 60));
      this.messageQueue.push({ message, options });
      return { rateLimited: true };
    }

    try {
      const emoji = this.getEmoji(type);
      const formatted = `${emoji} *${type}*\n\n${message}`;

      const payload = {
        chat_id: this.chatId,
        text: formatted,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      };

      // Add inline keyboard if provided
      if (options.keyboard) {
        payload.reply_markup = {
          inline_keyboard: options.keyboard.map(row =>
            row.map(btn => ({
              text: btn.text,
              url: btn.url,
              callback_data: btn.callback_data,
            }))
          ),
        };
      }

      const res = await axios.post(`${this.baseURL}/sendMessage`, payload);

      if (!['TRADE','BUY','SELL','PROFIT','LOSS'].includes(type)) {
        this.lastAlertAt = now;
      }

      this.logger?.info(`[Telegram] Sent ${type}:`, message.slice(0, 80));

      if (this.messageQueue.length > 0) {
        setTimeout(() => this.flushQueue(), this.minInterval);
      }

      return { success: true, messageId: res.data?.result?.message_id };
    } catch (e) {
      this.logger?.warn('[Telegram] Send failed:', e.response?.data?.description || e.message);
      return { success: false, error: e.message };
    }
  }

  // ── Rich Send (HTML + Buttons) ─────────────────────────────────────────────
  async sendRich(htmlContent, options = {}) {
    if (!this.enabled) return { queued: true };
    if (this.preferences.muted) return { muted: true };

    try {
      const type = options.type || 'ALERT';
      const emoji = this.getEmoji(type);

      // Escape special MarkdownV2 characters in plain text portions
      const escapeMd = (str) => String(str).replace(/([_*\[\]`~])/g, '\\$1');

      const payload = {
        chat_id: this.chatId,
        text: `${emoji} *${escapeMd(type)}*\n\n${htmlContent}`,
        parse_mode: 'Markdown',
        disable_web_page_preview: !!(options.disablePreview === false),
      };

      if (options.keyboard) {
        payload.reply_markup = {
          inline_keyboard: options.keyboard.map(row =>
            row.map(btn => ({
              text: btn.text,
              url: btn.url,
              callback_data: btn.callback_data,
            }))
          ),
        };
      }

      const res = await axios.post(`${this.baseURL}/sendMessage`, payload);
      this.logger?.info(`[Telegram] Rich sent ${type}`);
      return { success: true, messageId: res.data?.result?.message_id };
    } catch (e) {
      this.logger?.warn('[Telegram] Rich send failed:', e.message);
      return { success: false, error: e.message };
    }
  }

  // ── Send Photo with Caption ────────────────────────────────────────────────
  async sendPhoto(photoUrl, caption, options = {}) {
    if (!this.enabled || this.preferences.muted) return { skipped: true };
    try {
      const res = await axios.post(`${this.baseURL}/sendPhoto`, {
        chat_id: this.chatId,
        photo: photoUrl,
        caption: caption,
        parse_mode: 'Markdown',
      });
      return { success: true, messageId: res.data?.result?.message_id };
    } catch (e) {
      this.logger?.warn('[Telegram] Photo send failed:', e.message);
      return { success: false, error: e.message };
    }
  }

  // ── Send with Inline Buttons ────────────────────────────────────────────────
  async sendWithButtons(message, buttons, options = {}) {
    return this.send(message, { ...options, keyboard: buttons });
  }

  // ── Message Queue ─────────────────────────────────────────────────────────
  async flushQueue() {
    for (const item of this.messageQueue.splice(0, 5)) {
      await this.send(item.message, { ...item.options, type: 'QUEUED' });
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  // ── Update Preferences (called from /api/telegram/alerts) ─────────────────
  updatePreferences(prefs) {
    this.preferences = { ...this.preferences, ...prefs };
    this.logger?.info('[Telegram] Preferences updated:', JSON.stringify(this.preferences));
  }

  // ── Get Preferences ────────────────────────────────────────────────────────
  getPreferences() {
    return { ...this.preferences };
  }

  getEmoji(type) {
    const emojis = {
      TRADE: '📊', SIGNAL: '⚡', ALERT: '🚨', NEWS: '📰',
      PROFIT: '💰', LOSS: '💸', STOP_LOSS: '🛑', TARGET: '🎯',
      DAILY: '📋', ERROR: '❌', SYSTEM: '⚙️', BUY: '🟢',
      SELL: '🔴', QUEUED: '⏳', RISK: '🛡️', INFO: 'ℹ️',
      SENTIMENT: '📊', VOLUME: '📈', PRICE: '💹',
    };
    return emojis[type] || '📌';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── ALERT BUILDERS ─────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── Trade Alert (with inline buttons) ───────────────────────────────────────
  async sendTradeAlert(trade) {
    const pnl = trade.pnl || 0;
    const pnlEmoji = pnl >= 0 ? '💰' : '💸';
    const pnlText = pnl >= 0 ? `+₹${Math.abs(pnl).toLocaleString('en-IN')}` : `-₹${Math.abs(pnl).toLocaleString('en-IN')}`;
    const isProfitable = pnl >= 0;
    const border = isProfitable ? '🟢' : '🔴';
    const actionLabel = trade.action === 'BUY' ? '🟢 BUY' : '🔴 SELL';
    const modeEmoji = process.env.TRADING_MODE === 'live' ? '⚠️ LIVE' : '🧪 TEST';

    const message =
      `${border} *NSE/BSE — ${trade.action} Executed*\n\n` +
      `📈 *${trade.symbol}* — ${actionLabel}\n` +
      `Qty: *${trade.quantity}* | Entry: *₹${(trade.entryPrice || 0).toLocaleString('en-IN')}*\n` +
      `${pnlEmoji} P&L: ${pnlText} (${(trade.pnlPercent || 0).toFixed(2)}%)\n` +
      `📋 Strategy: ${trade.strategy || 'System'}\n` +
      `📝 Reason: ${trade.reason || 'Signal triggered'}\n` +
      `🏷 Mode: ${modeEmoji}\n` +
      `⏱ ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST\n\n` +
      `_LETESE Technologies | NSE/BSE Bot v2.0_`;

    const keyboard = [
      [
        { text: '📊 View Dashboard', url: `http://139.59.65.82:3005` },
        { text: '🔄 Close Position', callback_data: `close:${trade.symbol}` },
      ],
      [
        { text: '📈 View Chart', url: `https://www.tradingview.com/chart/?symbol=NSE:${trade.symbol}` },
      ],
    ];

    return this.sendWithButtons(message, keyboard, { type: 'TRADE' });
  }

  // ── Signal Alert (with action buttons) ────────────────────────────────────
  async sendSignalAlert(signals) {
    if (!signals || signals.length === 0) return { skipped: true };

    const lines = signals.slice(0, 5).map((s, i) => {
      const emoji = s.action === 'BUY' ? '🟢' : '🔴';
      const action = s.action === 'BUY' ? 'BUY' : 'SELL';
      const conf = Math.round((s.confidence || 0.5) * 100);
      const confBar = conf >= 75 ? '🟢🟢🟢' : conf >= 50 ? '🟡🟡⬜' : '🟡⬜⬜';
      return `${emoji} *${s.symbol}* — ${action} ` +
        `${confBar} ${conf}%\n   📊 ${s.strategy || 'System'} | RSI: ${s.indicators?.rsi || 'N/A'}`;
    }).join('\n\n');

    const message =
      `*⚡ Active Trading Signals*\n\n` +
      lines +
      `\n\n⏱ ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })} IST`;

    const keyboard = [
      [{ text: '📊 Open Dashboard', url: 'http://139.59.65.82:3005' }],
      ...(signals.slice(0, 3).map(s => [
        { text: `🟢 ${s.symbol} BUY`, callback_data: `signal_buy:${s.symbol}` },
        { text: `🔴 ${s.symbol} SELL`, callback_data: `signal_sell:${s.symbol}` },
      ])),
    ];

    return this.sendWithButtons(message, keyboard, { type: 'SIGNAL' });
  }

  // ── Stop Loss Triggered ─────────────────────────────────────────────────────
  async sendStopLossAlert(position, exitResult) {
    const pnl = exitResult.pnl || 0;
    const quality = exitResult.quality || 'LOSS';
    const isBig = Math.abs(pnl) > 5000;
    const emoji = isBig ? '🚨' : '🛑';

    const message =
      `${emoji} *Stop Loss Triggered*\n\n` +
      `📈 *${position.symbol}*\n` +
      `Entry: *₹${(position.entryPrice || 0).toLocaleString('en-IN')}* | ` +
      `Exit: *₹${(exitResult.exitPrice || 0).toLocaleString('en-IN')}*\n` +
      `Qty: *${exitResult.exitQuantity || position.quantity}*\n` +
      `💸 P&L: ${pnl >= 0 ? '+' : ''}₹${Math.abs(pnl).toLocaleString('en-IN')} (${exitResult.pnlPercent || '0'}%)\n` +
      `🏷 Quality: *${quality}*\n` +
      `📋 Reason: ${exitResult.reason || 'Stop loss hit'}\n\n` +
      `_LETESE Technologies | NSE/BSE Bot v2.0_`;

    return this.sendWithButtons(message, [
      [{ text: '📊 View Journal', url: 'http://139.59.65.82:3005' }],
      [{ text: '🔄 Re-analyze', callback_data: `reanalyze:${position.symbol}` }],
    ], { type: 'STOP_LOSS' });
  }

  // ── Target Hit (TP1/TP2/TP3) ────────────────────────────────────────────────
  async sendTargetAlert(position, level) {
    const pnl = position.pnl || 0;
    const emoji = level === 'TP1' ? '🎯' : level === 'TP2' ? '💰' : '🏆';

    const message =
      `${emoji} *Target ${level} Reached!*\n\n` +
      `📈 *${position.symbol}*\n` +
      `Entry: *₹${(position.entryPrice || 0).toLocaleString('en-IN')}* | ` +
      `Current: *₹${(position.currentPrice || 0).toLocaleString('en-IN')}*\n` +
      `💰 Profit: +₹${Math.abs(pnl).toLocaleString('en-IN')} (${(position.pnlPercent || 0).toFixed(2)}%)\n` +
      `📋 ${level} booking completed\n\n` +
      `_LETESE Technologies | NSE/BSE Bot v2.0_`;

    return this.sendWithButtons(message, [
      [{ text: '📊 Dashboard', url: 'http://139.59.65.82:3005' }],
      [{ text: '🚫 Close All', callback_data: `close_all:${position.symbol}` }],
    ], { type: 'TARGET' });
  }

  // ── Daily Summary ─────────────────────────────────────────────────────────
  async sendDailySummary(bot) {
    const metrics = bot.engine?.calculateMetrics?.() || {};
    const portfolio = bot.engine?.portfolio || {};
    const risk = bot.engine?.riskManager?.getRiskMetrics?.(bot.engine?.portfolio) || {};
    const dayStats = risk.dayStats || {};
    const modeEmoji = process.env.TRADING_MODE === 'live' ? '⚠️ LIVE' : '🧪 TEST';
    const pnl = metrics.totalPnL || 0;
    const pnlEmoji = pnl >= 0 ? '📈' : '📉';
    const pnlSign = pnl >= 0 ? '+' : '-';

    const message =
      `*📋 NSE/BSE Bot — Daily Report*\n\n` +
      `📅 ${new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n` +
      `💼 *Portfolio Value:* ₹${(metrics.totalValue || 0).toLocaleString('en-IN')}\n` +
      `${pnlEmoji} *Today's P&L:* ${pnlSign}₹${Math.abs(pnl).toLocaleString('en-IN')} (${pnlSign}${(metrics.returnPercent || 0).toFixed(2)}%)\n` +
      `📊 *Win Rate:* ${metrics.winRate || 0}%\n` +
      `📋 *Trades:* ${dayStats.trades || 0}  🟢W: ${dayStats.wins || 0}  🔴L: ${dayStats.losses || 0}\n` +
      `📁 *Open Positions:* ${portfolio.positions?.length || 0}\n` +
      `🛡️ *Daily Loss:* ₹${risk.dailyLossUsed || 0} / ₹${risk.maxDailyLoss || 2000}\n` +
      `⚡ *Mode:* ${modeEmoji}\n` +
      `🏆 *Market Regime:* ${bot.sectorRotation?.marketRegime || 'SIDEWAYS'}\n\n` +
      `_LETESE Technologies | NSE/BSE Bot v2.0_`;

    return this.sendWithButtons(message, [
      [{ text: '📊 Open Dashboard', url: 'http://139.59.65.82:3005' }],
      [{ text: '📈 Performance', callback_data: 'view_performance' }],
    ], { type: 'DAILY' });
  }

  // ── Breaking News ──────────────────────────────────────────────────────────
  async sendBreakingNews(item) {
    const sentiment = item.sentiment?.label || 'NEUTRAL';
    const emoji = sentiment === 'POSITIVE' ? '📰+' : sentiment === 'NEGATIVE' ? '📰−' : '📰';
    const sentimentEmoji = sentiment === 'POSITIVE' ? '🟢' : sentiment === 'NEGATIVE' ? '🔴' : '🟡';

    const message =
      `${emoji} *Breaking Market News*\n\n` +
      `*${item.title}*\n\n` +
      `${sentimentEmoji} Sentiment: *${sentiment}* (${(item.sentiment?.score || 0).toFixed(2)})\n` +
      `🏢 Source: ${item.source || 'Unknown'} ` +
      (item.publishedAt ? `| ⏱ ${new Date(item.publishedAt).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST` : '') +
      (item.link ? `\n🔗 [Read Full Article](${item.link})` : '');

    return this.sendWithButtons(message, [
      ...(item.link ? [[{ text: '🔗 Read Article', url: item.link }]] : []),
      [{ text: '📊 View Chart', callback_data: `chart:${item.relatedSymbol || ''}` }],
    ], { type: 'NEWS' });
  }

  // ── Risk Limit Reached ─────────────────────────────────────────────────────
  async sendRiskLimitAlert(riskData) {
    const type = riskData.type || 'risk_limit';
    const emoji = riskData.severity === 'HIGH' ? '🚨' : '⚠️';

    const message =
      `${emoji} *Risk Limit ${type === 'daily_loss' ? 'Reached' : 'Alert'}*\n\n` +
      `🛡️ *${riskData.label || 'Risk Limit'}*\n` +
      `Used: ₹${(riskData.used || 0).toLocaleString('en-IN')} / ₹${(riskData.max || 0).toLocaleString('en-IN')} ` +
      `(${riskData.percent || 0}%)\n` +
      (riskData.positions ? `📁 Open Positions: *${riskData.positions}*\n` : '') +
      `⏱ ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST\n\n` +
      `_Bot will pause new trades until next reset._`;

    return this.sendWithButtons(message, [
      [{ text: '📊 View Risk Dashboard', url: 'http://139.59.65.82:3005' }],
      [{ text: '🔄 Resume Bot', callback_data: 'resume_bot' }],
    ], { type: 'RISK' });
  }

  // ── Volume Spike Alert ─────────────────────────────────────────────────────
  async sendVolumeSpikeAlert(symbol, data) {
    const message =
      `📈 *Volume Spike Detected*\n\n` +
      `📈 *${symbol}*\n` +
      `Volume: *${data.volume || 'N/A'}x* average\n` +
      `Price: *₹${(data.price || 0).toLocaleString('en-IN')}* (${(data.change || 0).toFixed(2)}%)\n` +
      `⏱ ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST\n\n` +
      `_Signal detected by NSE/BSE Bot_`;

    return this.sendWithButtons(message, [
      [{ text: '📊 View Chart', url: `https://www.tradingview.com/chart/?symbol=NSE:${symbol}` }],
      [{ text: '🔄 Analyze', callback_data: `analyze:${symbol}` }],
    ], { type: 'VOLUME' });
  }

  // ── Sentiment Shift Alert ─────────────────────────────────────────────────
  async sendSentimentShiftAlert(before, after, index) {
    const arrows = { BULL: '📈', BEAR: '📉', NEUTRAL: '↔️' };
    const message =
      `⚠️ *Sentiment Shift Detected*\n\n` +
      `📊 Index: *${index || 'NIFTY50'}*\n` +
      `${arrows[before] || '↔️'} ${before} → ${arrows[after] || '↔️'} ${after}\n` +
      `⏱ ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST\n\n` +
      `_Bot adjusting strategy based on new regime._`;

    return this.sendWithButtons(message, [
      [{ text: '📊 View Sentiment', url: 'http://139.59.65.82:3005' }],
    ], { type: 'SENTIMENT' });
  }

  // ── System Error Alert ─────────────────────────────────────────────────────
  async sendErrorAlert(error, context) {
    return this.send(
      `*❌ System Error*\n\n` +
      `⚙️ Context: ${context}\n` +
      `❗ Error: ${String(error).slice(0, 200)}\n` +
      `⏱ ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST`,
      { type: 'ERROR' }
    );
  }

  // ── Bot Start/Stop ─────────────────────────────────────────────────────────
  async sendBotStatus(status) {
    const msg = status === 'STARTED'
      ? `✅ *NSE/BSE Bot Started*\n\n⚡ Mode: ${process.env.TRADING_MODE || 'paper'}\n📊 Dashboard: http://139.59.65.82:3005\n⏱ ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST\n\n_Ready to trade!_`
      : `⏹ *NSE/BSE Bot Stopped*\n\n⏱ ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST\n\n_See you next session!_`;
    return this.send(msg, { type: 'SYSTEM' });
  }

  // ── Position Update (periodic heartbeat) ──────────────────────────────────
  async sendPositionUpdate(positions) {
    if (!positions || positions.length === 0) return { skipped: true };
    const lines = positions.map(p => {
      const pnl = p.pnl || 0;
      const emoji = pnl >= 0 ? '🟢' : '🔴';
      return `${emoji} *${p.symbol}* | Qty: ${p.quantity} | P&L: ${pnl >= 0 ? '+' : ''}₹${Math.abs(pnl).toLocaleString('en-IN')}`;
    }).join('\n');

    const message =
      `*📁 Open Positions (${positions.length})*\n\n` +
      lines +
      `\n\n⏱ Updated: ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })} IST`;

    return this.send(message, { type: 'INFO' });
  }

  // ── Test Message (for /api/telegram/test) ──────────────────────────────────
  async sendTestMessage() {
    const message =
      `✅ *Telegram Connected!*\n\n` +
      `🎉 NSE/BSE Bot v2.0 is ready to send alerts to this chat.\n\n` +
      `📋 What you'll receive:\n` +
      `  • 📊 Trade execution alerts\n` +
      `  • ⚡ Trading signal notifications\n` +
      `  • 🛡️ Risk limit warnings\n` +
      `  • 📈 Volume spike alerts\n` +
      `  • 📋 Daily performance reports\n\n` +
      `⚙️ Configure alerts in Dashboard → Settings → 🔔 Alerts\n\n` +
      `_LETESE Technologies | NSE/BSE Bot v2.0_`;

    return this.sendWithButtons(message, [
      [{ text: '📊 Open Dashboard', url: 'http://139.59.65.82:3005' }],
    ], { type: 'SYSTEM' });
  }
}

module.exports = TelegramAlerts;