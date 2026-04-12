/**
 * NSE/BSE Trading Engine
 * Risk Manager integration for safety
 * AI-powered decision making for Indian stock markets
 */

const RiskManager = require('./RiskManager');

class NSEBSEEngine {
  constructor(options = {}) {
    this.logger = options.logger;
    this.adapter = options.adapter;
    this.knowledgeBase = options.knowledgeBase;
    this.riskManager = new RiskManager({ logger: this.logger });
    this.strategies = this.loadStrategies();
    this.portfolio = {
      cash: parseFloat(process.env.INITIAL_CAPITAL || 100000), // ₹1 Lakh default
      positions: [],
      history: [],
      realizedPnL: 0,
    };
    this.dailyStats = {
      trades: 0,
      wins: 0,
      losses: 0,
      pnl: 0,
    };
  }

  loadStrategies() {
    return {
      // 1. Momentum Strategy - Ride the trend
      momentum: {
        name: 'Momentum Strategy',
        description: 'Buy when price breaks above 20-day high with volumes confirmation',
        indicators: ['SMA20', 'SMA50', 'RSI', 'Volume'],
        minConfidence: 0.65,
        execute: async (symbol, data) => {
          if (!data?.prices || data.prices.length < 20) { this.logger?.warn(`Strategy ${this.name}: insufficient data for ${symbol}`); return null; }
          const { prices, volumes, rsi, sma20, sma50 } = data;
          // volumes already destructured
          if (!prices || prices.length < 50 || !volumes || volumes.length < 20) return null;
          // isUptrend check already done above

          const current = prices[prices.length - 1];
          const high20 = Math.max(...prices.slice(-20));
          const low20 = Math.min(...prices.slice(-20));
          const prevClose = prices[prices.length - 2];
          
          // Buy signal: Breakout above 20-day high with RSI in bullish zone
          const isBreakout = current > high20 && prevClose <= high20;
          const isBullishRSI = rsi > 50 && rsi < 75;
          const isUptrend = (sma20 && sma50) ? sma20 > sma50 : false;
          const volumeSpike = volumes[volumes.length - 1] > this.avgVolume(volumes.slice(-20)) * 1.5;

          if (isBreakout && isBullishRSI && isUptrend && volumeSpike) {
            const confidence = this.calculateConfidence([
              isBreakout * 0.3,
              (rsi - 50) / 50 * 0.25,
              (sma20 / sma50 - 1) * 0.25,
              volumeSpike * 0.2,
            ]);
            return confidence >= 0.65 ? { action: 'BUY', confidence, quantity: this.calculateQuantity(symbol, current) } : null;
          }

          // Sell signal: Price breaks below 20-day low — skip (we don't short)
          // In paper trading, a breakdown means wait for re-entry, not sell

          return null;
        },
      },

      // 2. Swing Strategy - Capture multi-day moves
      swing: {
        name: 'Swing Strategy',
        description: 'Hold positions for 3-7 days, enter on pullbacks',
        indicators: ['SMA20', 'EMA9', 'ATR', 'Fibonacci'],
        minConfidence: 0.6,
        execute: async (symbol, data) => {
          if (!data?.prices || data.prices.length < 20) { this.logger?.warn(`Strategy ${this.name}: insufficient data for ${symbol}`); return null; }
          const { prices, ema9, atr, volumes } = data;
          if (!prices || prices.length < 20 || !ema9 || !volumes || volumes.length < 10) return null;

          const current = prices[prices.length - 1];
          const ema20 = this.sma(prices.slice(-20)) || ema9;
          const recentLow = Math.min(...prices.slice(-5));
          const recentHigh = Math.max(...prices.slice(-5));
          const atrValue = atr || (recentHigh - recentLow) * 0.5;

          // Buy on pullback to EMA support
          const isPullback = current >= ema9 * 0.98 && current <= ema9 * 1.02;
          const isAboveEMA = current > ema9 && ema9 > ema20;
          const normalVolume = volumes[volumes.length - 1] > this.avgVolume(volumes.slice(-10)) * 0.8;

          if (isPullback && isAboveEMA && normalVolume) {
            const stopLoss = current - (atrValue * 1.5);
            const target = current + (atrValue * 3);
            const confidence = ((current - stopLoss) / current) * 0.5 + 0.5;
            return { action: 'BUY', confidence, stopLoss, target, holdingPeriod: '3-7 days' };
          }

          // Price below EMA → Mean reversion BUY (buy the dip)
          if (current < ema9 * 0.97) {
            const stopLoss = current * 0.97;
            const target = ema9 * 1.03;
            const confidence = 0.72;
            return { action: 'BUY', confidence, stopLoss, target, reason: 'Mean reversion: buying the dip', holdingPeriod: '2-5 days' };
          }

          return null;
        },
      },

      // 3. Intraday Strategy - Quick scalp moves
      intraday: {
        name: 'Intraday Strategy',
        description: 'Scalp 0.5-2% moves during market hours',
        indicators: ['SMA5', 'VWAP', 'Bollinger Bands'],
        minConfidence: 0.55,
        execute: async (symbol, data) => {
          if (!data?.prices || data.prices.length < 20) { this.logger?.warn(`Strategy ${this.name}: insufficient data for ${symbol}`); return null; }
          const { prices, volumes, vwap } = data;
          if (!prices || prices.length < 15 || !volumes || volumes.length < 15) return null;

          const current = prices[prices.length - 1];
          const sma5 = this.sma(prices.slice(-5));
          const { upper, lower, middle } = this.bollingerBands(prices.slice(-20), 20, 2);
          const isVWAPBreak = current > vwap && prices[prices.length - 2] <= vwap;

          // Quick scalp: Buy at lower Bollinger Band, sell at middle
          if (current <= lower && isVWAPBreak) {
            const target = middle;
            const stopLoss = current - (target - current) * 0.5;
            return { action: 'BUY', confidence: 0.6, target, stopLoss, type: 'intraday' };
          }

          // Price at upper band → scalp BUY (expecting pullback to middle band)
          if (current >= upper) {
            const stopLoss = lower;
            const target = middle;
            return { action: 'BUY', confidence: 0.65, stopLoss, target, reason: 'Bollinger scalp: buy at upper band, target middle', type: 'intraday' };
          }

          return null;
        },
      },

      // 4. Index Correlation Strategy
      indexCorrelation: {
        name: 'Index Correlation',
        description: 'Trade Nifty50 stocks correlated with index movement',
        indicators: ['Nifty50', 'Correlation', 'Beta'],
        minConfidence: 0.7,
        execute: async (symbol, data) => {
          if (!data?.prices || data.prices.length < 20) { this.logger?.warn(`Strategy ${this.name}: insufficient data for ${symbol}`); return null; }
          // Skip index correlation - requires Nifty data which is fetched separately
          return null;

          const stockReturn = (prices[prices.length - 1] - prices[prices.length - 2]) / prices[prices.length - 2];
          const indexReturn = (indexPrices[indexPrices.length - 1] - indexPrices[indexPrices.length - 2]) / indexPrices[indexPrices.length - 2];
          
          const alpha = stockReturn - (beta * indexReturn);

          if (alpha > 0.005 && correlation > 0.7) { // Stock outperforming
            return { action: 'BUY', confidence: 0.75, alpha: alpha.toFixed(4), reason: 'Positive alpha generation' };
          }
          if (alpha < -0.005 && correlation > 0.7) {
            // Negative alpha → skip (we don't short in paper trading)
          // Only take positive alpha as BUY
          }
          return null;
        },
      },
    };
  }

  // Generate signals for all tracked symbols
  async generateSignals() {
    const signals = [];
    this.lastSignals = [];
    const marketData = await this.adapter.getMarketData();
    const symbols = Object.keys(marketData);

    for (const symbol of symbols) {
      const data = marketData[symbol];
      
      // Try each strategy
      for (const [strategyName, strategy] of Object.entries(this.strategies)) {
        try {
          if (!data?.prices || data.prices.length < 20) continue;
          const result = await strategy.execute(symbol, data);
          if (result && result.confidence >= strategy.minConfidence) {
            signals.push({
              symbol,
              strategy: strategy.name,
              ...result,
              timestamp: new Date().toISOString(),
              marketData: {
                price: data.prices?.[data.prices.length - 1],
                rsi: data.rsi,
                volumes: data.volumes?.[data.volumes.length - 1],
              },
            });
          }
        } catch (error) {
          this.logger?.warn(`Strategy ${strategyName} error for ${symbol}:`, error.message);
        }
      }
    }

    // Sort by confidence
    signals.sort((a, b) => b.confidence - a.confidence);
    this.lastSignals = signals;
    return signals;
  }

  // Execute signals (paper trading)
  async executeSignals(signals) {
    const executed = [];
    const cash = this.portfolio.cash;
    
    for (const signal of signals) {
      const { symbol, action, confidence, marketData } = signal;
      const currentPrice = marketData?.price;
      const quantity = this.calculateQuantity(symbol, currentPrice);
      const tradeValue = currentPrice * quantity;
      const tradePct = cash > 0 ? (tradeValue / cash * 100).toFixed(1) : 0;

      // Skip if no valid quantity or price
      if (!currentPrice || quantity <= 0) {
        if (currentPrice > 0 && quantity <= 0) {
          const maxRisk = this.portfolio.cash * (parseFloat(process.env.MAX_PER_TRADE_RISK || 10) / 100);
          const tradeSizePct = parseFloat(process.env.TRADE_SIZE_PCT || 10);
          const sharesAtRisk = Math.ceil(maxRisk / currentPrice);
          this.logger?.warn(`${symbol}: Position too large (max ₹${maxRisk.toFixed(0)} = ${sharesAtRisk} shares @ ₹${currentPrice.toFixed(0)} at ${tradeSizePct}% capital), skipping`);
        }
        continue;
      }

      // Pre-trade risk check
      const riskCheck = this.riskManager.canTrade(
        symbol,
        this.portfolio,
        { quantity, price: currentPrice, riskPerShare: 0 }
      );
      if (!riskCheck.allowed) {
        this.logger?.warn(`Risk block ${symbol}: ${riskCheck.reason} [tradeVal=₹${tradeValue.toFixed(0)} (${tradePct}% of cash)]`);
        continue;
      }
      
      this.logger?.info(`[TRADE OK] ${symbol}: qty=${quantity} @ ₹${currentPrice.toFixed(0)} = ₹${tradeValue.toFixed(0)} (${tradePct}%) → executing ${action}`);
      
      // If SELL signal but no position → treat as BUY signal (strategy likes this stock)
      if (action === 'SELL' && !existingPosition) {
      }

      // Check if we already have a position
      const existingPosition = this.portfolio.positions.find(p => p.symbol === symbol);
      
      // If SELL signal but no position → treat as BUY (strategy found a good entry)
      if (action === 'SELL' && !existingPosition) {
        action = 'BUY';
      }
      
      if (action === 'BUY') {
        if (existingPosition) {
          this.logger?.info(`${symbol}: Already have position, skipping BUY`);
          continue;
        }

        const cost = currentPrice * quantity;
        if (cost > this.portfolio.cash) {
          this.logger?.info(`${symbol}: Insufficient cash (need ₹${cost.toFixed(0)}, have ₹${this.portfolio.cash.toFixed(0)})`);
          continue;
        }

        // Execute paper trade
        const trade = {
          symbol,
          action: 'BUY',
          price: currentPrice,
          quantity,
          cost,
          confidence,
          strategy: signal.strategy,
          stopLoss: signal.stopLoss,
          target: signal.target,
          timestamp: new Date().toISOString(),
          status: 'OPEN',
        };

        this.portfolio.positions.push({
          symbol,
          entryPrice: currentPrice,
          quantity,
          entryTime: new Date().toISOString(),
          strategy: signal.strategy,
          stopLoss: signal.stopLoss || currentPrice * 0.95,
          target: signal.target || currentPrice * 1.05,
        });

        this.portfolio.cash -= cost;
        this.portfolio.history.push(trade);
        this.dailyStats.trades++;
        executed.push(trade);

        this.logger?.info(`✅ BUY ${symbol}: ₹${currentPrice} x ${quantity} = ₹${cost.toFixed(0)} | Confidence: ${(confidence * 100).toFixed(0)}%`);
      }

      if (action === 'SELL' && existingPosition) {
        const proceeds = currentPrice * existingPosition.quantity;
        const pnl = proceeds - (existingPosition.entryPrice * existingPosition.quantity);
        const pnlPercent = (pnl / (existingPosition.entryPrice * existingPosition.quantity)) * 100;

        const trade = {
          symbol,
          action: 'SELL',
          price: currentPrice,
          quantity: existingPosition.quantity,
          proceeds,
          pnl,
          pnlPercent,
          confidence,
          strategy: existingPosition.strategy,
          holdingPeriod: this.calcHoldingPeriod(existingPosition.entryTime),
          timestamp: new Date().toISOString(),
          status: 'CLOSED',
        };

        this.portfolio.positions = this.portfolio.positions.filter(p => p.symbol !== symbol);
        this.portfolio.cash += proceeds;
        this.portfolio.realizedPnL += pnl;
        this.portfolio.history.push(trade);
        this.dailyStats.trades++;
        this.dailyStats.pnl += pnl;
        if (pnl > 0) this.dailyStats.wins++;
        else this.dailyStats.losses++;

        executed.push(trade);
        this.logger?.info(`✅ SELL ${symbol}: ₹${currentPrice} x ${existingPosition.quantity} | P&L: ₹${pnl.toFixed(0)} (${pnlPercent.toFixed(1)}%)`);
      }
    }

    return executed;
  }

  // Get market sentiment
  async getMarketSentiment() {
    const marketData = await this.adapter.getMarketData();
    const niftyData = marketData['NIFTY50'] || marketData['^NSEI'];
    
    if (!niftyData?.prices || niftyData.prices.length < 60) {
      return { overall: 'NEUTRAL', niftyChange: 0, marketBreadth: 'UNKNOWN' };
    }

    const prices = niftyData.prices;
    const current = prices[prices.length - 1];
    const dayOpen = prices.filter((_, i) => i < 30).reduce((a, b) => a + b, 0) / 30;
    const weekAgo = prices.length >= 300 ? prices.slice(-300)[0] : prices[0];
    const monthAgo = prices.length >= 1200 ? prices.slice(-1200)[0] : prices[0];

    const dayChange = ((current - dayOpen) / dayOpen) * 100;
    const weekChange = ((current - weekAgo) / weekAgo) * 100;
    const monthChange = ((current - monthAgo) / monthAgo) * 100;

    let overall = 'NEUTRAL';
    if (dayChange > 0.5) overall = 'BULLISH';
    if (dayChange < -0.5) overall = 'BEARISH';
    if (Math.abs(dayChange) > 1.5) overall = dayChange > 0 ? 'STRONG_BULLISH' : 'STRONG_BEARISH';

    return {
      overall,
      niftyChange: dayChange.toFixed(2),
      weekChange: weekChange.toFixed(2),
      monthChange: monthChange.toFixed(2),
      rsi: niftyData.rsi?.toFixed(1) || 'N/A',
      volumes: niftyData.volumes?.[niftyData.volume.length - 1] || 'N/A',
      timestamp: new Date().toISOString(),
    };
  }

  // Calculate portfolio metrics
  calculateMetrics() {
    const positions = this.portfolio.positions;
    let unrealizedPnL = 0;
    let totalValue = this.portfolio.cash;

    for (const pos of positions) {
      const currentPrice = this.adapter?.getCurrentPrice(pos.symbol) || pos.entryPrice;
      const posValue = currentPrice * pos.quantity;
      const posCost = pos.entryPrice * pos.quantity;
      unrealizedPnL += posValue - posCost;
      totalValue += posValue;
    }

    const totalPnL = this.portfolio.realizedPnL + unrealizedPnL;
    const returnPercent = ((totalPnL / this.portfolio.cash) * 100);

    return {
      cash: this.portfolio.cash.toFixed(2),
      positions: positions.length,
      positionValue: (totalValue - this.portfolio.cash).toFixed(2),
      totalValue: totalValue.toFixed(2),
      realizedPnL: this.portfolio.realizedPnL.toFixed(2),
      unrealizedPnL: unrealizedPnL.toFixed(2),
      totalPnL: totalPnL.toFixed(2),
      returnPercent: returnPercent.toFixed(2),
      winRate: this.dailyStats.trades > 0 
        ? ((this.dailyStats.wins / this.dailyStats.trades) * 100).toFixed(1)
        : '0.0',
      totalTrades: this.dailyStats.trades,
    };
  }

  // Helper functions
  calculateQuantity(symbol, price) {
    // Position size based on % of portfolio (not risk-based)
    // TRADE_SIZE_PCT = how much of capital per trade (e.g. 10% = ₹1 Lakh per trade on ₹10L capital)
    // STOP_LOSS_PCT = hard stop loss % from entry (e.g. 5% = ₹500 risk per ₹10,000 position)
    const tradeSizePct = parseFloat(process.env.TRADE_SIZE_PCT || 10); // % of capital per trade
    const stopLossPct  = parseFloat(process.env.STOP_LOSS_PCT || 5);   // hard stop loss %
    const lotSize      = this.adapter?.getLotSize(symbol) || 1;
    const tradeAmount  = this.portfolio.cash * (tradeSizePct / 100);
    const maxQty      = Math.floor(tradeAmount / price / lotSize) * lotSize;
    // Also respect max risk: (price * maxQty * stopLossPct/100) <= maxRisk
    const maxRisk      = this.portfolio.cash * (parseFloat(process.env.MAX_PER_TRADE_RISK || 10) / 100);
    const riskBasedQty = Math.floor(maxRisk / price / lotSize) * lotSize;
    // Use the smaller of the two — portfolio % sizing or risk-based sizing
    return Math.min(maxQty, riskBasedQty);
  }

  sma(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  avgVolume(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  calculateConfidence(weights) {
    return Math.min(1, weights.reduce((a, b) => a + b, 0));
  }

  bollingerBands(prices, period = 20, stdDev = 2) {
    const sma = this.sma(prices);
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / prices.length;
    const std = Math.sqrt(variance);
    return {
      upper: sma + (std * stdDev),
      middle: sma,
      lower: sma - (std * stdDev),
    };
  }

  calcHoldingPeriod(entryTime) {
    const diff = Date.now() - new Date(entryTime).getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 1) return `${Math.floor(diff / 60000)}min`;
    if (hours < 24) return `${Math.floor(hours)}hrs`;
    return `${Math.floor(hours / 24)}days`;
  }
}

module.exports = NSEBSEEngine;
