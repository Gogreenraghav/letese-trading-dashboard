"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Search,
  Scale,
  LifeBuoy,
} from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/team", icon: Users, label: "Team" },
  { href: "/admin/billing", icon: CreditCard, label: "Billing" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/tickets", icon: LifeBuoy, label: "Support Tickets" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

interface AdminShellProps {
  children: React.ReactNode;
  userName?: string;
  firmName?: string;
  plan?: string;
}

export default function AdminShell({
  children,
  userName = "Admin",
  firmName = "Your Law Firm",
  plan = "Professional",
}: AdminShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auth check — redirect to login if not authenticated
  useEffect(() => {
    const pathname = window.location.pathname;
    // Don't redirect if already on login page
    if (pathname === "/login" || pathname === "/admin/login") return;
    const token = localStorage.getItem("ca_token");
    if (!token) {
      window.location.href = "/login";
    }
  }, []);

  return (
    <div className="flex h-screen bg-dark-gradient overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={clsx(
          "flex flex-col bg-glass-bg border-r border-glass-border backdrop-blur-xl transition-all duration-300",
          sidebarCollapsed ? "w-[72px]" : "w-[240px]"
        )}
        style={{ boxShadow: "inset -1px 0 0 rgba(255,255,255,0.05)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-glass-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-neon-cyan shrink-0">
            <Scale className="w-4 h-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <div className="text-white font-bold text-sm leading-none">LETESE</div>
              <div className="text-[10px] text-white/40 mt-0.5">Legal SaaS</div>
            </div>
          )}
        </div>

        {/* Firm badge */}
        {!sidebarCollapsed && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <div className="text-xs text-white/40 mb-0.5">Firm</div>
            <div className="text-sm text-white font-medium truncate">{firmName}</div>
            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand/20 border border-brand/30">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
              <span className="text-[10px] font-medium text-neon-cyan uppercase tracking-wide">
                {plan}
              </span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 mt-4 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative",
                  isActive
                    ? "bg-brand/20 text-white border border-brand/30 shadow-neon-purple"
                    : "text-white/50 hover:text-white hover:bg-glass-hover border border-transparent"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-neon-purple rounded-r-full shadow-neon-purple" />
                )}
                <Icon
                  className={clsx(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-neon-purple" : "text-white/40 group-hover:text-white"
                  )}
                />
                {!sidebarCollapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-glass-border space-y-1 shrink-0">
          <button
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-glass-hover transition-all border border-transparent"
            onClick={() => {
              localStorage.removeItem("ca_token");
              localStorage.removeItem("ca_user");
              localStorage.removeItem("ca_tenant");
              window.location.href = "/login";
            }}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>

          {/* User avatar */}
          <div className={clsx(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]",
            sidebarCollapsed && "justify-center"
          )}>
            <div className="w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center text-xs font-bold text-white shrink-0">
              {userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <div className="text-sm text-white font-medium truncate">{userName}</div>
                <div className="text-[10px] text-white/40">Admin</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-16 border-b border-glass-border bg-glass-bg backdrop-blur-xl flex items-center px-6 gap-4 shrink-0">
          <div className="flex-1 flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Search cases, clients..."
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
            />
          </div>
          <button className="relative w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/50 hover:text-white transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-neon-pink shadow-neon-pink" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
