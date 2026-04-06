"use client";
import React from "react";
import clsx from "clsx";

const PLAN_FEATURES: Record<string, { label: string; basic?: boolean; professional?: boolean; elite?: boolean; enterprise?: boolean }[]> = {
  "Case Management": [
    { label: "Active cases", basic: "30", professional: "100", elite: "300", enterprise: "Unlimited" },
    { label: "Team members", basic: "3", professional: "10", elite: "30", enterprise: "Unlimited" },
    { label: "Document storage", basic: "5 GB", professional: "20 GB", elite: "100 GB", enterprise: "Unlimited" },
  ],
  "AI Features": [
    { label: "AI Document Drafting", professional: true, elite: true, enterprise: true },
    { label: "Translation (Hindi ↔ English)", elite: true, enterprise: true },
    { label: "AI-powered reminders", elite: true, enterprise: true },
  ],
  "Court Scraping": [
    { label: "Diary auto-fetch", professional: true, elite: true, enterprise: true },
    { label: "Order summarization", elite: true, enterprise: true },
    { label: "Multi-court scraping", enterprise: true },
  ],
  "Communications": [
    { label: "WhatsApp reminders", professional: true, elite: true, enterprise: true },
    { label: "SMS notifications", professional: true, elite: true, enterprise: true },
    { label: "Voice AI calls", enterprise: true },
  ],
};

const PLAN_PRICES = { basic: 0, professional: 2999, elite: 7999, enterprise: 19999 };
const PLAN_BADGE_COLORS: Record<string, string> = {
  basic: "bg-gray-500/20 text-gray-300 border-gray-500/40",
  professional: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  elite: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  enterprise: "bg-neon-amber/20 text-neon-amber border-neon-amber/40",
};

interface PlanCardProps {
  currentPlan: string;
  subscription: {
    plan: string;
    price_monthly_inr: number;
    cases_active_count: number;
    storage_gb_used: number;
    limits: { cases: number; storage_gb: number; users: number; ai_calls: number; features: string[] };
  };
  onUpgrade: (plan: string) => void;
  loading?: boolean;
}

export default function PlanCard({ currentPlan, subscription, onUpgrade, loading }: PlanCardProps) {
  const limits = subscription.limits;
  const upgradePlans = (["professional", "elite", "enterprise"] as const).filter(
    p => p !== currentPlan && PLAN_PRICES[p] > PLAN_PRICES[currentPlan as keyof typeof PLAN_PRICES]
  );

  const usageItems = [
    {
      label: "Cases",
      used: subscription.cases_active_count,
      limit: limits.cases,
      color: "cyan",
    },
    {
      label: "Storage",
      used: subscription.storage_gb_used,
      limit: limits.storage_gb,
      color: "purple",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Current plan card */}
      <div className="rounded-2xl border border-glass-border bg-glass-bg shadow-glass overflow-hidden">
        <div className="px-6 py-5 border-b border-glass-border">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-lg font-semibold text-white">
                {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
              </div>
              <div className="text-sm text-white/40 mt-0.5">
                ₹{PLAN_PRICES[currentPlan as keyof typeof PLAN_PRICES]?.toLocaleString("en-IN") || 0}
                <span className="text-white/20">/month</span>
              </div>
            </div>
            <span className={clsx(
              "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border",
              PLAN_BADGE_COLORS[currentPlan] || PLAN_BADGE_COLORS.basic
            )}>
              {currentPlan}
            </span>
          </div>
        </div>

        {/* Usage bars */}
        <div className="px-6 py-4 space-y-4">
          {usageItems.map(item => {
            const pct = item.limit === -1 ? 0 : Math.min((item.used / item.limit) * 100, 100);
            const over = item.limit !== -1 && item.used > item.limit;
            return (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white/50">{item.label}</span>
                  <span className={clsx(
                    "font-mono",
                    over ? "text-red-400" : "text-white/70"
                  )}>
                    {item.used}{item.limit !== -1 ? ` / ${item.limit}` : ""} {item.label === "Storage" ? "GB" : ""}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                  <div
                    className={clsx(
                      "h-full rounded-full transition-all duration-500",
                      over ? "bg-red-400" : item.color === "cyan" ? "bg-neon-cyan" : "bg-purple-400",
                      over && "shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    )}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Features checklist */}
        <div className="px-6 py-4 border-t border-glass-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              ["AI Document Drafting", currentPlan !== "basic"],
              ["WhatsApp Reminders", currentPlan !== "basic"],
              ["Case Diary Scraping", currentPlan !== "basic"],
              ["Translation", currentPlan === "elite" || currentPlan === "enterprise"],
              ["Voice AI Calls", currentPlan === "enterprise"],
              ["API Access", currentPlan === "enterprise"],
            ].map(([feat, enabled]) => (
              <div key={feat} className="flex items-center gap-2 text-xs">
                {enabled ? (
                  <svg className="w-3.5 h-3.5 text-neon-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-white/15 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className={enabled ? "text-white/70" : "text-white/20"}>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade CTA */}
        {upgradePlans.length > 0 && (
          <div className="px-6 py-4 border-t border-glass-border bg-white/[0.02]">
            <div className="flex gap-2">
              {upgradePlans.map(plan => (
                <button
                  key={plan}
                  onClick={() => onUpgrade(plan)}
                  disabled={loading}
                  className={clsx(
                    "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                    plan === upgradePlans[0]
                      ? "bg-brand-gradient text-white border-transparent shadow-neon-cyan hover:opacity-90"
                      : "bg-white/[0.04] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.07]"
                  )}
                >
                  Upgrade to {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  <div className="text-[10px] mt-0.5 opacity-70">
                    ₹{PLAN_PRICES[plan].toLocaleString("en-IN")}/mo
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
