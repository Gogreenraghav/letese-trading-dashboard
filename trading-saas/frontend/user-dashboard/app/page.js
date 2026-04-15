'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API = 'http://139.59.65.82:3021'; // Direct to SaaS backend

async function callApi(endpoint, options = {}) {
  const token = localStorage.getItem('user_token');
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

const PLAN_COLORS = {
  free:        { bg: 'rgba(156,163,175,0.2)',  color: '#9ca3af' },
  basic:       { bg: 'rgba(52,211,153,0.2)',   color: '#34d399' },
  pro:         { bg: 'rgba(96,165,250,0.2)',   color: '#60a5fa' },
  enterprise:  { bg: 'rgba(167,139,250,0.2)',  color: '#a78bfa' },
};

const PLANS = [
  { name: 'Free', price: '₹0/mo', features: ['5 Stocks', '1 Strategy', 'Paper Trading', 'Email Support'], badge: null },
  { name: 'Basic', price: '₹499/mo', features: ['20 Stocks', '1 Strategy', 'Telegram Alerts', 'Email Support'], badge: 'POPULAR' },
  { name: 'Pro', price: '₹1,999/mo', features: ['Unlimited Stocks', 'All Strategies', 'Live Signals', 'Telegram + API'], badge: 'BEST VALUE' },
  { name: 'Enterprise', price: '₹4,999/mo', features: ['White Label', 'Custom Strategies', 'Dedicated Support', 'Multi-User'], badge: null },
];

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
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
      if (data.user?.is_admin) {
        setError('Use admin portal for admin login');
        setLoading(false);
        return;
      }
      localStorage.setItem('user_token', data.token);
      localStorage.setItem('user_refresh', data.refreshToken || '');
      localStorage.setItem('user_data', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Check credentials.');
    }
    setLoading(false);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await callApi('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name: fullName, phone }),
      });
      // Auto-login after signup
      const data = await callApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('user_token', data.token);
      localStorage.setItem('user_refresh', data.refreshToken || '');
      localStorage.setItem('user_data', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed. Try again.');
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '20px 40px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>📈</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>NSE-BSE Trading</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setTab('login')} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: tab === 'login' ? '#2563eb' : 'transparent', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Sign In</button>
          <button onClick={() => setTab('signup')} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: tab === 'signup' ? '#2563eb' : 'transparent', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Sign Up</button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Form Card */}
          <div style={{ background: '#111827', borderRadius: 20, padding: 36, border: '1px solid #1f2937', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', marginBottom: 24 }}>
            {tab === 'login' ? (
              <>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Welcome Back</h2>
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>Sign in to access your trading dashboard</p>

                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="you@example.com"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #374151', background: '#0d1117', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #374151', background: '#0d1117', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  {error && (
                    <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '12px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 20 }}>
                      {error}
                    </div>
                  )}
                  <button type="submit" disabled={loading}
                    style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: loading ? '#1d4ed8' : '#2563eb', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Signing in...' : 'Sign In →'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Create Account</h2>
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>Start free — upgrade anytime</p>

                <form onSubmit={handleSignup}>
                  <div style={{ display: 'grid', gap: 16, marginBottom: 18 }}>
                    <div>
                      <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Full Name</label>
                      <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                        placeholder="Rahul Sharma"
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #374151', background: '#0d1117', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Email Address</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                        placeholder="you@example.com"
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #374151', background: '#0d1117', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Phone Number</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                        placeholder="+91 98765 43210"
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #374151', background: '#0d1117', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Password <span style={{ color: '#4b5563' }}>(min 6 chars)</span></label>
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                        placeholder="••••••••"
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #374151', background: '#0d1117', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  {error && (
                    <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '12px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 20 }}>
                      {error}
                    </div>
                  )}
                  <button type="submit" disabled={loading}
                    style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: loading ? '#1d4ed8' : '#10b981', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Creating account...' : 'Create Free Account →'}
                  </button>
                  <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#4b5563' }}>
                    Free forever plan • No credit card required
                  </p>
                </form>
              </>
            )}
          </div>

          {/* Features */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['🔐 Bank-level security', '⚡ Live NSE/BSE signals', '📱 Telegram alerts'].map(f => (
              <span key={f} style={{ fontSize: 12, color: '#6b7280', background: '#111827', padding: '6px 14px', borderRadius: 9999, border: '1px solid #1f2937' }}>{f}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
