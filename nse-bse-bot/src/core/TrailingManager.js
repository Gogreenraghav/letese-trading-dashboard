/**
 * Trailing Stop Loss & Take Profit Manager
 * Manages dynamic SL/TP for open positions
 */

class TrailingManager {
  constructor(options = {}) {
    this.logger = options.logger || { info: () => {}, warn: () => {} };
    this.config = {
      trailingSLPercent: parseFloat(process.env.TRAILING_STOP_PCT || 2),    // 2% trailing SL
      trailingTP1: parseFloat(process.env.TRAILING_TP_PCT || 5),               // TP1 at 5%
      trailingTP2: parseFloat(process.env.TRAILING_TP2_PCT || 10),            // TP2 at 10%
      bookingPercent: parseFloat(process.env.TRAILING_TP_BOOKING || 50),       // Book 50% at TP1
      pullbackThreshold: 1.5,  // Exit if price pulls back 1.5% from high
      minProfitLock: 1,         // Lock SL only after 1% profit
    };
  }

  /**
   * Evaluate a position and return action
   * @param {Object} position - { symbol, entryPrice, quantity, stopLoss, target, highOfDay, tp1Hit, tp2Hit }
   * @param {number} currentPrice - Current market price
   * @returns {Object} { action, reason, trailSL, bookedPercent }
   */
  evaluate(position, currentPrice) {
    if (!position || !position.entryPrice) return null;

    const entry = position.entryPrice;
    const highOfDay = position.highOfDay || entry;
    const pnlPercent = ((currentPrice - entry) / entry) * 100;
    const profitPercent = pnlPercent; // same thing

    const actions = [];

    // ── Calculate Trailing Stop Loss ─────────────────────────────────────
    let trailSL = position.stopLoss || (entry * (1 - this.config.trailingSLPercent / 100));

    if (profitPercent >= this.config.minProfitLock) {
      // Lock SL: entry + (profit - trailingSLPercent)
      const newTrailSL = entry * (1 + (profitPercent - this.config.trailingSLPercent) / 100);
      if (newTrailSL > trailSL) {
        trailSL = Math.max(trailSL, newTrailSL);
      }
    }

    // ── Check Stop Loss Hit ─────────────────────────────────────────────────
    if (currentPrice <= trailSL) {
      return {
        action: 'STOP_OUT',
        reason: `Trailing SL hit @ ₹${currentPrice.toFixed(2)} (SL: ₹${trailSL.toFixed(2)}) | Profit: ${profitPercent.toFixed(1)}%`,
        trailSL,
        pnlPercent: profitPercent.toFixed(2),
        exitPrice: currentPrice,
        quality: profitPercent > 0 ? 'PROFIT' : 'LOSS',
      };
    }

    // ── Trailing Take Profit: TP1 ─────────────────────────────────────────
    if (!position.tp1Hit && profitPercent >= this.config.trailingTP1) {
      actions.push({
        action: 'TP1_HIT',
        reason: `TP1 reached +${profitPercent.toFixed(1)}% profit — booking ${this.config.bookingPercent}%`,
        trailSL: trailSL,
        bookedPercent: this.config.bookingPercent,
        pnlPercent: profitPercent.toFixed(2),
        quality: 'PROFIT',
      });
    }

    // ── Trailing Take Profit: TP2 ─────────────────────────────────────────
    if ((position.tp1Hit || profitPercent >= this.config.trailingTP1) &&
        !position.tp2Hit && profitPercent >= this.config.trailingTP2) {
      const remainingPercent = 100 - this.config.bookingPercent;
      actions.push({
        action: 'TP2_HIT',
        reason: `TP2 reached +${profitPercent.toFixed(1)}% profit — booking remaining ${remainingPercent}%`,
        trailSL: trailSL,
        bookedPercent: remainingPercent,
        pnlPercent: profitPercent.toFixed(2),
        quality: 'PROFIT',
      });
    }

    // ── Pullback Detection ─────────────────────────────────────────────────
    if (profitPercent > 2 && highOfDay > entry * 1.02) {
      const pullback = ((highOfDay - currentPrice) / highOfDay) * 100;
      if (pullback >= this.config.pullbackThreshold) {
        actions.push({
          action: 'PULLBACK_EXIT',
          reason: `Pullback ${pullback.toFixed(1)}% from high — booking profit`,
          trailSL: trailSL,
          bookedPercent: 100,
          pnlPercent: profitPercent.toFixed(2),
          quality: profitPercent > 0 ? 'PROFIT' : 'NEUTRAL',
        });
      }
    }

    // ── Emergency: 3% drawdown from session high in profit ─────────────────
    if (profitPercent > 3) {
      const drawdown = ((highOfDay - currentPrice) / highOfDay) * 100;
      if (drawdown > 3) {
        actions.push({
          action: 'DRAWDOWN_PROTECT',
          reason: `Session high drawdown ${drawdown.toFixed(1)}% — protecting profit`,
          trailSL: trailSL,
          bookedPercent: 100,
          pnlPercent: profitPercent.toFixed(2),
          quality: 'PROFIT',
        });
      }
    }

    // Return most urgent action
    if (actions.length > 0) {
      const urgent = actions.find(a => a.action === 'STOP_OUT' || a.action === 'DRAWDOWN_PROTECT') || actions[0];
      return urgent;
    }

    // No action — just return current trailing SL info
    return {
      action: 'HOLD',
      trailSL,
      pnlPercent: profitPercent.toFixed(2),
      highOfDay: Math.max(highOfDay, currentPrice),
    };
  }

  /**
   * Process all open positions in a portfolio
   * Returns array of { position, action, reason, exitQuantity }
   */
  processPortfolio(positions, prices) {
    const results = [];
    
    for (const pos of positions) {
      const currentPrice = prices[pos.symbol] || pos.currentPrice || pos.entryPrice;
      if (!currentPrice) continue;

      const result = this.evaluate(pos, currentPrice);
      
      if (result && result.action !== 'HOLD') {
        results.push({
          symbol: pos.symbol,
          position: pos,
          ...result,
          exitQuantity: result.bookedPercent 
            ? Math.floor(pos.quantity * result.bookedPercent / 100)
            : pos.quantity,
        });
        
        this.logger?.info(`🎯 ${pos.symbol}: ${result.action} — ${result.reason}`);
      }

      // Update high of day
      pos.highOfDay = Math.max(pos.highOfDay || currentPrice, currentPrice);
    }

    return results;
  }

  /**
   * Calculate recommended position size based on risk
   */
  calculateSize(symbol, price, capital, riskPercent = 2) {
    const riskAmount = capital * (riskPercent / 100);
    const riskPerShare = price * (this.config.trailingSLPercent / 100);
    return Math.floor(riskAmount / riskPerShare);
  }

  /**
   * Generate trade summary for journal
   */
  summarizeTrade(trade, exitResult) {
    const entry = trade.entryPrice;
    const exit = exitResult.exitPrice;
    const qty = exitResult.exitQuantity || trade.quantity;
    const pnl = (exit - entry) * qty;
    const pnlPercent = ((exit - entry) / entry) * 100;

    return {
      ...trade,
      exitPrice: exit,
      exitQuantity: qty,
      exitTime: new Date().toISOString(),
      pnl: parseFloat(pnl.toFixed(2)),
      pnlPercent: parseFloat(pnlPercent.toFixed(2)),
      reason: exitResult.reason,
      quality: exitResult.quality,
      exitType: exitResult.action,
    };
  }
}

module.exports = TrailingManager;
