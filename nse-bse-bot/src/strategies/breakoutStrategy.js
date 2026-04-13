/**
 * Breakout Strategy
 * Buys on volume breakout above 20-day high
 * Sells on breakdown below 20-day low
 */
module.exports = {
  name: 'breakout',
  generate(data, index) {
    const { closes, highs, lows, volumes } = data;
    if (index < 21) return null;

    const close = closes[index];
    const high20 = Math.max(...highs.slice(index - 20, index));
    const low20 = Math.min(...lows.slice(index - 20, index));
    const volume = volumes[index];
    const avgVol = volumes.slice(index - 20, index).reduce((a, b) => a + b, 0) / 20;

    // BUY: Breakout above 20-day high with volume
    if (close > high20 * 1.01 && volume > avgVol * 1.5) {
      return {
        action: 'BUY',
        confidence: 0.75,
        stopLoss: low20,
        target: close + (close - low20) * 2,
        reason: `Breakout: New 20D high (${high20.toFixed(0)}) + ${(volume / avgVol).toFixed(1)}x volume`
      };
    }

    // SELL: Breakdown below 20-day low
    if (close < low20 * 0.99) {
      return { action: 'SELL', confidence: 0.70, reason: `Breakout: Breakdown below 20D low (${low20.toFixed(0)})` };
    }

    return null;
  }
};
