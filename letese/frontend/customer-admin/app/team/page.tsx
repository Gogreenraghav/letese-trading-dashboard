"use client";
import React, { useEffect, useState, useCallback } from "react";
import AdminShell from "@/components/AdminShell";
import TeamTable from "@/components/TeamTable";
import { teamApi, User } from "@/lib/api";
import { Users } from "lucide-react";

function Toast({ message, type, onDone }: { message: string; type: "success" | "error"; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-glass text-sm font-medium ${
      type === "success"
        ? "bg-neon-green/10 border-neon-green/40 text-neon-green"
        : "bg-red-500/10 border-red-500/40 text-red-400"
    }`}>
      {message}
    </div>
  );
}

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const firmName = typeof window !== "undefined" ? localStorage.getItem("firm_name") || "Your Law Firm" : "Your Law Firm";

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await teamApi.listUsers();
      setUsers(data.users);
    } catch {
      // Dev fallback
      setUsers([
        {
          user_id: "1", full_name: "Priya Sharma", email: "priya@lawfirm.in",
          role: "admin", is_active: true, last_login_at: new Date().toISOString(),
          created_at: new Date().toISOString(), open_cases: 12, avatar_initials: "PS",
        },
        {
          user_id: "2", full_name: "Ravi Kumar", email: "ravi@lawfirm.in",
          role: "advocate", is_active: true, last_login_at: new Date(Date.now() - 86400000).toISOString(),
          created_at: new Date().toISOString(), open_cases: 28, avatar_initials: "RK",
        },
        {
          user_id: "3", full_name: "Anita Desai", email: "anita@lawfirm.in",
          role: "clerk", is_active: true, last_login_at: new Date(Date.now() - 3600000).toISOString(),
          created_at: new Date().toISOString(), open_cases: 7, avatar_initials: "AD",
        },
        {
          user_id: "4", full_name: "Sanjay Patel", email: "sanjay@lawfirm.in",
          role: "paralegal", is_active: false, last_login_at: new Date(Date.now() - 604800000).toISOString(),
          created_at: new Date().toISOString(), open_cases: 0, avatar_initials: "SP",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  return (
    <AdminShell firmName={firmName} userName="Admin">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Team Management</h1>
              <p className="text-sm text-white/40">Manage your firm's team members and access control</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-glass-border bg-glass-bg h-64 animate-pulse" />
        ) : (
          <TeamTable
            users={users}
            onRefresh={loadUsers}
            onError={msg => setToast({ msg, type: "error" })}
            onSuccess={msg => setToast({ msg, type: "success" })}
          />
        )}

        {toast && (
          <Toast
            message={toast.msg}
            type={toast.type}
            onDone={() => setToast(null)}
          />
        )}
      </div>
    </AdminShell>
  );
}
