"use client";
import React, { useEffect, useState } from "next";
import AdminShell from "@/components/AdminShell";
import { StatCard } from "@/components/UsageChart";
import { billingApi, analyticsApi } from "@/lib/api";
import { Scale, Users, FileText, Zap, AlertTriangle } from "lucide-react";

interface DashboardStats {
  cases_active_count: number;
  plan: string;
  storage_gb_used: number;
  limits: { cases: number; users: number; storage_gb: number; features: string[] };
  users_total?: number;
  invoices_pending?: number;
  ai_cost?: number;
  whatsapp_sent?: number;
}

const QUICK_ACTIONS = [
  { label: "Add Team Member", href: "/admin/team", icon: "👥", desc: "Invite advocates or clerks" },
  { label: "View Billing", href: "/admin/billing", icon: "💳", desc: "Manage subscription" },
  { label: "Usage Analytics", href: "/admin/analytics", icon: "📊", desc: "AI calls & costs" },
  { label: "Firm Settings", href: "/admin/settings", icon: "⚙️", desc: "Profile & notifications" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const firmName = typeof window !== "undefined" ? localStorage.getItem("firm_name") || "Your Law Firm" : "Your Law Firm";

  useEffect(() => {
    const load = async () => {
      try {
        const sub = await billingApi.getSubscription();
        const now = new Date();
        const currentPlan = sub.plan;

        // Fetch analytics for AI cost
        let aiCost = 0;
        let whatsappSent = 0;
        try {
          const analytics = await analyticsApi.getUsage("30d");
          aiCost = analytics.ai_calls.cost_inr;
          whatsappSent = Object.values(analytics.communications)
            .reduce((sum: number, c: Record<string, number>) => sum + Object.values(c).reduce((a: number, b: number) => a + b, 0), 0);
        } catch { /* optional */ }

        setStats({
          cases_active_count: sub.cases_active_count,
          plan: currentPlan,
          storage_gb_used: sub.storage_gb_used,
          limits: sub.limits,
          ai_cost: aiCost,
          whatsapp_sent: whatsappSent,
        });
      } catch (err) {
        // Show placeholder data in dev
        setStats({
          cases_active_count: 47,
          plan: "professional",
          storage_gb_used: 3.2,
          limits: { cases: 100, users: 10, storage_gb: 20, features: ["ai_drafting", "whatsapp"] },
          ai_cost: 234,
          whatsapp_sent: 892,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isOverLimit = stats && stats.cases_active_count > stats.limits.cases;

  return (
    <AdminShell firmName={firmName} plan={stats?.plan || "professional"}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">
            Welcome back — here's your firm overview
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-glass-border bg-glass-bg h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Alert if over case limit */}
            {isOverLimit && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-red-300">Case limit exceeded</div>
                  <div className="text-xs text-red-400/70 mt-0.5">
                    You've used {stats!.cases_active_count}/{stats!.limits.cases} cases.
                    Upgrade to Elite for 300 cases.
                  </div>
                </div>
                <a
                  href="/admin/billing"
                  className="ml-auto px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-xs text-red-300 hover:bg-red-500/30 transition-colors whitespace-nowrap"
                >
                  Upgrade Plan
                </a>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Active Cases"
                value={stats?.cases_active_count ?? 0}
                sub={`of ${stats?.limits.cases ?? "∞"}`}
                trend={isOverLimit ? "down" : undefined}
                icon={<FileText className="w-4 h-4 text-neon-cyan" />}
                accentColor="#00D4FF"
              />
              <StatCard
                label="Storage Used"
                value={`${stats?.storage_gb_used?.toFixed(1) ?? 0} GB`}
                sub={`of ${stats?.limits.storage_gb ?? "∞"} GB`}
                icon={<Scale className="w-4 h-4 text-purple-400" />}
                accentColor="#8B5CF6"
              />
              <StatCard
                label="AI Cost (30d)"
                value={`₹${stats?.ai_cost?.toFixed(0) ?? 0}`}
                icon={<Zap className="w-4 h-4 text-neon-green" />}
                accentColor="#00FF88"
              />
              <StatCard
                label="WhatsApp Sent (30d)"
                value={stats?.whatsapp_sent ?? 0}
                icon={<Users className="w-4 h-4 text-neon-amber" />}
                accentColor="#F59E0B"
              />
            </div>

            {/* Plan overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Plan badge + features */}
              <div className="rounded-2xl border border-glass-border bg-glass-bg shadow-glass p-6">
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Current Plan</h3>
                <div className="flex items-center gap-3 mb-4">
                  <span className={[
                    "px-3 py-1 rounded-full text-xs font-bold uppercase border",
                    stats?.plan === "enterprise" ? "bg-amber-500/20 border-amber-500/40 text-amber-300" :
                    stats?.plan === "elite" ? "bg-purple-500/20 border-purple-500/40 text-purple-300" :
                    stats?.plan === "professional" ? "bg-blue-500/20 border-blue-500/40 text-blue-300" :
                    "bg-gray-500/20 border-gray-500/40 text-gray-300",
                  ].join(" ")}>
                    {stats?.plan || "basic"}
                  </span>
                </div>
                <div className="space-y-2">
                  {stats?.limits.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-white/60">
                      <svg className="w-3.5 h-3.5 text-neon-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f.replace(/_/g, " ")}
                    </div>
                  ))}
                </div>
                <a
                  href="/admin/billing"
                  className="mt-4 block w-full px-4 py-2.5 rounded-lg bg-brand-gradient text-white text-sm font-medium text-center shadow-neon-cyan hover:opacity-90 transition-opacity"
                >
                  Manage Subscription
                </a>
              </div>

              {/* Quick actions */}
              <div className="lg:col-span-2 rounded-2xl border border-glass-border bg-glass-bg shadow-glass p-6">
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {QUICK_ACTIONS.map(action => (
                    <a
                      key={action.href}
                      href={action.href}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all group"
                    >
                      <div className="text-2xl">{action.icon}</div>
                      <div>
                        <div className="text-sm font-medium text-white group-hover:text-neon-cyan transition-colors">
                          {action.label}
                        </div>
                        <div className="text-xs text-white/30">{action.desc}</div>
                      </div>
                      <svg className="ml-auto w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
