"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SystemHealth } from "@/lib/api";
import { fetchSystemHealth } from "@/lib/api";
import {
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  Server,
  Database,
  Zap,
  HardDrive,
  Globe,
} from "lucide-react";

interface SystemHealthMatrixProps {
  initialData?: SystemHealth;
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full relative"
        style={{ background: ok ? "#22C55E" : "#EF4444" }}
      >
        {ok && (
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: "#22C55E", opacity: 0.4 }}
          />
        )}
      </div>
      <span className="text-xs font-semibold" style={{ color: ok ? "#22C55E" : "#EF4444" }}>
        {ok ? "HEALTHY" : "DOWN"}
      </span>
    </div>
  );
}

function AIPotCard({
  name,
  health,
  color,
}: {
  name: string;
  health: SystemHealth["aipots"][keyof SystemHealth["aipots"]];
  color: string;
}) {
  const isHealthy = health.status === "active" || health.status === "warm";
  return (
    <div
      className="p-4 rounded-xl border transition-all duration-200"
      style={{
        background: `linear-gradient(145deg, ${color}08 0%, rgba(0,0,0,0.2) 100%)`,
        borderColor: `${color}30`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold tracking-widest text-white">{name}</span>
        <StatusDot ok={isHealthy} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#475569" }}>
            Pods
          </div>
          <div className="text-lg font-bold" style={{ color }}>
            {health.pods}
          </div>
        </div>
        {"last_heartbeat_s" in health && (
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#475569" }}>
              Last HB
            </div>
            <div className="text-lg font-bold text-white">
              {(health as { last_heartbeat_s: number }).last_heartbeat_s}s
            </div>
          </div>
        )}
        {"replicas" in health && (
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#475569" }}>
              Replicas
            </div>
            <div className="text-lg font-bold text-white">
              {(health as { replicas: number }).replicas}
            </div>
          </div>
        )}
      </div>
      <div className="mt-3 text-[10px] uppercase tracking-wider" style={{ color: "#475569" }}>
        Status: {health.status}
      </div>
    </div>
  );
}

function InfraRow({
  icon: Icon,
  label,
  status,
  detail,
  ok,
}: {
  icon: React.ElementType;
  label: string;
  status: string;
  detail: string;
  ok: boolean;
}) {
  return (
    <tr>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Icon size={13} style={{ color: "#475569" }} />
          <span className="text-xs text-white">{label}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: ok ? "#22C55E" : "#EF4444" }}
          />
          <span className="text-xs font-semibold" style={{ color: ok ? "#22C55E" : "#EF4444" }}>
            {status}
          </span>
        </div>
      </td>
      <td className="py-3 px-4 text-xs" style={{ color: "#94A3B8" }}>
        {detail}
      </td>
    </tr>
  );
}

export default function SystemHealthMatrix({ initialData }: SystemHealthMatrixProps) {
  const [health, setHealth] = useState<SystemHealth | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const loadHealth = useCallback(async () => {
    try {
      const data = await fetchSystemHealth();
      setHealth(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket connection
  useEffect(() => {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"}/ws/health`;
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => setWsConnected(true);
        ws.onmessage = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.event === "health_update" && msg.data) {
            // Merge WS data into last HTTP response
            setHealth((prev) =>
              prev
                ? {
                    ...prev,
                    api: {
                      ...prev.api,
                      p95_latency_ms: msg.data.api_p95_latency_ms ?? prev.api.p95_latency_ms,
                    },
                    postgres: { ...prev.postgres, status: msg.data.postgres_healthy ? "healthy" : "degraded" },
                    redis: { ...prev.redis, memory_pct: msg.data.redis_memory_pct ?? prev.redis.memory_pct },
                    kafka: {
                      ...prev.kafka,
                      status: (msg.data.kafka_consumer_lag ?? 0) < 10 ? "healthy" : "degraded",
                    },
                    aipots: {
                      scraper: { ...prev.aipots.scraper, pods: msg.data.scraper_pods ?? prev.aipots.scraper.pods },
                      compliance: { ...prev.aipots.compliance, pods: msg.data.compliance_pods ?? prev.aipots.compliance.pods },
                      communicator: { ...prev.aipots.communicator, pods: msg.data.communicator_pods ?? prev.aipots.communicator.pods },
                      police: { ...prev.aipots.police, pods: msg.data.police_pods ?? prev.aipots.police.pods },
                    },
                    timestamp: new Date().toISOString(),
                  }
                : prev
            );
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimer = setTimeout(connect, 5000);
        };

        ws.onerror = () => ws.close();
      } catch {
        // WebSocket not available, fall back to polling
      }
    }

    if (autoRefresh) {
      connect();
    }

    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [autoRefresh]);

  // Polling fallback
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadHealth, 30_000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadHealth]);

  // Initial load
  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const totalKafkaLag = health?.kafka.topics
    ? Object.values(health.kafka.topics).reduce((s, t) => s + t.lag, 0)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {wsConnected ? (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#22C55E" }}>
              <Wifi size={12} /> WebSocket LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#F59E0B" }}>
              <WifiOff size={12} /> WS Disconnected · Polling
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: "#94A3B8" }}>
            <div
              className="w-9 h-5 rounded-full p-0.5 transition-colors duration-200"
              style={{
                background: autoRefresh ? "#1A4FBF" : "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              onClick={() => setAutoRefresh((v) => !v)}
            >
              <div
                className="w-4 h-4 rounded-full transition-transform duration-200"
                style={{
                  background: "#fff",
                  transform: autoRefresh ? "translateX(16px)" : "translateX(0)",
                }}
              />
            </div>
            Auto-refresh
          </label>
          <button
            onClick={loadHealth}
            disabled={loading}
            className="btn btn-ghost text-xs"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* AIPOT Matrix */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Zap size={14} style={{ color: "#00D4FF" }} />
          AIPOT STATUS MATRIX
          {health?.timestamp && (
            <span className="ml-2 text-[10px] font-normal" style={{ color: "#475569" }}>
              Updated {new Date(health.timestamp).toLocaleTimeString()}
            </span>
          )}
        </h2>
        {loading && !health ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {health?.aipots && (
              <>
                <AIPotCard name="SCRAPER" health={health.aipots.scraper} color="#22C55E" />
                <AIPotCard name="COMPLIANCE" health={health.aipots.compliance} color="#3B82F6" />
                <AIPotCard name="COMMUNICATOR" health={health.aipots.communicator} color="#8B5CF6" />
                <AIPotCard name="POLICE" health={health.aipots.police} color="#F59E0B" />
              </>
            )}
          </div>
        )}
      </div>

      {/* Infrastructure Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Server size={14} style={{ color: "#8B5CF6" }} />
            INFRASTRUCTURE
          </h2>
        </div>
        <table className="w-full">
          <tbody>
            <InfraRow
              icon={Database}
              label="PostgreSQL Primary"
              status="HEALTHY"
              detail={`Rep Lag: ${health?.postgres.replication_lag_s ?? "—"}s · Pool: ${health?.postgres.pool_utilisation_pct ?? "—"}%`}
              ok={health?.postgres.status === "healthy"}
            />
            <InfraRow
              icon={Database}
              label="PostgreSQL Replica"
              status="HEALTHY"
              detail={`Pool utilisation: ${health?.postgres.pool_utilisation_pct ?? "—"}%`}
              ok={health?.postgres.status === "healthy"}
            />
            <InfraRow
              icon={HardDrive}
              label="Redis"
              status="HEALTHY"
              detail={`Memory: ${health?.redis.memory_pct ?? "—"}% · ${health?.redis.memory_used ?? "—"}`}
              ok={health?.redis.status === "healthy"}
            />
            <InfraRow
              icon={Zap}
              label="Kafka"
              status="HEALTHY"
              detail={`Consumer Lag: ${totalKafkaLag} msgs · ${Object.keys(health?.kafka.topics ?? {}).length} topics`}
              ok={health?.kafka.status === "healthy"}
            />
            <InfraRow
              icon={HardDrive}
              label="S3 Bucket"
              status="HEALTHY"
              detail={`${health?.s3.bucket ?? "—"} · Used: ${health?.s3.used_tb ?? "—"} TB`}
              ok={health?.s3.status === "healthy"}
            />
            <InfraRow
              icon={Globe}
              label="API P95 Latency"
              status={`${health?.api.p95_latency_ms ?? "—"}ms`}
              detail="Target: < 500ms"
              ok={(health?.api.p95_latency_ms ?? 999) < 500}
            />
          </tbody>
        </table>
      </div>

      {/* Scraper rate */}
      {health && (
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Activity size={14} style={{ color: "#00D4FF" }} />
            SCRAPER PERFORMANCE
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-2">
                <span style={{ color: "#94A3B8" }}>Success Rate (10 min)</span>
                <span className="font-bold" style={{ color: "#22C55E" }}>
                  {(health.scraper_success_rate_10min * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(health.scraper_success_rate_10min * 100).toFixed(1)}%`,
                    background: "linear-gradient(90deg, #1A4FBF, #22C55E)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
