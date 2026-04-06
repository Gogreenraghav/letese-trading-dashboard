"use client";
import React, { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import clsx from "clsx";

const NEON_COLORS = ["#00D4FF", "#8B5CF6", "#00FF88", "#FF3CAC", "#F59E0B", "#1A4FBF"];

// ── AI Calls Chart ─────────────────────────────────────────────────
export function AIUsageChart({ data }: { data: { tokens_input: number; tokens_output: number; cost_inr: number }[] }) {
  const chartData = data.map((d, i) => ({
    name: `Day ${i + 1}`,
    "Input Tokens": d.tokens_input,
    "Output Tokens": d.tokens_output,
    "Cost (₹)": d.cost_inr,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
        <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
        <Tooltip
          contentStyle={{
            background: "#0d1224",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            color: "#fff",
            fontSize: 12,
          }}
        />
        <Bar dataKey="Input Tokens" fill="#00D4FF" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Output Tokens" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── WhatsApp Stacked Bar ───────────────────────────────────────────
export function WhatsAppChart({ data }: { data: { sent: number; delivered: number; read: number; failed: number }[] }) {
  const chartData = data.map((d, i) => ({
    name: `Day ${i + 1}`,
    Sent: d.sent,
    Delivered: d.delivered,
    Read: d.read,
    Failed: d.failed,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
        <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
        <Tooltip
          contentStyle={{ background: "#0d1224", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }} />
        <Bar dataKey="Sent" fill="#00D4FF" stackId="a" />
        <Bar dataKey="Delivered" fill="#8B5CF6" stackId="a" />
        <Bar dataKey="Read" fill="#00FF88" stackId="a" />
        <Bar dataKey="Failed" fill="#FF3CAC" stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Storage Pie Chart ───────────────────────────────────────────────
export function StoragePieChart({ data }: { data: { type: string; gb: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          dataKey="gb"
          nameKey="type"
          label={({ type, gb }) => `${type} ${gb}GB`}
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={NEON_COLORS[i % NEON_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#0d1224", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Cost Line Chart ─────────────────────────────────────────────────
export function CostLineChart({ data }: { data: { date: string; cost_inr: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
        <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
        <Tooltip
          contentStyle={{ background: "#0d1224", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="cost_inr"
          stroke="#00FF88"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#00FF88" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  accentColor?: string;
}

export function StatCard({ label, value, sub, trend, icon, accentColor = "#00D4FF" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-glass-border bg-glass-bg p-4 shadow-glass">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${accentColor}20`, boxShadow: `0 0 12px ${accentColor}30` }}
        >
          {icon}
        </div>
        {trend && (
          <span className={clsx(
            "text-xs font-medium",
            trend === "up" ? "text-neon-green" : trend === "down" ? "text-red-400" : "text-white/30"
          )}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {sub}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white font-mono" style={{ color: accentColor }}>
        {value}
      </div>
      <div className="text-xs text-white/40 mt-1">{label}</div>
    </div>
  );
}
