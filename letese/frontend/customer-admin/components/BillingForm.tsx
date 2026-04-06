"use client";
import React from "react";
import clsx from "clsx";
import { Loader2, Check } from "lucide-react";

const PLAN_PRICES = { basic: 0, professional: 2999, elite: 7999, enterprise: 19999 };

const PLAN_COMPARISON = [
  {
    name: "Professional",
    price: 2999,
    badge: "bg-blue-500/20 border-blue-500/40 text-blue-300",
    desc: "For growing law firms",
    features: [
      "100 active cases",
      "10 team members",
      "20 GB document storage",
      "AI document drafting",
      "WhatsApp + SMS reminders",
      "Case diary auto-fetch",
      "Standard support",
    ],
    highlight: false,
  },
  {
    name: "Elite",
    price: 7999,
    badge: "bg-purple-500/20 border-purple-500/40 text-purple-300",
    desc: "For established practices",
    features: [
      "300 active cases",
      "30 team members",
      "100 GB document storage",
      "Everything in Professional",
      "Hindi ↔ English translation",
      "AI order summarization",
      "Priority support",
      "Audit logging",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: 19999,
    badge: "bg-amber-500/20 border-amber-500/40 text-amber-300",
    desc: "For large firms & chambers",
    features: [
      "Unlimited cases",
      "Unlimited team members",
      "Unlimited storage",
      "Everything in Elite",
      "Multi-court scraping",
      "Voice AI calls",
      "API + Webhooks access",
      "Dedicated account manager",
    ],
    highlight: false,
  },
];

interface BillingFormProps {
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function BillingForm({ onClose, onSuccess, onError }: BillingFormProps) {
  const [selectedPlan, setSelectedPlan] = React.useState<string>("professional");
  const [loading, setLoading] = React.useState(false);

  const selected = PLAN_COMPARISON.find(p => p.name.toLowerCase() === selectedPlan)!;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.letese.xyz"}/api/v1/admin/subscription/upgrade`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("letese_token")}`,
          },
          body: JSON.stringify({ plan: selectedPlan.toLowerCase() }),
        }
      );
      if (!response.ok) throw new Error("Upgrade failed");
      const data = await response.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        onSuccess("Plan upgraded successfully!");
        onClose();
      }
    } catch {
      onError("Failed to initiate upgrade. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-[#0d1224] border border-glass-border rounded-2xl shadow-glass overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-glass-border flex items-center shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-white">Upgrade Your Plan</h3>
            <p className="text-sm text-white/40 mt-0.5">Secure payment via Razorpay</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.07] transition-all"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {PLAN_COMPARISON.map(plan => (
              <button
                key={plan.name}
                onClick={() => setSelectedPlan(plan.name.toLowerCase())}
                className={clsx(
                  "p-4 rounded-xl border text-left transition-all",
                  selectedPlan === plan.name.toLowerCase()
                    ? plan.highlight
                      ? "border-purple-400 bg-purple-500/10 shadow-neon-purple"
                      : "border-blue-400 bg-blue-500/10 shadow-neon-cyan"
                    : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15]"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border", plan.badge)}>
                    {plan.name}
                  </span>
                  {selectedPlan === plan.name.toLowerCase() && (
                    <div className="w-5 h-5 rounded-full bg-neon-cyan flex items-center justify-center">
                      <Check className="w-3 h-3 text-black" />
                    </div>
                  )}
                </div>
                <div className="text-lg font-bold text-white">
                  ₹{plan.price.toLocaleString("en-IN")}
                  <span className="text-xs font-normal text-white/40">/mo</span>
                </div>
                <div className="text-[10px] text-white/40 mt-1">{plan.desc}</div>
              </button>
            ))}
          </div>

          {/* Selected plan features */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-white">{selected.name} Plan Features</div>
                <div className="text-xs text-white/40 mt-0.5">
                  ₹{selected.price.toLocaleString("en-IN")}/month billed monthly
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">₹{selected.price.toLocaleString("en-IN")}</div>
                <div className="text-[10px] text-white/40">per month</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {selected.features.map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-white/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-glass-border flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Secured by Razorpay · 256-bit encryption
          </div>
          <div className="ml-auto flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 hover:bg-white/[0.07] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-brand-gradient text-white text-sm font-medium shadow-neon-cyan hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              Pay ₹{selected.price.toLocaleString("en-IN")} with Razorpay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
