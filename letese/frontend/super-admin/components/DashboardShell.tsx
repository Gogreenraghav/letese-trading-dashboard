"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Activity,
  Building2,
  Plug,
  ShieldAlert,
  FileText,
  LogOut,
  ChevronRight,
  Scale,
  TrendingUp,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/health", label: "System Health", icon: Activity },
  { href: "/tenants", label: "Tenants", icon: Building2 },
  { href: "/users", label: "AI24X7 Users", icon: TrendingUp },
  { href: "/api-vendors", label: "API Vendors", icon: Plug },
  { href: "/police", label: "Police Console", icon: ShieldAlert },
  { href: "/audit", label: "Audit Logs", icon: FileText },
];

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
  active?: string;
  actions?: React.ReactNode;
}

export default function DashboardShell({
  children,
  title,
  actions,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; role?: string } | null>(
    null
  );

  useEffect(() => {
    // Decode JWT from localStorage to show user info
    const token = localStorage.getItem("sa_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser(payload);
      } catch {
        // ignore
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("sa_token");
    router.push("/login");
  };

  const currentLabel =
    NAV_ITEMS.find((n) => n.href === pathname)?.label || "Super Admin";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0A0E1A" }}>
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className="flex flex-col w-60 shrink-0 border-r"
        style={{
          background:
            "linear-gradient(180deg, rgba(17,24,39,0.95) 0%, rgba(10,14,26,0.98) 100%)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: "linear-gradient(135deg, #1A4FBF, #8B5CF6)" }}
          >
            <Scale size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">LETESE</div>
            <div className="text-[10px]" style={{ color: "#00D4FF" }}>
              SUPER ADMIN
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group"
                style={{
                  background: isActive
                    ? "rgba(26,79,191,0.15)"
                    : "transparent",
                  color: isActive ? "#00D4FF" : "#94A3B8",
                  border: isActive
                    ? "1px solid rgba(0,212,255,0.2)"
                    : "1px solid transparent",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                <Icon
                  size={16}
                  style={{ color: isActive ? "#00D4FF" : "#475569" }}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <ChevronRight size={12} style={{ color: "#00D4FF" }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Version tag */}
        <div className="px-5 py-4 border-t text-[11px]" style={{ borderColor: "rgba(255,255,255,0.06)", color: "#475569" }}>
          LETESE v3.1 · Module E-SA
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header
          className="flex items-center justify-between px-6 shrink-0 border-b"
          style={{
            height: 56,
            background: "rgba(17,24,39,0.8)",
            borderColor: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div className="flex items-center gap-2 text-sm">
            <span style={{ color: "#475569" }}>LETESE /</span>
            <span className="font-medium text-white">{currentLabel}</span>
          </div>

          <div className="flex items-center gap-4">
            {actions}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-medium text-white">
                  {user?.email || "Super Admin"}
                </div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: "#00D4FF" }}>
                  {user?.role || "super_admin"}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "#EF4444",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <LogOut size={12} />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ background: "#0A0E1A" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
