'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://139.59.65.82:3021';
const SIDEBAR = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard' },
  { icon: '📈', label: 'Signals', href: '/dashboard/signals' },
  { icon: '💰', label: 'My Trades', href: '/dashboard/trades' },
  { icon: '📋', label: 'Portfolio', href: '/dashboard/portfolio' },
  { icon: '⭐', label: 'Watchlist', href: '/dashboard/watchlist' },
  { icon: '🪙', label: 'Credits', href: '/dashboard/credits' },
  { icon: '🔗', label: 'Broker API', href: '/dashboard/brokers' },
  { icon: '⚙️', label: 'Settings', href: '/dashboard/account' },
];

// Default watchlist
const DEFAULT_WATCHLIST = [
  { symbol: 'RELIANCE', exchange: 'NSE', ltp: 2912.50, change: '+1.2%', change_val: 34.50 },
  { symbol: 'TCS', exchange: 'NSE', ltp: 3896.20, change: '-0.4%', change_val: -15.60 },
  { symbol: 'INFY', exchange: 'NSE', ltp: 278.45, change: '+0.8%', change_val: 2.21 },
  { symbol: 'HDFCBANK', exchange: 'NSE', ltp: 2802.10, change: '+2.1%', change_val: 57.70 },
  { symbol: 'ICICIBANK', exchange: 'NSE', ltp: 1145.30, change: '+0.5%', change_val: 5.70 },
  { symbol: 'SBIN', exchange: 'NSE', ltp: 725.80, change: '-1.2%', change_val: -8.80 },
  { symbol: 'BAJFINANCE', exchange: 'NSE', ltp: 4177.60, change: '+1.8%', change_val: 73.90 },
  { symbol: 'KOTAKBANK', exchange: 'NSE', ltp: 1429.40, change: '-0.3%', change_val: -4.30 },
  { symbol: 'SUNPHARMA', exchange: 'NSE', ltp: 1876.20, change: '+0.9%', change_val: 16.70 },
  { symbol: 'TATAMOTORS', exchange: 'NSE', ltp: 1102.50, change: '+3.2%', change_val: 34.20 },
];

export default function WatchlistPage() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST);
  const [newSymbol, setNewSymbol] = useState('');
  const [adding, setAdding] = useState(false);

  function handleAdd() {
    const sym = newSymbol.trim().toUpperCase();
    if (!sym) return;
    if (watchlist.some(s => s.symbol === sym)) {
      alert(`${sym} already in watchlist!`); return;
    }
    setAdding(true);
    setTimeout(() => {
      setWatchlist(w => [...w, { symbol: sym, exchange: 'NSE', ltp: 0, change: '—', change_val: 0 }]);
      setNewSymbol('');
      setAdding(false);
    }, 500);
  }

  function handleRemove(symbol) {
    setWatchlist(w => w.filter(s => s.symbol !== symbol));
  }

  const gainers = watchlist.filter(s => parseFloat(s.change_val) > 0);
  const losers = watchlist.filter(s => parseFloat(s.change_val) < 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a', fontFamily: 'system-ui' }}>
      <aside style={{ width: 240, background: '#0d1117', borderRight: '1px solid #1f2937', position: 'fixed', top: 0, left: 0, bottom: 0, overflow: 'auto' }}>
        <div style={{ padding: '28px 16px 20px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>📈 NSE-BSE Trading</div>
        </div>
        <nav style={{ padding: '12px 0' }}>
          {SIDEBAR.map(item => (
            <a key={item.href} href="#" onClick={e => { e.preventDefault(); router.push(item.href); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: item.href === '/dashboard/watchlist' ? '#60a5fa' : '#9ca3af',
                background: item.href === '/dashboard/watchlist' ? 'rgba(96,165,250,0.1)' : 'transparent',
                borderLeft: item.href === '/dashboard/watchlist' ? '3px solid #60a5fa' : '3px solid transparent',
                textDecoration: 'none', fontSize: 13, fontWeight: item.href === '/dashboard/watchlist' ? 600 : 500 }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
      </aside>

      <main style={{ marginLeft: 240, padding: '32px 40px', width: 'calc(100% - 240px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>⭐ Watchlist</h1>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Track your favourite stocks. Click to view signals.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input value={newSymbol} onChange={e => setNewSymbol(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="e.g. RELIANCE" maxLength={20}
              style={{ padding: '10px 16px', background: '#0f172a', border: '1px solid #1f2937', borderRadius: 12, color: '#fff', fontSize: 14, width: 180 }} />
            <button onClick={handleAdd} disabled={adding}
              style={{ padding: '10px 20px', background: '#1e40ff', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {adding ? '...' : '+ Add'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Stocks Watched', value: watchlist.length, color: '#60a5fa' },
            { label: 'Gainers', value: gainers.length, color: '#34d393' },
            { label: 'Losers', value: losers.length, color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={{ background: '#111827', borderRadius: 16, padding: 18, border: '1px solid #1f2937', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Watchlist Table */}
        <div style={{ background: '#111827', borderRadius: 16, border: '1px solid #1f2937', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d1117', borderBottom: '1px solid #1f2937' }}>
                  {['#', 'Symbol', 'Exchange', 'Last Price', 'Change', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {watchlist.map((stock, i) => {
                  const isUp = parseFloat(stock.change_val) >= 0;
                  return (
                    <tr key={stock.symbol} style={{ borderBottom: '1px solid #1f2937', transition: 'background 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => router.push('/dashboard/signals')}>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#4b5563', fontFamily: 'monospace' }}>{i + 1}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#60a5fa' }}>
                            {stock.symbol.slice(0, 2)}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{stock.symbol}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{stock.exchange}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                        {stock.ltp > 0 ? '₹' + stock.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: isUp ? '#34d393' : '#f87171' }}>
                            {stock.change}
                          </span>
                          <span style={{ fontSize: 12, fontFamily: 'monospace', color: isUp ? '#34d393' : '#f87171' }}>
                            {isUp ? '▲' : '▼'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleRemove(stock.symbol)}
                          style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #1f2937', borderRadius: 8, color: '#f87171', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          ✕ Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
