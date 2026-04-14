"use client";
import React, { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import TopupRequests from "@/components/TopupRequests";
import { DollarSign, Users } from "lucide-react";
import clsx from "clsx";

const TABS = [
  { id: "topups", label: "Wallet Top-Ups", icon: DollarSign },
];

export default function BillingPage() {
  const [tab, setTab] = useState("topups");

  return (
    <DashboardShell title="Billing & Wallet">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-amber/15 border border-neon-amber/30 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-neon-amber" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Billing & Wallet Management</h1>
            <p className="text-sm text-white/40">Approve client wallet top-ups and manage billing</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-1 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] w-fit">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all",
                  tab === t.id
                    ? "bg-neon-amber/20 text-neon-amber border border-neon-amber/30"
                    : "text-white/40 hover:text-white")}>
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {tab === "topups" && <TopupRequests />}
      </div>
    </DashboardShell>
  );
}
