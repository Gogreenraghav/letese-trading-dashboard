'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatDate } from '@/lib/api';

const NAV = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Users', href: '/dashboard/users' },
  { label: 'Plans', href: '/dashboard/plans' },
  { label: 'Analytics', href: '/dashboard/analytics' },
  { label: 'Logs', href: '/dashboard/logs' },
];

export default function LogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeNav, setActiveNav] = useState('/dashboard/logs');

  useEffect(() => {
    const token = localStorage.getItem('saas_token');
    if (!token) { router.push('/'); return; }
    loadLogs();
  }, [page]);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await api(`/api/v1/admin/logs?page=${page}&limit=50`);
      setLogs(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const ACTION_COLORS = {
    change_plan: '#3b82f6',
    suspend_user: '#ef4444',
    activate_user: '#22c55e',
    login: '#8b5cf6',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#1e293b', borderRight: '1px solid #334155', padding: '24px 0' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #334155', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>📊 Trading SaaS</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Super Admin</div>
        </div>
        <nav>
          {NAV.map(item => (
            <a key={item.href} href={item.href}
              onClick={(e) => { e.preventDefault(); setActiveNav(item.href); router.push(item.href); }}
              style={{
                display: 'block', padding: '10px 20px', color: activeNav === item.href ? '#3b82f6' : '#94a3b8',
                textDecoration: 'none', fontSize: 14, fontWeight: activeNav === item.href ? 600 : 400,
                background: activeNav === item.href ? 'rgba(59,130,246,0.1)' : 'transparent',
                borderLeft: activeNav === item.href ? '3px solid #3b82f6' : '3px solid transparent',
              }}
            >{item.label}</a>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>Admin Logs</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setPage(p => Math.max(1, p - 1)); }} disabled={page <= 1}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>
              ← Prev
            </button>
            <span style={{ padding: '6px 14px', color: '#94a3b8', fontSize: 13 }}>Page {page}</span>
            <button onClick={() => setPage(p => p + 1)}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', cursor: 'pointer' }}>
              Next →
            </button>
          </div>
        </div>

        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['Time', 'Admin', 'Action', 'Target User', 'Details'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid #334155' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#94a3b8' }}>{formatDate(log.created_at)}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#fff' }}>{log.admin_email || 'System'}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${ACTION_COLORS[log.action] || '#64748b'}20`, color: ACTION_COLORS[log.action] || '#94a3b8' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#94a3b8' }}>{log.target_user_id ? log.target_user_id.slice(0, 8) + '...' : '-'}</td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                    {log.details ? JSON.stringify(log.details).slice(0, 60) : '-'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No logs yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
