'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('saas_token', data.access_token);
      localStorage.setItem('saas_user', JSON.stringify(data));
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api('/api/v1/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name: name, phone }),
      });
      // Auto login after signup
      const data = await api('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('saas_token', data.access_token);
      localStorage.setItem('saas_user', JSON.stringify(data));
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: 20 }}>
      <div style={{ background: '#1e293b', borderRadius: 16, padding: 36, width: '100%', maxWidth: 440, border: '1px solid #334155' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📈</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>NSE-BSE Trading</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{isSignup ? 'Create your free account' : 'Sign in to your account'}</p>
        </div>

        <form onSubmit={isSignup ? handleSignup : handleLogin}>
          {isSignup && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 5 }}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Arjun Singh" required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          )}
          {isSignup && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 5 }}>Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" required type="tel"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 5 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="arjun@example.com" required
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 5 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: 14, boxSizing: 'border-box' }} />
          </div>

          {error && (
            <div style={{ background: '#7f1d1d', border: '1px solid #b91c1c', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: loading ? '#1d4ed8' : '#2563eb', color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Please wait...' : isSignup ? 'Create Account (Free)' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <button onClick={() => setIsSignup(!isSignup)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 13 }}>
            {isSignup ? 'Already have account? Sign In' : "New here? Create free account"}
          </button>
        </div>

        <div style={{ marginTop: 16, textAlign: 'center', color: '#475569', fontSize: 11 }}>
          7-day free trial • No credit card required
        </div>
      </div>
    </div>
  );
}
