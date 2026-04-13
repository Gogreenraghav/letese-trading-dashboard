'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const STOCKS = [
  'RELIANCE.NS','TCS.NS','INFY.NS','HDFCBANK.NS','ICICIBANK.NS',
  'SBIN.NS','BAJFINANCE.NS','HINDUNILVR.NS','ITC.NS','KOTAKBANK.NS',
  'LT.NS','SUNPHARMA.NS','ADANIENT.NS','COALINDIA.NS','NESTLEIND.NS',
  'TATAMOTORS.NS','SBILIFE.NS','BAJAJFINSV.NS','M&M.NS','EICHERMOT.NS',
];

const STRATEGIES = [
  { value: 'momentum', label: '📈 Momentum (EMA crossover)', desc: 'Best for trending stocks' },
  { value: 'mean_reversion', label: '🔄 Mean Reversion (Bollinger Bands)', desc: 'Best for range-bound stocks' },
  { value: 'breakout', label: '💥 Breakout (20-day high/low)', desc: 'Best for volatile stocks' },
];

export default function BacktestPage() {
  const router = useRouter();
  const [symbol, setSymbol] = useState('TCS.NS');
  const [strategy, setStrategy] = useState('momentum');
  const [days, setDays] = useState(180);
  const [capital, setCapital] = useState('1000000');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [allResults, setAllResults] = useState(null);

  async function runBacktest(e) {
    e.preventDefault();
    setRunning(true);
    setError('');
    setResult(null);
    setAllResults(null);
    try {
      const res = await api('/api/v1/backtest/run', {
        method: 'POST',
        body: JSON.stringify({ symbol, strategy, days: parseInt(days), capital: parseInt(capital) }),
      });
      setResult(res);
    } catch (err) {
      setError(err.message);
    }
    setRunning(false);
  }

  async function runAllStocks(e) {
    e.preventDefault();
    setRunning(true);
    setError('');
    setResult(null);
    setAllResults(null);
    try {
      const res = await api(`/api/v1/backtest/top-stocks?days=${days}`);
      setAllResults(res);
    } catch (err) {
      setError(err.message);
    }
    setRunning(false);
  }

  function logout() {
    localStorage.removeItem('saas_token');
    localStorage.removeItem('saas_user');
    router.push('/');
  }

  function PnLBadge({ value, prefix = '' }) {
    const num = parseFloat(value);
    const isPos = num >= 0;
    return (
      <span style={{ color: isPos ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
        {prefix}{isPos ? '+' : ''}{value}
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#1e293b', borderRight: '1px solid #334155', padding: '24px 0' }}>
        <div style={{ padding: '0 16px 20px', borderBottom: '1px solid #334155', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>📈 Trading</div>
        </div>
        {[
          { label: 'Portfolio', href: '/dashboard' },
          { label: 'Trades', href: '/dashboard/trades' },
          { label: 'Signals', href: '/dashboard/signals' },
          { label: 'Backtest', href: '/dashboard/backtest' },
          { label: 'My Account', href: '/dashboard/account' },
        ].map(item => (
          <a key={item.href} href={item.href} onClick={e => { e.preventDefault(); router.push(item.href); }}
            style={{ display: 'block', padding: '10px 16px', color: item.href === '/dashboard/backtest' ? '#3b82f6' : '#94a3b8', textDecoration: 'none', fontSize: 13, fontWeight: item.href === '/dashboard/backtest' ? 600 : 400, background: item.href === '/dashboard/backtest' ? 'rgba(59,130,246,0.1)' : 'transparent', borderLeft: item.href === '/dashboard/backtest' ? '3px solid #3b82f6' : '3px solid transparent' }}>
            {item.label}
          </a>
        ))}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #334155', marginTop: 14 }}>
          <button onClick={logout} style={{ width: '100%', padding: '7px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>Logout</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 8 }}>📊 Backtesting Engine</h1>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 28 }}>Test trading strategies on historical NSE/BSE data</p>

        {/* Run Single Backtest */}
        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Run Backtest</h2>
          <form onSubmit={runBacktest} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Stock</label>
              <select value={symbol} onChange={e => setSymbol(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: 13 }}>
                {STOCKS.map(s => <option key={s} value={s}>{s.replace('.NS','')}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Strategy</label>
              <select value={strategy} onChange={e => setStrategy(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: 13 }}>
                {STRATEGIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Days</label>
              <select value={days} onChange={e => setDays(parseInt(e.target.value))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: 13 }}>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>365 days</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Capital (₹)</label>
              <input value={capital} onChange={e => setCapital(e.target.value)} type="number"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: 13 }} />
            </div>
            <button type="submit" disabled={running}
              style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: running ? '#1d4ed8' : '#2563eb', color: '#fff', fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer' }}>
              {running ? '⏳ Running...' : '▶️ Run'}
            </button>
          </form>
          <div style={{ marginTop: 12 }}>
            <button onClick={runAllStocks} disabled={running}
              style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: running ? 'not-allowed' : 'pointer' }}>
              🏆 Run All 16 Top Stocks (Momentum)
            </button>
          </div>
        </div>

        {/* Results */}
        {error && (
          <div style={{ background: '#7f1d1d', border: '1px solid #b91c1c', borderRadius: 8, padding: '12px 16px', color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>
            ❌ {error}
          </div>
        )}

        {running && (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            Running backtest... (may take up to 2 minutes)
          </div>
        )}

        {/* Single Result */}
        {result && !running && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
              📊 {result.symbol} — {result.strategy?.replace('_', ' ').toUpperCase()} ({result.period?.days} days)
            </h2>
            
            {/* Key Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Return', value: result.totalReturn, icon: '📈', color: parseFloat(result.totalReturn) >= 0 ? '#22c55e' : '#ef4444' },
                { label: 'Win Rate', value: result.winRate, icon: '🎯', color: '#3b82f6' },
                { label: 'Sharpe Ratio', value: result.sharpeRatio, icon: '⚡', color: '#f59e0b' },
                { label: 'Max Drawdown', value: result.maxDrawdown, icon: '📉', color: '#ef4444' },
                { label: 'Total P&L', value: '₹' + result.totalPnl?.toLocaleString('en-IN'), icon: '💰', color: result.totalPnl >= 0 ? '#22c55e' : '#ef4444' },
              ].map(s => (
                <div key={s.label} style={{ background: '#1e293b', borderRadius: 10, padding: 16, border: '1px solid #334155', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Detailed Stats */}
            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 14 }}>Performance Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  ['Total Trades', result.totalTrades],
                  ['Wins', result.wins],
                  ['Losses', result.losses],
                  ['Profit Factor', result.profitFactor + 'x'],
                  ['Avg Win', '₹' + (result.avgWin || 0).toLocaleString('en-IN')],
                  ['Avg Loss', '₹' + (result.avgLoss || 0).toLocaleString('en-IN')],
                  ['Best Trade', '₹' + (result.bestTrade || 0).toLocaleString('en-IN')],
                  ['Worst Trade', '₹' + (result.worstTrade || 0).toLocaleString('en-IN')],
                  ['Avg Hold Days', result.avgHoldingDays || 0],
                  ['Final Value', '₹' + (result.finalValue || 0).toLocaleString('en-IN')],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: '#0f172a', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategy descriptions */}
            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Strategy Used</h3>
              {STRATEGIES.map(s => s.value === strategy && (
                <div key={s.value}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#3b82f6', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Stocks Result */}
        {allResults && !running && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
              🏆 Top NSE Stocks — Backtest ({allResults.days} days, Momentum Strategy)
            </h2>
            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['#', 'Symbol', 'Return', 'Win Rate', 'Trades', 'P&L', 'Score'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: h === '#' ? 'center' : 'left', fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid #334155' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(allResults.results || []).map((r, i) => {
                    const ret = parseFloat(r.return?.replace('%', '').replace('+', '')) || 0;
                    const wr = parseFloat(r.win_rate?.replace('%', '')) || 0;
                    const score = (ret * 0.6 + wr * 0.4).toFixed(1);
                    return (
                      <tr key={r.symbol} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '10px 14px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>{i + 1}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#fff', fontSize: 14 }}>{r.symbol?.replace('.NS','')}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: 14, color: ret >= 0 ? '#22c55e' : '#ef4444' }}>
                          {r.return || '0%'}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: wr >= 70 ? '#22c55e' : wr >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {r.win_rate || '0%'}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: '#94a3b8' }}>{r.trades || 0}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: '#94a3b8' }}>{r.trades || 0 > 0 ? 'Active' : '-'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: score >= 50 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: score >= 50 ? '#86efac' : '#fca5a5' }}>
                            {score}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {(allResults.results || []).length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No results</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Box */}
        {!result && !allResults && !running && (
          <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 32, textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>How Backtesting Works</div>
            <div style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 600, margin: '0 auto' }}>
              Select a stock and strategy, then run the backtest. The engine tests the strategy against <strong style={{color:'#94a3b8'}}>real historical price data</strong> from Yahoo Finance to see how it would have performed. Results include win rate, Sharpe ratio, max drawdown, and individual trade history.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
