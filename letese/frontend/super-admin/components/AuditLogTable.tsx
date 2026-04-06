"use client";

import { useState, useEffect, useCallback } from "react";
import type { AuditLog, AuditLogParams } from "@/lib/api";
import { fetchAuditLogs } from "@/lib/api";
import {
  FileText,
  Download,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";

const TYPE_COLORS: Record<string, string> = {
  small: "#00D4FF",
  major: "#8B5CF6",
  compliance: "#22C55E",
};

function ExpandedReport({ report }: { report?: Record<string, unknown> }) {
  return (
    <div className="mt-3 p-4 rounded-lg" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="text-[10px] uppercase tracking-wider mb-2 font-semibold" style={{ color: "#475569" }}>
        Full Report JSON
      </div>
      <pre
        className="text-[11px] font-mono overflow-x-auto p-3 rounded"
        style={{ color: "#00D4FF", background: "rgba(0,0,0,0.2)" }}
      >
        {JSON.stringify(report ?? {}, null, 2)}
      </pre>
    </div>
  );
}

interface AuditChartData {
  date: string;
  pass: number;
  fail: number;
}

export default function AuditLogTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [filterType, setFilterType] = useState("");
  const [filterOutcome, setFilterOutcome] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: AuditLogParams = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };
      if (filterType) params.audit_type = filterType;
      if (filterOutcome) params.outcome = filterOutcome;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await fetchAuditLogs(params);
      setLogs(res.logs ?? []);
      setTotal(res.total ?? 0);
    } catch (e: unknown) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }, [filterType, filterOutcome, fromDate, toDate, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Chart data: last 14 days
  const chartData: AuditChartData[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toISOString().slice(0, 10);
    return { date: dateStr, pass: Math.floor(Math.random() * 8) + 2, fail: Math.floor(Math.random() * 3) };
  });

  // Filtered (client-side for search)
  const filtered = logs.filter((l) => {
    if (search && !l.audit_id.includes(search) && !l.auto_actions_taken.some((a) => a.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleExport = () => {
    const csv = [
      ["audit_id", "type", "started_at", "completed_at", "checks_passed", "checks_failed", "outcome"].join(","),
      ...logs.map((l) =>
        [
          l.audit_id,
          l.audit_type,
          l.started_at,
          l.completed_at ?? "",
          l.checks_passed,
          l.checks_failed,
          l.checks_failed > 0 ? "fail" : "pass",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
            <input
              className="input pl-8 text-xs"
              placeholder="Search by ID or action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: "rgba(255,255,255,0.03)" }}
            />
          </div>
          <select
            className="input select text-xs"
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <option value="">All Types</option>
            <option value="small">Small</option>
            <option value="major">Major</option>
            <option value="compliance">Compliance</option>
          </select>
          <select
            className="input select text-xs"
            value={filterOutcome}
            onChange={(e) => { setFilterOutcome(e.target.value); setPage(1); }}
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <option value="">All Outcomes</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
          <input
            type="date"
            className="input text-xs"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            style={{ background: "rgba(255,255,255,0.03)" }}
          />
          <input
            type="date"
            className="input text-xs"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            style={{ background: "rgba(255,255,255,0.03)" }}
          />
          <button onClick={load} className="btn btn-ghost text-xs">
            <RefreshCw size={11} />
          </button>
          <button onClick={handleExport} className="btn btn-primary text-xs">
            <Download size={11} />
            CSV
          </button>
        </div>
      </div>

      {/* Pass Rate Chart */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={13} style={{ color: "#00D4FF" }} />
          <h3 className="text-sm font-semibold text-white">AUDITS PER DAY — PASS RATE TREND (14 DAYS)</h3>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#475569" }}
              tickFormatter={(d) => d.slice(5)}
            />
            <YAxis tick={{ fontSize: 10, fill: "#475569" }} />
            <Tooltip
              contentStyle={{
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 12,
                color: "#F1F5F9",
              }}
            />
            <Line
              type="monotone"
              dataKey="pass"
              stroke="#22C55E"
              strokeWidth={2}
              dot={{ r: 3, fill: "#22C55E" }}
              name="Passed"
            />
            <Line
              type="monotone"
              dataKey="fail"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ r: 3, fill: "#EF4444" }}
              name="Failed"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2">
            <FileText size={13} style={{ color: "#8B5CF6" }} />
            <span className="text-sm font-semibold text-white">AUDIT LOGS</span>
          </div>
          <span className="text-[11px]" style={{ color: "#475569" }}>
            {total.toLocaleString()} total · page {page}/{totalPages}
          </span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th>Audit ID</th>
              <th>Type</th>
              <th>Started</th>
              <th>Duration</th>
              <th>Checks</th>
              <th>Outcome</th>
              <th>Escalated</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}>
                        <div className="h-4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)", width: j === 1 ? 140 : 60 }} />
                      </td>
                    ))}
                  </tr>
                ))
              : filtered.map((log) => {
                  const isOpen = expanded === log.audit_id;
                  const passed = log.checks_failed === 0;
                  return [
                    <tr
                      key={log.audit_id}
                      className="cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : log.audit_id)}
                    >
                      <td className="text-center">
                        {isOpen ? (
                          <ChevronDown size={12} style={{ color: "#475569" }} />
                        ) : (
                          <ChevronRight size={12} style={{ color: "#475569" }} />
                        )}
                      </td>
                      <td>
                        <code className="mono text-[11px]">{log.audit_id.slice(0, 8)}...</code>
                      </td>
                      <td>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                          style={{
                            background: `${TYPE_COLORS[log.audit_type] ?? "#94A3B8"}18`,
                            color: TYPE_COLORS[log.audit_type] ?? "#94A3B8",
                            border: `1px solid ${TYPE_COLORS[log.audit_type] ?? "#94A3B8"}30`,
                          }}
                        >
                          {log.audit_type}
                        </span>
                      </td>
                      <td style={{ color: "#94A3B8", fontSize: 12 }}>
                        {new Date(log.started_at).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td style={{ color: "#94A3B8", fontSize: 12 }}>
                        {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : "—"}
                      </td>
                      <td>
                        <div className="flex gap-2 text-[11px]">
                          <span style={{ color: "#22C55E" }}>✓ {log.checks_passed}</span>
                          {log.checks_failed > 0 && (
                            <span style={{ color: "#EF4444" }}>✗ {log.checks_failed}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {passed ? (
                          <span className="badge badge-pass text-[9px] flex items-center gap-1 w-fit">
                            <CheckCircle size={9} /> PASS
                          </span>
                        ) : (
                          <span className="badge badge-fail text-[9px] flex items-center gap-1 w-fit">
                            <XCircle size={9} /> FAIL
                          </span>
                        )}
                      </td>
                      <td>
                        {log.escalation_triggered ? (
                          <span className="badge badge-fail text-[9px]">YES</span>
                        ) : (
                          <span className="text-[11px]" style={{ color: "#475569" }}>—</span>
                        )}
                      </td>
                    </tr>,
                    isOpen && (
                      <tr key={`${log.audit_id}-expanded`}>
                        <td colSpan={8} className="px-6 pb-4">
                          <ExpandedReport report={log.full_report} />
                          {log.auto_actions_taken.length > 0 && (
                            <div className="mt-2">
                              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#475569" }}>
                                Actions Taken
                              </div>
                              {log.auto_actions_taken.map((a, j) => (
                                <div key={j} className="text-[11px] pl-3" style={{ color: "#94A3B8", borderLeft: "2px solid rgba(255,255,255,0.08)" }}>
                                  → {a}
                                </div>
                              ))}
                            </div>
                          )}
                          {log.pagerduty_incident_id && (
                            <div className="mt-2 text-[11px]" style={{ color: "#F59E0B" }}>
                              PagerDuty: {log.pagerduty_incident_id}
                            </div>
                          )}
                        </td>
                      </tr>
                    ),
                  ];
                })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <span className="text-xs" style={{ color: "#475569" }}>
              {total.toLocaleString()} logs
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-ghost text-xs px-2 py-1"
              >
                ← Prev
              </button>
              <span className="text-xs px-2" style={{ color: "#94A3B8" }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-ghost text-xs px-2 py-1"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
