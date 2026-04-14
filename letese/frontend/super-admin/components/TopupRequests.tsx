"use client";
import React, { useEffect, useState, useCallback } from "react";
import { walletAdminApi, AdminTopupRequest } from "@/lib/api";
import { CheckCircle, XCircle, Clock, RefreshCw, ChevronDown, DollarSign } from "lucide-react";
import clsx from "clsx";

function formatINR(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_META = {
  pending:  { icon: Clock,      color: "text-neon-amber",  bg: "bg-neon-amber/10",  border: "border-neon-amber/30" },
  approved: { icon: CheckCircle, color: "text-neon-green", bg: "bg-neon-green/10", border: "border-neon-green/30" },
  rejected: { icon: XCircle,    color: "text-red-400",   bg: "bg-red-500/10",   border: "border-red-500/30" },
  cancelled:{ icon: XCircle,     color: "text-white/40",  bg: "bg-white/5",       border: "border-white/10" },
};

const METHOD_LABELS: Record<string, string> = {
  cash: "💵 Cash",
  upi: "📱 UPI",
  bank_transfer: "🏦 Bank Transfer",
  cheque: "📝 Cheque",
  other: "🔖 Other",
};

export default function TopupRequests() {
  const [items, setItems] = useState<AdminTopupRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [processing, setProcessing] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ id: string; action: "approve" | "reject"; notes: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await walletAdminApi.listTopups(statusFilter === "all" ? undefined : statusFilter);
      setItems(data.items);
      setPendingCount(data.pending_count);
    } catch {
      showToast("Failed to load topup requests", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (requestId: string, action: "approve" | "reject", notes?: string) => {
    setProcessing(requestId + action);
    try {
      if (action === "approve") {
        await walletAdminApi.approveTopup(requestId, notes);
        showToast(`Top-up approved! ₹${items.find(i => i.request_id === requestId)?.amount_inr} credited to wallet.`, "success");
      } else {
        await walletAdminApi.rejectTopup(requestId, notes);
        showToast("Top-up request rejected.", "success");
      }
      setNoteModal(null);
      load();
    } catch {
      showToast(`Failed to ${action} top-up request.`, "error");
    } finally {
      setProcessing(null);
    }
  };

  const totalPending = items.filter(i => i.status === "pending").reduce((s, i) => s + parseFloat(i.amount_inr), 0);

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={clsx(
          "fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl border shadow-glass text-sm font-medium",
          toast.type === "success" ? "bg-neon-green/10 border-neon-green/40 text-neon-green"
                                   : "bg-red-500/10 border-red-500/40 text-red-400"
        )}>
          {toast.msg}
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neon-amber/20 bg-neon-amber/5 p-4 text-center">
          <div className="text-2xl font-bold text-neon-amber font-mono">{pendingCount}</div>
          <div className="text-xs text-neon-amber/60 mt-1">Pending Requests</div>
        </div>
        <div className="rounded-2xl border border-glass-border bg-glass-bg p-4 text-center">
          <div className="text-2xl font-bold text-white font-mono">{formatINR(totalPending)}</div>
          <div className="text-xs text-white/40 mt-1">Pending Amount</div>
        </div>
        <div className="rounded-2xl border border-glass-border bg-glass-bg p-4 text-center">
          <div className="text-2xl font-bold text-white font-mono">{items.length}</div>
          <div className="text-xs text-white/40 mt-1">Showing</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 px-1 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          {["pending","approved","rejected","all"].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                statusFilter === f
                  ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30"
                  : "text-white/40 hover:text-white")}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/50 hover:text-white transition-all ml-auto">
          <RefreshCw className={clsx("w-3 h-3", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-glass-border bg-glass-bg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {["Tenant / Firm","Amount","Method","Reference","Remarks","Requested","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-white/30 font-medium uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    {[...Array(8)].map((_,j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-white/[0.04] animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="text-white/30 text-sm">No top-up requests found</div>
                    {statusFilter !== "all" && (
                      <button onClick={() => setStatusFilter("all")}
                        className="mt-2 text-xs text-neon-cyan hover:underline">
                        Show all requests
                      </button>
                    )}
                  </td>
                </tr>
              ) : items.map(req => {
                const meta = STATUS_META[req.status];
                const Icon = meta.icon;
                return (
                  <tr key={req.request_id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white/80">{req.requested_by_name || "—"}</div>
                      <div className="text-[10px] text-white/30 font-mono">{req.tenant_id.slice(0,8)}...</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-white font-mono">{formatINR(parseFloat(req.amount_inr))}</span>
                    </td>
                    <td className="px-4 py-3 text-white/60">{METHOD_LABELS[req.payment_method] || req.payment_method}</td>
                    <td className="px-4 py-3 text-white/40 font-mono text-[10px] max-w-[120px] truncate">
                      {req.transaction_ref || "—"}
                    </td>
                    <td className="px-4 py-3 text-white/40 text-[10px] max-w-[150px] truncate">
                      {req.remarks || "—"}
                    </td>
                    <td className="px-4 py-3 text-white/40">{timeAgo(req.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize",
                        meta.color, meta.bg, meta.border)}>
                        <Icon className="w-3 h-3" />
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {req.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setNoteModal({ id: req.request_id, action: "approve", notes: "" })}
                            disabled={!!processing}
                            className="px-2.5 py-1 rounded-lg bg-neon-green/15 border border-neon-green/30 text-neon-green text-[10px] font-semibold hover:bg-neon-green/25 disabled:opacity-40 flex items-center gap-1">
                            {processing === req.request_id + "approve"
                              ? <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                              : <CheckCircle className="w-2.5 h-2.5" />}
                            Approve
                          </button>
                          <button
                            onClick={() => setNoteModal({ id: req.request_id, action: "reject", notes: "" })}
                            disabled={!!processing}
                            className="px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-semibold hover:bg-red-500/25 disabled:opacity-40 flex items-center gap-1">
                            {processing === req.request_id + "reject"
                              ? <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                              : <XCircle className="w-2.5 h-2.5" />}
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-white/20">
                          {req.admin_notes ? `Note: ${req.admin_notes}` : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setNoteModal(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-glass-border bg-[#0d0f1a] shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {noteModal.action === "approve" ? "Approve" : "Reject"} Top-Up Request
            </h3>
            <p className="text-xs text-white/40">
              {noteModal.action === "approve"
                ? "This will credit the amount to the client's wallet."
                : "The client will be notified of rejection."}
            </p>
            <textarea
              value={noteModal.notes}
              onChange={e => setNoteModal({ ...noteModal, notes: e.target.value })}
              placeholder="Admin notes (optional)..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white text-xs placeholder-white/20 focus:outline-none focus:border-neon-cyan/50 resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setNoteModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.10] text-white/50 text-sm hover:bg-white/[0.05] transition-all">
                Cancel
              </button>
              <button
                onClick={() => handleAction(noteModal.id, noteModal.action, noteModal.notes || undefined)}
                className={clsx("flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  noteModal.action === "approve"
                    ? "bg-neon-green/20 border border-neon-green/40 text-neon-green hover:bg-neon-green/30"
                    : "bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30"
                )}>
                Confirm {noteModal.action === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
