"use client";
import React, { useEffect, useState, useCallback } from "react";
import AdminShell from "@/components/AdminShell";
import PlanCard from "@/components/PlanCard";
import BillingForm from "@/components/BillingForm";
import InvoiceTable from "@/components/InvoiceTable";
import { billingApi, Invoice } from "@/lib/api";
import { CreditCard } from "lucide-react";

function Toast({ message, type, onDone }: { message: string; type: "success" | "error"; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-glass text-sm font-medium ${
      type === "success" ? "bg-neon-green/10 border-neon-green/40 text-neon-green" : "bg-red-500/10 border-red-500/40 text-red-400"
    }`}>
      {message}
    </div>
  );
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const firmName = typeof window !== "undefined" ? localStorage.getItem("firm_name") || "Your Law Firm" : "Your Law Firm";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sub, invData] = await Promise.all([
        billingApi.getSubscription(),
        billingApi.listInvoices().catch(() => ({ invoices: [] })),
      ]);
      setSubscription(sub);
      setInvoices(invData.invoices);
    } catch {
      setSubscription({
        plan: "professional",
        price_monthly_inr: 2999,
        cases_active_count: 47,
        storage_gb_used: 3.2,
        limits: { cases: 100, storage_gb: 20, users: 10, ai_calls: 5000, features: ["ai_drafting", "whatsapp", "sms"] },
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      });
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminShell firmName={firmName} plan={subscription?.plan}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
            <p className="text-sm text-white/40">Manage your plan, usage, and invoices</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-glass-border bg-glass-bg h-64 animate-pulse" />
            <div className="rounded-2xl border border-glass-border bg-glass-bg h-64 animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan card */}
            <PlanCard
              currentPlan={subscription?.plan || "basic"}
              subscription={subscription}
              onUpgrade={() => setShowUpgrade(true)}
            />

            {/* Current period + payment method */}
            <div className="space-y-6">
              {/* Payment method */}
              <div className="rounded-2xl border border-glass-border bg-glass-bg shadow-glass p-5">
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Payment Method</h3>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <svg className="w-8 h-8 text-white/40" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M6 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white/70">Visa •••• 4242</div>
                    <div className="text-xs text-white/30">Expires 12/26</div>
                  </div>
                  <button className="text-xs text-neon-cyan hover:underline">Update</button>
                </div>
                <button className="mt-3 w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white/50 hover:text-white hover:bg-white/[0.07] transition-all">
                  + Add Payment Method
                </button>
              </div>

              {/* Billing cycle */}
              <div className="rounded-2xl border border-glass-border bg-glass-bg shadow-glass p-5">
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Billing Cycle</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Billing Period</span>
                    <span className="text-white font-medium">Monthly</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Next Renewal</span>
                    <span className="text-white font-medium">
                      {subscription?.current_period_end
                        ? new Date(subscription.current_period_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Amount Due</span>
                    <span className="text-neon-cyan font-bold font-mono">
                      ₹{(subscription?.price_monthly_inr || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoice history */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Invoice History</h2>
          <InvoiceTable
            invoices={invoices}
            onRefresh={load}
            onError={msg => setToast({ msg, type: "error" })}
            onSuccess={msg => setToast({ msg, type: "success" })}
          />
        </div>

        {showUpgrade && (
          <BillingForm
            onClose={() => setShowUpgrade(false)}
            onSuccess={msg => { setToast({ msg, type: "success" }); setShowUpgrade(false); }}
            onError={msg => setToast({ msg, type: "error" })}
          />
        )}

        {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      </div>
    </AdminShell>
  );
}
