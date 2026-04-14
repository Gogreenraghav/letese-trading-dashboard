"use client";
import React, { useEffect, useState, useCallback } from "react";
import { walletApi, Wallet, TopupRequest, WalletTransaction } from "@/lib/api";
import { Wallet as WalletIcon, TrendingUp, TrendingDown, Plus, RefreshCw, ChevronDown, Clock } from "lucide-react";
import clsx from "clsx";

const PAYMENT_METHODS = [
  { value: "cash", label: "💵 Cash" },
  { value: "upi", label: "📱 UPI" },
  { value: "bank_transfer", label: "🏦 Bank Transfer" },
  { value: "cheque", label: "📝 Cheque" },
  { value: "other", label: "🔖 Other" },
];

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
  pending:  { label: "Pending",  color: "text-neon-amber bg-neon-amber/10 border-neon-amber/30" },
  approved: { label: "Approved", color: "text-neon-green bg-neon-green/10 border-neon-green/30" },
  rejected: { label: "Rejected", color: "text-red-400 bg-red-500/10 border-red-500/30" },
  cancelled:{ label: "Cancelled", color: "text-white/40 bg-white/5 border-white/10" },
};

export default function WalletSection() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [myRequests, setMyRequests] = useState<TopupRequest[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [tab, setTab] = useState<"overview" | "requests" | "history">("overview");

  // Form state
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [ref, setRef] = useState("");
  const [remarks, setRemarks] = useState("");

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, txn, reqs] = await Promise.all([
        walletApi.getWallet().catch(() => null),
        walletApi.getTransactions().catch(() => []),
        walletApi.getMyTopups().catch(() => []),
      ]);
      setWallet(w);
      setTransactions(txn);
      setMyRequests(reqs);
    } catch {
      showToast("Failed to load wallet data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { showToast("Enter a valid amount", "error"); return; }

    setSubmitting(true);
    try {
      await walletApi.requestTopup({
        amount_inr: amt,
        payment_method: method,
        transaction_ref: ref || undefined,
        remarks: remarks || undefined,
      });
      showToast(`Top-up request for ${formatINR(amt)} submitted!`, "success");
      setShowRequestModal(false);
      setAmount(""); setRef(""); setRemarks("");
      load();
    } catch {
      showToast("Failed to submit request. Try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const balance = wallet ? parseFloat(wallet.balance_inr) : 0;
  const totalLoaded = wallet ? parseFloat(wallet.total_loaded_inr) : 0;
  const recent = transactions.slice(0, 5);

  return (
    <div className="space-y-5">
      {/* ── Toast ── */}
      {toast && (
        <div className={clsx(
          "fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl border shadow-glass text-sm font-medium animate-fade-in",
          toast.type === "success"
            ? "bg-neon-green/10 border-neon-green/40 text-neon-green"
            : "bg-red-500/10 border-red-500/40 text-red-400"
        )}>
          {toast.msg}
        </div>
      )}

      {/* ── Header + Balance Card ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-neon-amber/15 border border-neon-amber/30 flex items-center justify-center shrink-0">
            <WalletIcon className="w-5 h-5 text-neon-amber" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Wallet Balance</h2>
            <p className="text-xs text-white/40">Offline payments — approved by admin</p>
          </div>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-amber/15 border border-neon-amber/40 text-neon-amber text-sm font-semibold hover:bg-neon-amber/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          Request Top-Up
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-glass-border bg-glass-bg p-5">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Available Balance</div>
          <div className="text-3xl font-bold text-neon-amber font-mono">
            {loading ? "..." : formatINR(balance)}
          </div>
        </div>
        <div className="rounded-2xl border border-glass-border bg-glass-bg p-5">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Total Loaded</div>
          <div className="text-3xl font-bold text-white/60 font-mono">
            {loading ? "..." : formatINR(totalLoaded)}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 px-1 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] w-fit">
        {([["overview","Overview"],["requests","My Requests"],["history","Transaction History"]] as const).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={clsx("px-4 py-2 rounded-lg text-xs font-medium transition-all",
              tab === k ? "bg-neon-amber/20 text-neon-amber border border-neon-amber/30"
                        : "text-white/40 hover:text-white")}>
            {l}
            {k === "requests" && myRequests.filter(r => r.status === "pending").length > 0 && (
              <span className="ml-1.5 bg-neon-amber text-black text-[10px] font-bold rounded-full px-1.5 py-0.5">
                {myRequests.filter(r => r.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: Overview ── */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-glass-border bg-glass-bg p-5">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Recent Activity</h3>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_,i) => (
                <div key={i} className="h-10 rounded-lg bg-white/[0.04] animate-pulse" />
              ))}</div>
            ) : recent.length === 0 ? (
              <div className="text-center py-8 text-white/30 text-sm">No transactions yet</div>
            ) : (
              <div className="space-y-2">
                {recent.map(txn => (
                  <div key={txn.transaction_id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03]">
                    <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      txn.type === "credit" ? "bg-neon-green/15" : "bg-red-500/15")}>
                      {txn.type === "credit"
                        ? <TrendingUp className="w-4 h-4 text-neon-green" />
                        : <TrendingDown className="w-4 h-4 text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/70 truncate">{txn.description || txn.source}</div>
                      <div className="text-[10px] text-white/30">{timeAgo(txn.created_at)}</div>
                    </div>
                    <div className={clsx("text-sm font-mono font-semibold shrink-0",
                      txn.type === "credit" ? "text-neon-green" : "text-red-400")}>
                      {txn.type === "credit" ? "+" : "-"}{formatINR(parseFloat(txn.amount_inr))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: My Requests ── */}
      {tab === "requests" && (
        <div className="rounded-2xl border border-glass-border bg-glass-bg p-5">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">My Top-Up Requests</h3>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_,i) => (
              <div key={i} className="h-14 rounded-lg bg-white/[0.04] animate-pulse" />
            ))}</div>
          ) : myRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/30 text-sm mb-3">No requests yet</p>
              <button onClick={() => setShowRequestModal(true)}
                className="text-xs text-neon-amber hover:underline">
                + Submit your first top-up request
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {myRequests.map(req => {
                const meta = STATUS_META[req.status];
                return (
                  <div key={req.request_id} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-white font-mono">{formatINR(parseFloat(req.amount_inr))}</span>
                        <span className={clsx("text-[10px] px-2 py-0.5 rounded-full border font-medium", meta.color)}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/30">
                        {PAYMENT_METHODS.find(m => m.value === req.payment_method)?.label} • {timeAgo(req.created_at)}
                        {req.admin_notes && <span className="ml-2 text-white/50">Note: {req.admin_notes}</span>}
                      </div>
                    </div>
                    <div className="text-[10px] text-white/40 shrink-0">{req.transaction_ref || ""}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Transaction History ── */}
      {tab === "history" && (
        <div className="rounded-2xl border border-glass-border bg-glass-bg p-5">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">All Transactions</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">No transactions yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-white/30 border-b border-white/[0.06]">
                    <th className="text-left pb-2 font-medium">Date</th>
                    <th className="text-left pb-2 font-medium">Type</th>
                    <th className="text-left pb-2 font-medium">Source</th>
                    <th className="text-left pb-2 font-medium">Description</th>
                    <th className="text-right pb-2 font-medium">Amount</th>
                    <th className="text-right pb-2 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  {transactions.map(txn => (
                    <tr key={txn.transaction_id} className="border-b border-white/[0.03]">
                      <td className="py-2 text-white/50 font-mono">{new Date(txn.created_at).toLocaleDateString("en-IN")}</td>
                      <td className="py-2">
                        <span className={clsx("px-1.5 py-0.5 rounded text-[10px] font-medium",
                          txn.type === "credit" ? "text-neon-green bg-neon-green/10" : "text-red-400 bg-red-500/10")}>
                          {txn.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 text-white/50">{txn.source}</td>
                      <td className="py-2 text-white/70 max-w-[200px] truncate">{txn.description || "—"}</td>
                      <td className={clsx("py-2 text-right font-mono font-semibold",
                        txn.type === "credit" ? "text-neon-green" : "text-red-400")}>
                        {txn.type === "credit" ? "+" : "-"}{formatINR(parseFloat(txn.amount_inr))}
                      </td>
                      <td className="py-2 text-right text-white/40 font-mono">{formatINR(parseFloat(txn.balance_after_inr))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── REQUEST MODAL ── */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowRequestModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-glass-border bg-[#0d0f1a] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WalletIcon className="w-5 h-5 text-neon-amber" />
                <h3 className="text-lg font-bold text-white">Request Wallet Top-Up</h3>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-white/40 -mt-2">
              Pay offline (cash, UPI, bank transfer, cheque) and submit a top-up request.
              Admin will verify and add the amount to your wallet.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Amount (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">₹</span>
                  <input
                    type="number" min="1" step="1" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full pl-7 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white text-sm placeholder-white/20 focus:outline-none focus:border-neon-amber/50 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Payment Method *</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.value} type="button"
                      onClick={() => setMethod(m.value)}
                      className={clsx("px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left",
                        method === m.value
                          ? "border-neon-amber/50 bg-neon-amber/10 text-neon-amber"
                          : "border-white/[0.08] bg-white/[0.03] text-white/50 hover:text-white/70"
                      )}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction Reference */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Transaction Reference (optional)</label>
                <input type="text" value={ref} onChange={e => setRef(e.target.value)}
                  placeholder="UPI ID, cheque no., transfer reference..."
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white text-xs placeholder-white/20 focus:outline-none focus:border-neon-amber/50 transition-colors"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Remarks (optional)</label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
                  placeholder="Any additional details..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white text-xs placeholder-white/20 focus:outline-none focus:border-neon-amber/50 transition-colors resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowRequestModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.10] text-white/50 text-sm hover:bg-white/[0.05] transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-neon-amber/20 border border-neon-amber/40 text-neon-amber text-sm font-semibold hover:bg-neon-amber/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {submitting ? <><RefreshCw className="w-3 h-3 animate-spin" /> Submitting...</> : <>Submit Request</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
