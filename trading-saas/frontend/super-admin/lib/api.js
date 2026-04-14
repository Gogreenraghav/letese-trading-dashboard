const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function api(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('saas_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export function formatINR(amount) {
  if (amount === null || amount === undefined) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}
