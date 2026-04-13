/**
 * Mean Reversion Strategy
 * Buys when price reaches lower Bollinger Band (oversold)
 * Sells when price reaches upper band (overbought)
 */
module.exports = {
  name: 'mean_reversion',
  generate(data, index) {
    const { closes, highs, lows } = data;
    if (index < 20) return null;

    const close = closes[index];
    const bb = this.bollingerBands(closes.slice(0, index + 1));
    const rsi = this.rsi(closes.slice(0, index + 1));

    // BUY: At lower band, oversold RSI
    if (close <= bb.lower * 1.03 && rsi < 40) {
      return {
        action: 'BUY',
        confidence: 0.72,
        stopLoss: bb.lower * 0.98,
        target: bb.middle,
        reason: `Mean Reversion: Lower BB (${bb.lower.toFixed(0)}) + RSI ${rsi.toFixed(0)}`
      };
    }

    // SELL: At upper band or RSI overbought
    if (close >= bb.upper * 0.97 || rsi > 65) {
      return { action: 'SELL', confidence: 0.68, reason: 'Mean Reversion: Upper BB or RSI overbought' };
    }

    return null;
  },

  bollingerBands(data, period = 20, stdDev = 2) {
    const mean = data.slice(-period).reduce((a, b) => a + b, 0) / period;
    const variance = data.slice(-period).reduce((s, v) => s + Math.pow(v - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    return { upper: mean + stdDev * std, middle: mean, lower: mean - stdDev * std };
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
