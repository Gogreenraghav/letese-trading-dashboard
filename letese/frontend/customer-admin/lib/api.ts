/**
 * LETESE● Customer Admin API Client
 * All calls to /api/v1/admin/* endpoints.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.letese.xyz";

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("letese_token")
    : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────────

export interface User {
  user_id: string;
  full_name: string;
  email: string;
  role: "admin" | "advocate" | "clerk" | "paralegal" | "intern";
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  open_cases: number;
  avatar_initials: string;
}

export interface TenantUserList {
  users: User[];
  total: number;
  limit: number;
  offset: number;
}

export interface Subscription {
  plan: string;
  price_monthly_inr: number;
  current_period_start: string | null;
  current_period_end: string | null;
  limits: {
    cases: number;
    storage_gb: number;
    users: number;
    ai_calls: number;
    features: string[];
  };
  storage_used_bytes: number;
  storage_gb_used: number;
  cases_active_count: number;
}

export interface UpgradeResponse {
  checkout_url: string;
  razorpay_customer_id: string;
  amount_inr: number;
  plan: string;
  currency: string;
}

export interface Invoice {
  invoice_id: string;
  invoice_number: string;
  client_name: string;
  total_inr: number;
  paid_inr: number;
  status: "pending" | "paid" | "partial" | "overdue" | "failed";
  due_date: string;
  created_at: string;
}

export interface AnalyticsData {
  period: string;
  ai_calls: {
    total_requests: number;
    tokens_input: number;
    tokens_output: number;
    cost_inr: number;
  };
  communications: Record<string, Record<string, number>>;
  storage_gb?: number;
  scraper_activity?: Record<string, number>;
}

// ── Team API ────────────────────────────────────────────────────────

export const teamApi = {
  listUsers: (limit = 50, offset = 0) =>
    apiRequest<TenantUserList>(`/api/v1/admin/users?limit=${limit}&offset=${offset}`),

  inviteUser: (email: string, role: string, fullName?: string) =>
    apiRequest<{ message: string; expires_in: number }>("/api/v1/admin/users/invite", {
      method: "POST",
      body: { email, role, full_name: fullName },
    }),

  updateUser: (userId: string, updates: { role?: string; is_active?: boolean; full_name?: string }) =>
    apiRequest<{ message: string; user_id: string; changes: Record<string, unknown> }>(
      `/api/v1/admin/users/${userId}`,
      { method: "PATCH", body: updates }
    ),

  removeUser: (userId: string) =>
    apiRequest<{ message: string; reassigned_cases_to: string }>(
      `/api/v1/admin/users/${userId}`,
      { method: "DELETE" }
    ),
};

// ── Billing API ────────────────────────────────────────────────────

export const billingApi = {
  getSubscription: () =>
    apiRequest<Subscription>("/api/v1/admin/subscription/current"),

  upgradePlan: (plan: string) =>
    apiRequest<UpgradeResponse>("/api/v1/admin/subscription/upgrade", {
      method: "POST",
      body: { plan },
    }),

  listInvoices: (status?: string) =>
    apiRequest<{ invoices: Invoice[] }>(
      `/api/v1/invoices${status ? `?status=${status}` : ""}`
    ),

  downloadInvoice: (invoiceId: string) =>
    `${API_BASE}/api/v1/invoices/${invoiceId}/pdf`,

  sendInvoice: (invoiceId: string) =>
    apiRequest<{ message: string }>(`/api/v1/invoices/${invoiceId}/send`, {
      method: "POST",
    }),
};

// ── Analytics API ──────────────────────────────────────────────────

export const analyticsApi = {
  getUsage: (period = "30d") =>
    apiRequest<AnalyticsData>(`/api/v1/admin/analytics?period=${period}`),
};

// ── Tenant Settings API ────────────────────────────────────────────

export const settingsApi = {
  updateProfile: (data: {
    name?: string;
    email?: string;
    phone?: string;
    firm_address?: string;
    bar_enrolment_no?: string;
    gstin?: string;
  }) =>
    apiRequest<{ message: string }>("/api/v1/admin/tenant", {
      method: "PATCH",
      body: data,
    }),

  updateNotificationPrefs: (prefs: {
    whatsapp?: boolean;
    sms?: boolean;
    email?: boolean;
    inapp?: boolean;
    hearing_reminder_days?: number[];
  }) =>
    apiRequest<{ message: string }>("/api/v1/admin/notification-prefs", {
      method: "PATCH",
      body: prefs,
    }),

  exportData: () =>
    `${API_BASE}/api/v1/admin/export`,
};

// ── Wallet / Topup ───────────────────────────────────────────────────
export interface Wallet {
  wallet_id: string;
  tenant_id: string;
  balance_inr: string;
  total_loaded_inr: string;
}

export interface TopupRequest {
  request_id: string;
  tenant_id: string;
  requested_by_user_id: string;
  requested_by_name: string | null;
  amount_inr: string;
  payment_method: string;
  transaction_ref: string | null;
  remarks: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  admin_notes: string | null;
  approved_by_user_id: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface WalletTransaction {
  transaction_id: string;
  tenant_id: string;
  amount_inr: string;
  type: "credit" | "debit";
  source: string;
  reference_id: string | null;
  reference_type: string | null;
  description: string | null;
  balance_before_inr: string;
  balance_after_inr: string;
  created_at: string;
}

export const walletApi = {
  getWallet: (): Promise<Wallet> =>
    apiRequest<Wallet>("/api/v1/wallet/me"),

  getMyTopups: (): Promise<TopupRequest[]> =>
    apiRequest<TopupRequest[]>("/api/v1/wallet/topup/me"),

  requestTopup: (data: {
    amount_inr: number;
    payment_method: string;
    transaction_ref?: string;
    remarks?: string;
  }): Promise<TopupRequest> =>
    apiRequest<TopupRequest>("/api/v1/wallet/topup/request", {
      method: "POST",
      body: data,
    }),

  getTransactions: (limit = 50): Promise<WalletTransaction[]> =>
    apiRequest<WalletTransaction[]>("/api/v1/wallet/transactions/me"),
};
