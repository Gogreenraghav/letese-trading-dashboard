export const API_BASE = 'http://139.59.65.82:8001/api';

export const adminLogin = async (email, password) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
};

export const getStats = async (token) => {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const getUsers = async (token, page = 1, search = '') => {
  const params = new URLSearchParams({ page, limit: 20 });
  if (search) params.set('search', search);
  const res = await fetch(`${API_BASE}/admin/users?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const updateUser = async (token, userId, data) => {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteUser = async (token, userId) => {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const getUserDetail = async (token, userId) => {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/details`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const subscribePlan = async (token, planId) => {
  const res = await fetch(`${API_BASE}/subscriptions/subscribe/${planId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const getPlans = async () => {
  const res = await fetch(`${API_BASE}/subscriptions/plans`);
  return res.json();
};