'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://139.59.65.82:3021';

async function callApi(endpoint, options = {}) {
  const token = localStorage.getItem('saas_token');
  const res = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await callApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!data.user?.is_admin) {
        setError('Access denied. Admin only.');
        setLoading(false);
        return;
      }
      localStorage.setItem('saas_token', data.token);
      localStorage.setItem('saas_user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#111827', borderRadius: 20, padding: 40, width: '100%', maxWidth: 440, border: '1px solid #1f2937', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>NSE-BSE Trading</h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Super Admin Portal</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@nsebse.com"
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #374151', background: '#0d1117', color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #374151', background: '#0d1117', color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {error && (
            <div style={{ background: '#7f1d1d', border: '1px solid #b91c1c', borderRadius: 10, padding: '12px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px', borderRadius: 10, border: 'none',
              background: loading ? '#1d4ed8' : '#2563eb', color: '#fff',
              fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', color: '#4b5563', fontSize: 12 }}>
          Demo: admin@nsebse.com / Admin@123
        </div>
      </div>
    </div>
  );
}
