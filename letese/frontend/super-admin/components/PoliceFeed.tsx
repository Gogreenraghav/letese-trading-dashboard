"use client";

import { useState, useEffect, useRef } from "react";
import type { AuditLog } from "@/lib/api";
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Play,
  Inbox,
} from "lucide-react";

interface LiveEvent {
  timestamp: string;
  type: string;
  checks_passed: number;
  checks_failed: number;
  actions_taken: string[];
  outcome?: string;
}

interface PoliceFeedProps {
  initialAlerts?: Array<{
    id: string;
    severity: "P1" | "P2" | "P3";
    message: string;
    tenant_id?: string;
    created_at: string;
  }>;
  initialDLQ?: Record<string, number>;
  initialAutoFixes?: Array<{ timestamp: string; action: string; target: string }>;
}

function SeverityBadge({ sev }: { sev: "P1" | "P2" | "P3" }) {
  const cls = { P1: "sev-p1", P2: "sev-p2", P3: "sev-p3" }[sev];
  const icon = sev === "P1" ? AlertTriangle : sev === "P2" ? Clock : Activity;
  return (
    <span className={`badge ${cls}`}>
      {sev}
    </span>
  );
}

export default function PoliceFeed({
  initialAlerts = [],
  initialDLQ = {},
  initialAutoFixes = [],
}: PoliceFeedProps) {
  const [feed, setFeed] = useState<LiveEvent[]>([]);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [dlq, setDlq] = useState(initialDLQ);
  const [autoFixes, setAutoFixes] = useState(initialAutoFixes);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterOutcome, setFilterOutcome] = useState("all");
  const feedRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket for live audit events
  useEffect(() => {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"}/ws/police`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.event === "audit_event") {
          setFeed((prev) => {
            const next = [msg.data, ...prev];
            return next.slice(0, 50);
          });
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
      };
    } catch {
      // WS not available
    }

    return () => {
      ws?.close();
    };
  }, []);

  // Add demo events if feed is empty
  useEffect(() => {
    if (feed.length === 0) {
      setFeed([
        {
          timestamp: new Date().toISOString(),
          type: "small",
          checks_passed: 12,
          checks_failed: 0,
          actions_taken: [],
          outcome: "pass",
        },
        {
          timestamp: new Date(Date.now() - 30_000).toISOString(),
          type: "compliance",
          checks_passed: 8,
          checks_failed: 1,
          actions_taken: ["Auto-remediated: WhatsApp template mismatch corrected"],
          outcome: "pass",
        },
        {
          timestamp: new Date(Date.now() - 2 * 60_000).toISOString(),
          type: "major",
          checks_passed: 45,
          checks_failed: 2,
          actions_taken: ["Flagged: Scraper pod crash on scraper-2", "PagerDuty alert sent"],
          outcome: "escalated",
        },
      ]);
    }
  }, [feed.length]);

  // Auto-scroll
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [feed.length]);

  const handleTrigger = async (type: "small" | "major") => {
    setTriggering(type);
    await new Promise((r) => setTimeout(r, 800));
    setTriggering(null);
    setFeed((prev) => [
      {
        timestamp: new Date().toISOString(),
        type,
        checks_passed: 0,
        checks_failed: 0,
        actions_taken: [`${type.toUpperCase()} audit triggered manually`],
        outcome: "in_progress",
      },
      ...prev,
    ]);
  };

  const filteredFeed = feed.filter((e) => {
    if (filterType !== "all" && e.type !== filterType) return false;
    if (filterOutcome !== "all" && e.outcome !== filterOutcome) return false;
    if (search && !e.actions_taken.some((a) => a.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const liveIcon = (
    <div className="flex items-center gap-1.5 text-xs" style={{ color: "#22C55E" }}>
      <div className="w-1.5 h-1.5 rounded-full bg-green-500 relative">
        <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "#22C55E", opacity: 0.4 }} />
      </div>
      LIVE
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Trigger Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleTrigger("small")}
            disabled={triggering !== null}
            className="btn btn-ghost text-xs"
          >
            <Play size={11} />
            Run Small Audit
          </button>
          <button
            onClick={() => handleTrigger("major")}
            disabled={triggering !== null}
            className="btn btn-danger text-xs"
          >
            <Play size={11} />
            Run Major Audit
          </button>
        </div>
        {liveIcon}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Live Feed */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <Activity size={13} style={{ color: "#00D4FF" }} />
            <span className="text-sm font-semibold text-white">LIVE AUDIT FEED</span>
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(0,212,255,0.1)", color: "#00D4FF" }}>
              last 50
            </span>
          </div>

          {/* Filters */}
          <div className="px-4 py-2 border-b flex gap-3" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <input
              className="input text-xs py-1.5 flex-1"
              placeholder="Search actions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: "rgba(255,255,255,0.03)" }}
            />
            <select
              className="input select text-xs py-1.5 w-28"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <option value="all">All types</option>
              <option value="small">Small</option>
              <option value="major">Major</option>
              <option value="compliance">Compliance</option>
            </select>
            <select
              className="input select text-xs py-1.5 w-28"
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <option value="all">All outcomes</option>
              <option value="pass">Pass</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>

          {/* Feed items */}
          <div ref={feedRef} className="max-h-80 overflow-y-auto divide-y divide-white/10">
            {filteredFeed.length === 0 ? (
              <div className="p-6 text-center text-xs" style={{ color: "#475569" }}>
                No audit events yet
              </div>
            ) : (
              filteredFeed.map((event, i) => (
                <div key={i} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-[10px]" style={{ color: "#475569" }}>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                      style={{
                        background: event.type === "major" ? "rgba(139,92,246,0.15)" : "rgba(0,212,255,0.1)",
                        color: event.type === "major" ? "#8B5CF6" : "#00D4FF",
                      }}
                    >
                      {event.type}
                    </span>
                    {event.outcome === "pass" && (
                      <span className="badge badge-pass text-[9px]">PASS</span>
                    )}
                    {event.outcome === "escalated" && (
                      <span className="badge badge-suspended text-[9px]">ESCALATED</span>
                    )}
                  </div>
                  <div className="flex gap-4 text-[11px]" style={{ color: "#94A3B8" }}>
                    <span style={{ color: "#22C55E" }}>✓ {event.checks_passed} passed</span>
                    {event.checks_failed > 0 && (
                      <span style={{ color: "#EF4444" }}>✗ {event.checks_failed} failed</span>
                    )}
                    <span>{event.actions_taken.length} actions</span>
                  </div>
                  {event.actions_taken.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {event.actions_taken.map((a, j) => (
                        <div key={j} className="text-[11px] pl-3" style={{ color: "#475569", borderLeft: "2px solid rgba(255,255,255,0.08)" }}>
                          → {a}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Alert Queue */}
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <AlertTriangle size={13} style={{ color: "#F59E0B" }} />
              <span className="text-sm font-semibold text-white">ALERT QUEUE</span>
            </div>
            <div className="divide-y divide-white/10">
              {alerts.length === 0 ? (
                <div className="p-4 text-center text-xs" style={{ color: "#475569" }}>
                  No open alerts
                </div>
              ) : (
                alerts.map((a) => (
                  <div key={a.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge sev={a.severity} />
                      <span className="text-[10px]" style={{ color: "#475569" }}>
                        {new Date(a.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: "#94A3B8" }}>{a.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DLQ Monitor */}
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <Inbox size={13} style={{ color: "#EF4444" }} />
              <span className="text-sm font-semibold text-white">DLQ MONITOR</span>
            </div>
            <div className="divide-y divide-white/10">
              {Object.keys(dlq).length === 0 ? (
                <div className="p-4 text-center text-xs" style={{ color: "#475569" }}>
                  No DLQ messages
                </div>
              ) : (
                Object.entries(dlq).map(([topic, count]) => (
                  <div key={topic} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-white truncate max-w-[180px]">{topic}</div>
                    </div>
                    <span
                      className="text-xs font-bold"
                      style={{ color: (count as number) > 0 ? "#EF4444" : "#22C55E" }}
                    >
                      {(count as number).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Auto-Remediation Log */}
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <CheckCircle size={13} style={{ color: "#22C55E" }} />
              <span className="text-sm font-semibold text-white">AUTO-REMEDIATION LOG</span>
            </div>
            <div className="divide-y divide-white/10 max-h-48 overflow-y-auto">
              {autoFixes.length === 0 ? (
                <div className="p-4 text-center text-xs" style={{ color: "#475569" }}>
                  No auto-fixes applied
                </div>
              ) : (
                autoFixes.map((f, i) => (
                  <div key={i} className="px-4 py-2.5">
                    <div className="text-[10px] mb-0.5" style={{ color: "#475569" }}>
                      {new Date(f.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-xs" style={{ color: "#94A3B8" }}>
                      <span style={{ color: "#22C55E" }}>✓</span> {f.action}{" "}
                      <span className="mono" style={{ color: "#8B5CF6" }}>{f.target}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
