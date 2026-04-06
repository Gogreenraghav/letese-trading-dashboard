"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import { fetchSystemHealth, fetchTenants } from "@/lib/api";
import type { SystemHealth, Tenant } from "@/lib/api";
import {
  Building2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Users,
  Database,
  Activity,
} from "lucide-react";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "#00D4FF",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="glass-card p-5 flex items-start gap-4">
      <div
        className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
          {label}
        </div>
        {sub && (
          <div className="text-[11px] mt-0.5" style={{ color: "#475569" }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function AIPotRow({
  name,
  status,
  pods,
  heartbeats,
  color,
}: {
  name: string;
  status: string;
  pods: number;
  heartbeats?: number;
  color: string;
}) {
  const isHealthy = status === "active" || status === "warm";
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: isHealthy ? "#22C55E" : "#EF4444" }}
      />
      <div className="flex-1">
        <div className="text-xs font-medium text-white">{name}</div>
        <div className="text-[10px]" style={{ color: "#475569" }}>
          {status} · {pods} pod{pods !== 1 ? "s" : ""}
          {heartbeats !== undefined ? ` · ${heartbeats}s ago` : ""}
        </div>
      </div>
      <span
        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
        style={{
          color,
          background: `${color}18`,
          border: `1px solid ${color}30`,
        }}
      >
        {status}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchSystemHealth().catch(() => null),
      fetchTenants({ limit: 5 }).catch(() => null),
    ]).then(([h, t]) => {
      setHealth(h);
      setTenants(t?.tenants ?? []);
      setLoading(false);
    });
  }, []);

  const tenantCount = tenants.length;
  const activeTenants = tenants.filter((t) => t.status === "active").length;
  const suspendedTenants = tenants.filter((t) => t.status === "suspended").length;

  return (
    <DashboardShell title="Dashboard Overview">
      <div className="space-y-6 animate-fade-in">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Tenants"
            value={loading ? "—" : tenantCount}
            icon={Building2}
            color="#00D4FF"
          />
          <StatCard
            label="Active Tenants"
            value={loading ? "—" : activeTenants}
            sub="↕ all plans"
            icon={CheckCircle}
            color="#22C55E"
          />
          <StatCard
            label="Suspended"
            value={loading ? "—" : suspendedTenants}
            icon={XCircle}
            color="#EF4444"
          />
          <StatCard
            label="Scraper Success"
            value={loading ? "—" : `${((health?.scraper_success_rate_10min ?? 0) * 100).toFixed(1)}%`}
            sub="last 10 min"
            icon={Zap}
            color="#8B5CF6"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AIPOT Status */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} style={{ color: "#00D4FF" }} />
              <h2 className="text-sm font-semibold text-white">AIPOT STATUS</h2>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px]" style={{ color: "#22C55E" }}>LIVE</span>
              </div>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {health?.aipots && (
                  <>
                    <AIPotRow name="SCRAPER" color="#22C55E" {...health.aipots.scraper} />
                    <AIPotRow name="COMPLIANCE" color="#3B82F6" {...health.aipots.compliance} />
                    <AIPotRow name="COMMUNICATOR" color="#8B5CF6" {...health.aipots.communicator} />
                    <AIPotRow name="POLICE" color="#F59E0B" {...health.aipots.police} />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Infrastructure */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Database size={14} style={{ color: "#8B5CF6" }} />
              <h2 className="text-sm font-semibold text-white">INFRASTRUCTURE</h2>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  {
                    name: "PostgreSQL Primary",
                    status: health?.postgres.status === "healthy" ? "HEALTHY" : "DOWN",
                    detail: `Rep lag: ${health?.postgres.replication_lag_s}s`,
                    ok: true,
                  },
                  {
                    name: "PostgreSQL Replica",
                    status: health?.postgres.status === "healthy" ? "HEALTHY" : "DOWN",
                    detail: `Pool: ${health?.postgres.pool_utilisation_pct}%`,
                    ok: true,
                  },
                  {
                    name: "Redis",
                    status: health?.redis.status === "healthy" ? "HEALTHY" : "DOWN",
                    detail: `Memory: ${health?.redis.memory_pct}%`,
                    ok: true,
                  },
                  {
                    name: "Kafka",
                    status: health?.kafka.status === "healthy" ? "HEALTHY" : "DOWN",
                    detail: `Lag: ${health?.kafka.topics ? Object.values(health.kafka.topics).reduce((s, t) => s + t.lag, 0) : 0} msgs`,
                    ok: true,
                  },
                  {
                    name: "API P95 Latency",
                    status: `${health?.api.p95_latency_ms ?? 0}ms`,
                    detail: "Target: < 500ms",
                    ok: (health?.api.p95_latency_ms ?? 0) < 500,
                  },
                ].map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: row.ok ? "#22C55E" : "#EF4444" }}
                    />
                    <span className="flex-1 text-xs text-white">{row.name}</span>
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: row.ok ? "#22C55E" : "#EF4444" }}
                    >
                      {row.status}
                    </span>
                    <span className="text-[10px]" style={{ color: "#475569" }}>
                      {row.detail}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Tenants */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={14} style={{ color: "#00D4FF" }} />
            <h2 className="text-sm font-semibold text-white">RECENT TENANTS</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Plan</th>
                <th>Cases</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j}>
                          <div className="h-4 w-24 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : tenants.map((t) => (
                    <tr key={t.tenant_id}>
                      <td className="font-medium text-white">{t.name}</td>
                      <td>
                        <span className={`badge badge-plan-${t.plan}`}>{t.plan}</span>
                      </td>
                      <td>{t.cases_active_count}</td>
                      <td>
                        <span className={`badge badge-${t.status}`}>{t.status}</span>
                      </td>
                      <td style={{ color: "#475569" }}>
                        {new Date(t.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
