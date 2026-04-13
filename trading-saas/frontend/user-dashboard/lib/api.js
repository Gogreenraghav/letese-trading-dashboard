const API = process.env.NEXT_PUBLIC_API_URL || 'https://139.59.65.82/saas';

export async function api(endpoint, options = {}) {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('saas_token');
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
    const res = await fetch(`${API}${endpoint}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  }
  return {};
}

export function formatINR(n) {
  if (n == null) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN');
}

export function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
