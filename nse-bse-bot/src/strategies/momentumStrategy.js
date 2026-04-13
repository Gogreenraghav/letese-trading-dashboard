/**
 * Momentum Trading Strategy
 * Buys when price crosses above EMA with RSI confirmation
 * Sells on trend reversal
 */
module.exports = {
  name: 'momentum',
  generate(data, index) {
    const { closes, highs, lows, volumes } = data;
    if (index < 21) return null;

    const close = closes[index];
    const prevClose = closes[index - 1];

    // EMAs
    const ema9 = this.ema(closes.slice(0, index + 1), 9);
    const ema21 = this.ema(closes.slice(0, index + 1), 21);
    const rsi = this.rsi(closes.slice(0, index + 1));
    const volume = volumes[index];
    const avgVol = volumes.slice(index - 20, index).reduce((a, b) => a + b, 0) / 20;

    // BUY: EMA bullish crossover + RSI + volume
    if (close > ema9 && close > ema21 && ema9 > ema21 && rsi > 45 && rsi < 70 && volume > avgVol * 1.2) {
      return {
        action: 'BUY',
        confidence: 0.70,
        stopLoss: close * 0.97,
        target: close * 1.06,
        reason: 'Momentum: EMA bullish crossover + RSI 45-70 + volume spike'
      };
    }

    // SELL: Trend reversal
    if (close < ema9 * 0.97 || rsi > 80) {
      return { action: 'SELL', confidence: 0.65, reason: 'Momentum: Trend reversal' };
    }

    return null;
  },

  ema(data, period) {
    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return ema;
  },

  rsi(data, period = 14) {
    if (data.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = data.length - period; i < data.length; i++) {
      const diff = data[i] - data[i - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    return 100 - 100 / (1 + avgGain / avgLoss);
  }
};
