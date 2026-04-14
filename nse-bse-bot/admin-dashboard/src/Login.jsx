import { useState } from 'react';
import { adminLogin } from './api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@letese.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await adminLogin(email, password);
      if (!data.user.is_admin) throw new Error('Admin access only');
      onLogin(data.access_token, data.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>📈 LETESE</div>
        <h1 style={styles.title}>Admin Portal</h1>
        <p style={styles.subtitle}>NSE-BSE Trading Bot SaaS</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin Email"
            style={styles.input}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={styles.hint}>Default: admin@letese.com / TiwariAdmin2026!</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0f1c 0%, #1a1f3c 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  },
  card: {
    background: '#111827',
    border: '1px solid #1f2937',
    borderRadius: 16,
    padding: 48,
    width: 420,
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
  },
  logo: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#f9fafb',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 700,
    margin: '0 0 4px',
  },
  subtitle: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 14,
    margin: '0 0 32px',
  },
  error: {
    background: '#7f1d1d',
    border: '1px solid #ef4444',
    color: '#fca5a5',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 20,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  input: {
    background: '#1f2937',
    border: '1px solid #374151',
    borderRadius: 8,
    padding: '12px 16px',
    color: '#f9fafb',
    fontSize: 15,
    outline: 'none',
  },
  button: {
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    border: 'none',
    borderRadius: 8,
    padding: '13px',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },
  hint: {
    color: '#4b5563',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
};