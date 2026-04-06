"use client";
import React, { useEffect, useState, useCallback } from "react";
import AdminShell from "@/components/AdminShell";
import { AIUsageChart, WhatsAppChart, StoragePieChart, CostLineChart, StatCard } from "@/components/UsageChart";
import { analyticsApi, AnalyticsData } from "@/lib/api";
import { BarChart3, Zap, MessageSquare, HardDrive, Globe } from "lucide-react";
import clsx from "clsx";

const TIME_FILTERS = [
  { label: "Today", value: "1d" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "Custom", value: "custom" },
];

function generateMockData(period: string) {
  const days = period === "1d" ? 1 : period === "7d" ? 7 : 30;
  return Array.from({ length: days }, (_, i) => ({
    tokens_input: Math.floor(Math.random() * 8000 + 1000),
    tokens_output: Math.floor(Math.random() * 5000 + 500),
    cost_inr: parseFloat((Math.random() * 20 + 2).toFixed(2)),
    sent: Math.floor(Math.random() * 50 + 10),
    delivered: Math.floor(Math.random() * 45 + 8),
    read: Math.floor(Math.random() * 30 + 5),
    failed: Math.floor(Math.random() * 5),
  }));
}

function generateStorageData() {
  return [
    { type: "Pleadings", gb: 1.2 },
    { type: "Orders", gb: 0.8 },
    { type: "Drafts", gb: 0.5 },
    { type: "Translations", gb: 0.3 },
    { type: "Other", gb: 0.4 },
  ];
}

function generateScraperData() {
  return [
    { court: "PHHC", scrapes: 142, failures: 3 },
    { court: "DHC", scrapes: 89, failures: 7 },
    { court: "SC", scrapes: 34, failures: 2 },
    { court: "NCDRC", scrapes: 21, failures: 4 },
    { court: "District", scrapes: 67, failures: 9 },
  ];
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const firmName = typeof window !== "undefined" ? localStorage.getItem("firm_name") || "Your Law Firm" : "Your Law Firm";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const analytics = await analyticsApi.getUsage(period);
      setData(analytics);
    } catch {
      setData({
        period,
        ai_calls: {
          total_requests: 1847,
          tokens_input: 124000,
          tokens_output: 89000,
          cost_inr: 847.50,
        },
        communications: {
          whatsapp: {
            sent: 892,
            delivered: 847,
            read: 623,
            failed: 12,
          },
        },
        storage_gb: 3.2,
        scraper_activity: {
          "PHHC": 142, "DHC": 89, "SC": 34, "NCDRC": 21, "District": 67,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const mockChartData = generateMockData(period);
  const storageData = generateStorageData();
  const scraperData = generateScraperData();

  const totalStorageGB = storageData.reduce((s, d) => s + d.gb, 0);
  const whatsappTotals = data?.communications?.whatsapp || mockChartData.reduce(
    (acc, d) => ({
      sent: acc.sent + (d as any).sent,
      delivered: acc.delivered + (d as any).delivered,
      read: acc.read + (d as any).read,
      failed: acc.failed + (d as any).failed,
    }),
    { sent: 0, delivered: 0, read: 0, failed: 0 }
  );
  const deliveryRate = whatsappTotals.sent > 0
    ? Math.round((whatsappTotals.delivered / whatsappTotals.sent) * 100)
    : 0;

  const handleExportCSV = () => {
    const headers = ["Metric", "Value"];
    const rows = [
      ["AI Requests", data?.ai_calls?.total_requests ?? "—"],
      ["Tokens Input", data?.ai_calls?.tokens_input?.toLocaleString() ?? "—"],
      ["Tokens Output", data?.ai_calls?.tokens_output?.toLocaleString() ?? "—"],
      ["AI Cost (₹)", data?.ai_calls?.cost_inr?.toFixed(2) ?? "—"],
      ["WhatsApp Sent", whatsappTotals.sent],
      ["WhatsApp Delivered", whatsappTotals.delivered],
      ["WhatsApp Read", whatsappTotals.read],
      ["WhatsApp Failed", whatsappTotals.failed],
      ["Storage Used (GB)", totalStorageGB.toFixed(2)],
    ];
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `letese-analytics-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell firmName={firmName}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon-green/20 border border-neon-green/40 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-neon-green" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Usage Analytics</h1>
              <p className="text-sm text-white/40">AI calls, messages, storage, and scraper activity</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Time filters */}
            <div className="flex items-center gap-1 px-1 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              {TIME_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setPeriod(f.value)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    period === f.value
                      ? "bg-brand text-white shadow-neon-cyan"
                      : "text-white/40 hover:text-white"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:text-white hover:bg-white/[0.07] transition-all"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-glass-border bg-glass-bg h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="AI Requests"
              value={data?.ai_calls?.total_requests?.toLocaleString() ?? "—"}
              icon={<Zap className="w-4 h-4 text-neon-cyan" />}
              accentColor="#00D4FF"
            />
            <StatCard
              label="AI Cost (₹)"
              value={`₹${data?.ai_calls?.cost_inr?.toFixed(0) ?? "—"}`}
              icon={<Zap className="w-4 h-4 text-purple-400" />}
              accentColor="#8B5CF6"
            />
            <StatCard
              label="WhatsApp Delivery Rate"
              value={`${deliveryRate}%`}
              icon={<MessageSquare className="w-4 h-4 text-neon-green" />}
              accentColor="#00FF88"
            />
            <StatCard
              label="Storage Used"
              value={`${totalStorageGB.toFixed(1)} GB`}
              icon={<HardDrive className="w-4 h-4 text-neon-amber" />}
              accentColor="#F59E0B"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Tokens chart */}
          <div className="rounded-2xl border border-glass-border bg-glass-bg shadow-glass p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-neon-cyan" />
                AI Tokens (30 days)
              </h3>
            </div>
            <AIUsageChart data={mockChartData} />
            <div className="mt-3 flex items-center gap-4 text-xs text-white/30">
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-neon-cyan" /> Input
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-purple-400" /> Output
              </span>
              <span className="ml-auto font-mono text-neon-green">
                ₹{(data?.ai_calls?.cost_inr ?? 0).toFixed(0)} cost
              </span>
            </div>
          </div>

          {/* WhatsApp chart */}
          <div className="rounded-2xl border border-glass-border bg-glass-bg shadow-glass p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-neon-green" />
                WhatsApp Messages
              </h3>
              <span className="text-xs font-mono text-neon-green bg-neon-green/10 px-2 py-1 rounded-full border border-neon-green/30">
                {deliveryRate}% delivery
              </span>
            </div>
            <WhatsAppChart data={mockChartData} />
            <div className="mt-3 flex gap-4 text-xs text-white/30">
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-neon-cyan" /> Sent</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-purple-400" /> Delivered</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-neon-green" /> Read</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-neon-pink" /> Failed</span>
            </div>
          </div>

          {/* Storage pie */}
          <div className="rounded-2xl border border-glass-border bg-glass-bg shadow-glass p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-neon-amber" />
                Document Storage
              </h3>
              <span className="text-xs font-mono text-white/50">{totalStorageGB.toFixed(2)} GB total</span>
            </div>
            <StoragePieChart data={storageData} />
          </div>

          {/* AI cost trend */}
          <div className="rounded-2xl border border-glass-border bg-glass-bg shadow-glass p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                AI Cost Trend
              </h3>
            </div>
            <CostLineChart
              data={mockChartData.map((d, i) => ({ date: `Day ${i + 1}`, cost_inr: d.cost_inr }))}
            />
            <div className="mt-2 text-xs text-white/30 text-right font-mono text-neon-green">
              Total: ₹{mockChartData.reduce((s, d) => s + d.cost_inr, 0).toFixed(0)}
            </div>
          </div>

          {/* Scraper activity */}
          <div className="rounded-2xl border border-glass-border bg-glass-bg shadow-glass p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                Court Scraper Activity
              </h3>
              <span className="text-xs text-white/30">{period}</span>
            </div>
            <div className="space-y-3">
              {scraperData.map(c => {
                const total = c.scrapes + c.failures;
                const failPct = total > 0 ? (c.failures / total) * 100 : 0;
                return (
                  <div key={c.court}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/70">{c.court}</span>
                      <span className="text-white/40 font-mono">
                        {c.scrapes} scrapes
                        <span className={failPct > 10 ? "text-red-400 ml-1" : "text-white/30 ml-1"}>
                          ({c.failures} failed)
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.min((c.scrapes / 150) * 100, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Failed WhatsApp table */}
          <div className="rounded-2xl border border-glass-border bg-glass-bg shadow-glass p-5">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Failed Deliveries</h3>
            {whatsappTotals.failed > 0 ? (
              <div className="space-y-2">
                {[
                  { code: "ERR_401", msg: "Invalid WhatsApp business account" },
                  { code: "ERR_429", msg: "Rate limit exceeded" },
                  { code: "ERR_404", msg: "Phone number not on WhatsApp" },
                ].map(e => (
                  <div key={e.code} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/15">
                    <span className="text-xs font-mono text-red-400 bg-red-400/10 px-2 py-0.5 rounded shrink-0">{e.code}</span>
                    <span className="text-xs text-white/60">{e.msg}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-neon-green py-8 text-center">No failed deliveries</div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
