/**
 * LETESE● Super Admin API Client
 * All calls go through the FastAPI backend with Bearer JWT auth.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sa_token");
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  // Some DELETE/PATCH return empty body
  const text = await res.text();
  return text ? JSON.parse(text) : ({ ok: true } as T);
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function fetchSystemHealth() {
  return request<SystemHealth>("GET", "/api/v1/admin/system-health");
}

// ─── Tenants ──────────────────────────────────────────────────────────────────

export async function fetchTenants(params?: {
  status?: string;
  plan?: string;
  limit?: number;
}) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return request<{ tenants: Tenant[] }>(
    "GET",
    `/api/v1/admin/tenants${qs ? `?${qs}` : ""}`
  );
}

export async function createTenant(data: TenantCreatePayload) {
  return request<Tenant>("POST", "/api/v1/admin/tenants", data);
}

export async function updateTenant(
  tenantId: string,
  data: Partial<TenantCreatePayload & { status?: string; plan?: string }>
) {
  return request("PATCH", `/api/v1/admin/tenants/${tenantId}`, data);
}

export async function impersonateTenant(tenantId: string) {
  return request<{ token: string; tenant_id: string }>(
    "POST",
    `/api/v1/admin/tenants/${tenantId}/impersonate`
  );
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function fetchAuditLogs(params?: AuditLogParams) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v !== undefined)
    )
  ).toString();
  return request<AuditLogResponse>(
    "GET",
    `/api/v1/admin/audit-logs${qs ? `?${qs}` : ""}`
  );
}

export async function triggerAudit(auditType: "small" | "major") {
  return request("POST", `/api/v1/admin/audit/trigger?audit_type=${auditType}`);
}

// ─── Vendors ──────────────────────────────────────────────────────────────────

export async function fetchVendorConfig(vendorName: string) {
  return request<VendorConfig>(
    "GET",
    `/api/v1/super-admin/vendors/${vendorName}`
  );
}

export async function updateVendorConfig(
  vendorName: string,
  configData: Record<string, unknown>
) {
  return request<VendorUpdateResponse>(
    "PATCH",
    `/api/v1/super-admin/vendors/${vendorName}`,
    { config_data: configData }
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SystemHealth {
  timestamp: string;
  api: { status: string; p95_latency_ms: number; p99_latency_ms: number };
  postgres: { status: string; replication_lag_s: number; pool_utilisation_pct: number };
  redis: { status: string; memory_used: string; memory_pct: number };
  kafka: {
    status: string;
    topics: Record<string, { lag: number; partitions: number }>;
  };
  s3: { status: string; bucket: string; used_tb: number };
  aipots: {
    scraper: AIPotStatus;
    compliance: AIPotStatus;
    communicator: AIPotStatus;
    police: AIPotStatus & { replicas?: number };
  };
  scraper_success_rate_10min: number;
}

export interface AIPotStatus {
  status: string;
  pods: number;
  last_heartbeat_s?: number;
  replicas?: number;
}

export interface Tenant {
  tenant_id: string;
  name: string;
  plan: string;
  status: string;
  cases_active_count: number;
  storage_gb: number;
  email: string;
  mrr_inr?: number;
  created_at: string;
  last_active?: string;
}

export interface TenantCreatePayload {
  name: string;
  email: string;
  phone: string;
  plan: string;
  bar_enrolment_no?: string;
  gstin?: string;
}

export interface AuditLogParams {
  audit_type?: string;
  outcome?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
}

export interface AuditLog {
  audit_id: string;
  audit_type: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  checks_run: number;
  checks_passed: number;
  checks_failed: number;
  auto_actions_taken: string[];
  escalation_triggered: boolean;
  pagerduty_incident_id?: string;
  full_report?: Record<string, unknown>;
}

export interface VendorConfig {
  config_id: string;
  vendor_name: string;
  config_data: Record<string, unknown>;
  is_active: boolean;
  last_verified_at?: string;
  verification_status: string;
  updated_at: string;
}

export interface VendorUpdateResponse {
  message: string;
  vendor: string;
  verification_status?: string;
  latency_ms?: number;
}
