"use client";

import type { Tenant } from "@/lib/api";

interface TenantCardProps {
  tenant: Tenant;
  onSuspend: (id: string) => void;
  onUpgrade: (id: string) => void;
  onImpersonate: (id: string) => void;
}

const PLAN_COLORS: Record<string, string> = {
  basic: "#94A3B8",
  professional: "#3B82F6",
  elite: "#8B5CF6",
  enterprise: "#22C55E",
};

const STATUS_BADGE: Record<string, string> = {
  active: "badge-active",
  suspended: "badge-suspended",
  trial: "badge-trial",
};

export default function TenantCard({
  tenant,
  onSuspend,
  onUpgrade,
  onImpersonate,
}: TenantCardProps) {
  const created = new Date(tenant.created_at).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="glass-card p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-white">{tenant.name}</div>
          <div className="text-[11px] mt-0.5" style={{ color: "#475569" }}>
            {tenant.email}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <span className={`badge ${STATUS_BADGE[tenant.status] || "badge-active"}`}>
            {tenant.status}
          </span>
          <span
            className="badge"
            style={{
              background: `${PLAN_COLORS[tenant.plan] ?? "#94A3B8"}18`,
              color: PLAN_COLORS[tenant.plan] ?? "#94A3B8",
              border: `1px solid ${PLAN_COLORS[tenant.plan] ?? "#94A3B8"}30`,
            }}
          >
            {tenant.plan}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Active Cases", value: tenant.cases_active_count },
          { label: "Storage", value: `${tenant.storage_gb} GB` },
          { label: "Created", value: created },
        ].map((s) => (
          <div key={s.label} className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="text-xs font-bold text-white">{s.value}</div>
            <div className="text-[9px] mt-0.5" style={{ color: "#475569" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {tenant.status !== "suspended" && (
          <button
            onClick={() => onSuspend(tenant.tenant_id)}
            className="btn btn-danger text-[11px] flex-1"
          >
            Suspend
          </button>
        )}
        <button
          onClick={() => onUpgrade(tenant.tenant_id)}
          className="btn btn-ghost text-[11px] flex-1"
        >
          Upgrade
        </button>
        <button
          onClick={() => onImpersonate(tenant.tenant_id)}
          className="btn btn-primary text-[11px] flex-1"
        >
          Impersonate
        </button>
      </div>
    </div>
  );
}
