'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://139.59.65.82:3021';

async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('user_token');
  const res = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) { window.location.href = '/'; return null; }
  return res.json();
}

const SIDEBAR = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard' },
  { icon: '📈', label: 'Signals', href: '/dashboard/signals' },
  { icon: '💰', label: 'My Trades', href: '/dashboard/trades' },
  { icon: '📋', label: 'Portfolio', href: '/dashboard/portfolio' },
  { icon: '⭐', label: 'Watchlist', href: '/dashboard/watchlist' },
  { icon: '🪙', label: 'Credits', href: '/dashboard/credits' },
  { icon: '🔗', label: 'Broker API', href: '/dashboard/brokers' },
  { icon: '📋', label: 'Plans', href: '/dashboard/plans' },
  { icon: '📊', label: 'Analytics', href: '/dashboard/analytics' },
  { icon: '⚙️', label: 'Settings', href: '/dashboard/account' },
];

const STRAT_COLORS = {
  momentum: '#60a5fa',
  breakout: '#34d393',
  mean_reversion: '#fbbf24',
  unknown: '#9ca3af',
};

// ── SVG Line Chart ────────────────────────────────────────────────
function LineChart({ data, width = 600, height = 220 }) {
  if (!data || data.length < 2) return <div style={{ color: '#4b5563', fontSize: 13, textAlign: 'center', padding: 40 }}>Not enough data for chart</div>;

  const values = data.map(d => parseFloat(d.cumulative_pnl));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const pad = 40;
  const chartW = width - pad * 2;
  const chartH = height - pad * 2;

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * chartW;
    const y = pad + (1 - (parseFloat(d.cumulative_pnl) - minVal) / range) * chartH;
    return { x, y, d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = `${pathD} L${points[points.length - 1].x},${pad + chartH} L${pad},${pad + chartH} Z`;

  const isProfit = parseFloat(data[data.length - 1].cumulative_pnl) >= 0;
  const lineColor = isProfit ? '#34d393' : '#f87171';

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = pad + (1 - t) * chartH;
        const val = minVal + t * range;
        return (
          <g key={i}>
            <line x1={pad} y1={y} x2={pad + chartW} y2={y} stroke="#1f2937" strokeWidth="1" strokeDasharray="4 4" />
            <text x={pad - 6} y={y + 4} textAnchor="end" fill="#4b5563" fontSize="10" fontFamily="monospace">
              ₹{val >= 0 ? '+' : ''}{val.toFixed(0)}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaD} fill={lineColor} fillOpacity="0.08" />

      {/* Line */}
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* Zero line if applicable */}
      {minVal < 0 && maxVal > 0 && (
        <line
          x1={pad} y1={pad + (1 - (0 - minVal) / range) * chartH}
          x2={pad + chartW} y2={pad + (1 - (0 - minVal) / range) * chartH}
          stroke="#374151" strokeWidth="1" strokeDasharray="3 3"
        />
      )}

      {/* Points + tooltips */}
      {points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 6)) === 0).map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={lineColor} stroke="#0d1117" strokeWidth="2" />
          <text x={p.x} y={pad + chartH + 16} textAnchor="middle" fill="#4b5563" fontSize="9" fontFamily="monospace">
            {p.d.date?.slice(5)}
          </text>
        </g>
      ))}

      {/* Last value label */}
      <g>
        <rect x={points[points.length - 1].x + 4} y={points[points.length - 1].y - 10} width="70" height="18" rx="4" fill={lineColor} fillOpacity="0.2" />
        <text x={points[points.length - 1].x + 39} y={points[points.length - 1].y + 3} textAnchor="middle" fill={lineColor} fontSize="10" fontWeight="700" fontFamily="monospace">
          ₹{parseFloat(points[points.length - 1].d.cumulative_pnl).toFixed(0)}
        </text>
      </g>
    </svg>
  );
}

// ── SVG Bar Chart ─────────────────────────────────────────────────
function BarChart({ data, height = 180 }) {
  if (!data || data.length === 0) return null;

  const values = data.map(d => parseFloat(d.pnl));
  const maxVal = Math.max(...values.map(Math.abs));
  const pad = 40;
  const barW = Math.max(20, Math.min(60, (700 - pad * 2) / data.length - 8));
  const chartW = data.length * (barW + 8);
  const chartH = height - pad * 2;

  return (
    <svg width="100%" viewBox={`0 0 ${Math.max(chartW + pad * 2, 400)} ${height}`} style={{ overflow: 'visible' }}>
      {/* Zero line */}
      <line x1={pad} y1={pad + chartH / 2} x2={pad + chartW} y2={pad + chartH / 2} stroke="#374151" strokeWidth="1" />

      {data.map((d, i) => {
        const pnl = parseFloat(d.pnl);
        const isProfit = pnl >= 0;
        const barH = (Math.abs(pnl) / (maxVal || 1)) * (chartH / 2);
        const x = pad + i * (barW + 8);
        const y = isProfit ? pad + chartH / 2 - barH : pad + chartH / 2;
        const color = isProfit ? '#34d393' : '#f87171';

        return (
          <g key={i}>
            <rect
              x={x} y={y}
              width={barW} height={Math.max(2, barH)}
              fill={color} fillOpacity="0.85" rx="4"
            />
            <text x={x + barW / 2} y={pad + chartH / 2 + 14} textAnchor="middle" fill="#4b5563" fontSize="9" fontFamily="monospace">
              {d.label?.split(' ')[0]}
            </text>
            <text x={x + barW / 2} y={isProfit ? y - 4 : y + barH + 14} textAnchor="middle" fill={color} fontSize="9" fontWeight="700" fontFamily="monospace">
              ₹{pnl.toFixed(0)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Win Rate Donut ─────────────────────────────────────────────────
function DonutChart({ winRate, size = 120 }) {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const win = (winRate / 100) * circ;
  const loss = circ - win;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2937" strokeWidth="18" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="#34d393"
        strokeWidth="18"
        strokeDasharray={`${win} ${loss}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
      />
      <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fill="#fff" fontSize="20" fontWeight="900" fontFamily="monospace">
        {winRate.toFixed(1)}%
      </text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fill="#6b7280" fontSize="9" fontWeight="600">
        WIN RATE
      </text>
    </svg>
  );
}

// ── Strategy Bar ───────────────────────────────────────────────────
function StrategyBars({ data }) {
  const maxPnl = Math.max(...data.map(d => Math.abs(parseFloat(d.pnl))), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map(d => {
        const pnl = parseFloat(d.pnl);
        const isProfit = pnl >= 0;
        const pct = (Math.abs(pnl) / maxPnl) * 100;
        const color = STRAT_COLORS[d.strategy] || STRAT_COLORS.unknown;

        return (
          <div key={d.strategy}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
              <span style={{ fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>
                {d.strategy.replace(/_/g, ' ')}
              </span>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ color: '#6b7280', fontSize: 11 }}>
                  {d.wins}W / {d.losses}L
                </span>
                <span style={{ color, fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>
                  {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(0)}
                </span>
              </div>
            </div>
            <div style={{ background: '#1f2937', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`,
                height: '100%',
                background: color,
                borderRadius: 4,
                opacity: isProfit ? 1 : 0.7,
                transition: 'width 0.6s ease',
              }} />
            </div>
            <div style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>
              Win rate: {d.win_rate.toFixed(1)}% · {d.total} trades
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all'); // all | 30d | 7d

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (!token) { router.push('/'); return; }
    apiCall('/api/analytics/summary').then(d => {
      if (d) setData(d);
      setLoading(false);
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    router.push('/');
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0e1a', color: '#60a5fa', fontFamily: 'system-ui' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
      <div style={{ fontSize: 18 }}>Loading analytics...</div>
    </div>
  );

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0e1a', color: '#f87171', fontFamily: 'system-ui' }}>
      Failed to load analytics
    </div>
  );

  const { summary, monthly, by_strategy, by_stock, cumulative } = data;
  const netPnl = parseFloat(summary.net_pnl);
  const isProfit = netPnl >= 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#0d1117', borderRight: '1px solid #1f2937', position: 'fixed', top: 0, left: 0, bottom: 0, overflow: 'auto' }}>
        <div style={{ padding: '28px 16px 20px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 2 }}>📈 NSE-BSE Trading</div>
          <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600 }}>AI-Powered Trading Platform</div>
        </div>
        <nav style={{ padding: '12px 0' }}>
          {SIDEBAR.map(item => (
            <a key={item.href} href="#" onClick={e => { e.preventDefault(); router.push(item.href); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: item.href === '/dashboard/analytics' ? '#60a5fa' : '#9ca3af',
                background: item.href === '/dashboard/analytics' ? 'rgba(96,165,250,0.1)' : 'transparent',
                borderLeft: item.href === '/dashboard/analytics' ? '3px solid #60a5fa' : '3px solid transparent',
                textDecoration: 'none', fontSize: 13, fontWeight: item.href === '/dashboard/analytics' ? 600 : 500 }}
              onMouseEnter={e => { if (item.href !== '/dashboard/analytics') { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#fff'; }}}
              onMouseLeave={e => { if (item.href !== '/dashboard/analytics') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid #1f2937' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #1f2937', borderRadius: 8, color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, padding: '32px 40px', width: 'calc(100% - 240px)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>📊 Analytics</h1>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Your trading performance — P&L, win rate & strategy analysis</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', '30d', '7d'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding: '7px 16px', borderRadius: 10, border: '1px solid #1f2937', background: period === p ? '#1e40ff' : '#111827', color: period === p ? '#fff' : '#9ca3af', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                {p === 'all' ? 'All Time' : p}
              </button>
            ))}
          </div>
        </div>

        {/* Key Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 32 }}>
          {/* Net P&L */}
          <div style={{ background: '#111827', borderRadius: 20, padding: 22, border: `1px solid ${isProfit ? '#059669' : '#dc2626'}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 60, opacity: 0.04, pointerEvents: 'none' }}>₹</div>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Net P&L</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: isProfit ? '#34d393' : '#f87171', fontFamily: 'monospace' }}>
              {isProfit ? '+' : ''}₹{summary.net_pnl}
            </div>
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>Gross +₹{summary.gross_profit} / -₹{summary.gross_loss}</div>
          </div>

          {/* Win Rate + Donut */}
          <div style={{ background: '#111827', borderRadius: 20, padding: 22, border: '1px solid #1f2937', display: 'flex', alignItems: 'center', gap: 16 }}>
            <DonutChart winRate={summary.win_rate} size={80} />
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Win Rate</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>
                <span style={{ color: '#34d393', fontWeight: 700 }}>{summary.winning_trades}</span>W /{' '}
                <span style={{ color: '#f87171', fontWeight: 700 }}>{summary.losing_trades}</span>L
              </div>
            </div>
          </div>

          {/* Total Trades */}
          <div style={{ background: '#111827', borderRadius: 20, padding: 22, border: '1px solid #1f2937', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Total Trades</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#60a5fa', fontFamily: 'monospace' }}>{summary.total_trades}</div>
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>Closed positions</div>
          </div>

          {/* Best Trade */}
          <div style={{ background: '#111827', borderRadius: 20, padding: 22, border: '1px solid #059669', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>🏆 Best Trade</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#34d393', fontFamily: 'monospace' }}>+₹{summary.best_trade?.pnl}</div>
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>
              {summary.best_trade?.symbol} {summary.best_trade?.action}
            </div>
          </div>

          {/* Worst Trade */}
          <div style={{ background: '#111827', borderRadius: 20, padding: 22, border: '1px solid #dc2626', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>⚠️ Worst Trade</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#f87171', fontFamily: 'monospace' }}>₹{summary.worst_trade?.pnl}</div>
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>
              {summary.worst_trade?.symbol} {summary.worst_trade?.action}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* Cumulative P&L Chart */}
          <div style={{ background: '#111827', borderRadius: 20, padding: 24, border: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 2 }}>Cumulative P&L</h2>
                <p style={{ fontSize: 12, color: '#6b7280' }}>Net profit/loss over time</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 3, borderRadius: 2, background: isProfit ? '#34d393' : '#f87171' }} />
                <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>
                  {isProfit ? '+' : ''}₹{summary.net_pnl}
                </span>
              </div>
            </div>
            <LineChart data={cumulative} width={700} height={220} />
          </div>

          {/* Monthly P&L Bar */}
          <div style={{ background: '#111827', borderRadius: 20, padding: 24, border: '1px solid #1f2937' }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 2 }}>Monthly P&L</h2>
              <p style={{ fontSize: 12, color: '#6b7280' }}>Month-by-month breakdown</p>
            </div>
            <BarChart data={monthly} height={220} />
          </div>
        </div>

        {/* Strategy + Stock Performance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* Strategy Performance */}
          <div style={{ background: '#111827', borderRadius: 20, padding: 24, border: '1px solid #1f2937' }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 2 }}>Strategy Performance</h2>
              <p style={{ fontSize: 12, color: '#6b7280' }}>P&L breakdown by trading strategy</p>
            </div>
            {by_strategy.length > 0 ? (
              <StrategyBars data={by_strategy} />
            ) : (
              <div style={{ color: '#4b5563', fontSize: 13, textAlign: 'center', padding: 20 }}>No strategy data yet</div>
            )}
          </div>

          {/* Stock Performance */}
          <div style={{ background: '#111827', borderRadius: 20, padding: 24, border: '1px solid #1f2937' }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 2 }}>Stock Performance</h2>
              <p style={{ fontSize: 12, color: '#6b7280' }}>P&L breakdown by stock symbol</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {by_stock.map(s => {
                const pnl = parseFloat(s.pnl);
                const isP = pnl >= 0;
                return (
                  <div key={s.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#0d1117', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', minWidth: 80 }}>{s.symbol}</span>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>
                        <span style={{ color: '#34d393' }}>{s.wins}W</span> / <span style={{ color: '#f87171' }}>{s.total - s.wins}L</span>
                      </span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: 'rgba(52,211,153,0.1)', color: '#34d393', fontWeight: 700 }}>
                        {s.win_rate.toFixed(0)}%
                      </span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: isP ? '#34d393' : '#f87171', fontFamily: 'monospace' }}>
                      {isP ? '+' : ''}₹{pnl.toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Avg Trade P&L + Monthly Summary Table */}
        <div style={{ background: '#111827', borderRadius: 20, padding: 24, border: '1px solid #1f2937', marginBottom: 28 }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 2 }}>Monthly Summary</h2>
            <p style={{ fontSize: 12, color: '#6b7280' }}>Month-by-month trade counts and average P&L</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1f2937' }}>
                {['Month', 'Trades', 'Wins', 'Losses', 'Win Rate', 'Net P&L', 'Avg/Trade'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...(monthly || [])].reverse().map((m, i) => {
                const pnl = parseFloat(m.pnl);
                const isP = pnl >= 0;
                const wins = parseInt(m.wins);
                const trades = parseInt(m.trades);
                const wr = trades > 0 ? ((wins / trades) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#fff' }}>{m.label}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af', fontFamily: 'monospace' }}>{trades}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#34d393', fontFamily: 'monospace', fontWeight: 700 }}>{wins}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#f87171', fontFamily: 'monospace', fontWeight: 700 }}>{trades - wins}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: 'rgba(52,211,153,0.15)', color: '#34d393' }}>{wr}%</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 800, color: isP ? '#34d393' : '#f87171', fontFamily: 'monospace' }}>
                      {isP ? '+' : ''}₹{pnl.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af', fontFamily: 'monospace' }}>₹{parseFloat(m.avg || 0).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Disclaimer */}
        <div style={{ background: '#111827', borderRadius: 14, padding: 16, border: '1px solid #1f2937', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
            <strong style={{ color: '#9ca3af' }}>Disclaimer:</strong> Past performance does not guarantee future results. Trading in stock markets involves substantial risk of loss. This analytics data is for informational purposes only and should not be construed as financial advice. Always do your own research before making investment decisions.
          </div>
        </div>
      </main>
    </div>
  );
}
