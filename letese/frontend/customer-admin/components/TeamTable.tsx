"use client";
import React, { useState } from "react";
import { User, teamApi } from "@/lib/api";
import RoleBadge from "./RoleBadge";
import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  Shield,
  UserMinus,
  UserX,
  RefreshCw,
  Download,
  UserPlus,
  Loader2,
} from "lucide-react";
import clsx from "clsx";

const ROLES = ["admin", "advocate", "clerk", "paralegal", "intern"] as const;

interface TeamTableProps {
  users: User[];
  onRefresh: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export default function TeamTable({ users, onRefresh, onError, onSuccess }: TeamTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("advocate");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setEditingRoleId(null);
    setLoadingId(userId);
    try {
      await teamApi.updateUser(userId, { role: newRole });
      onSuccess(`Role updated to ${newRole}`);
      onRefresh();
    } catch {
      onError("Failed to update role");
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggleActive = async (user: User) => {
    setOpenMenuId(null);
    setLoadingId(user.user_id);
    try {
      await teamApi.updateUser(user.user_id, { is_active: !user.is_active });
      onSuccess(user.is_active ? "User suspended" : "User reactivated");
      onRefresh();
    } catch {
      onError("Failed to update user status");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = async (user: User) => {
    setOpenMenuId(null);
    if (!confirm(`Remove ${user.full_name}? Their open cases will be reassigned to you.`)) return;
    setLoadingId(user.user_id);
    try {
      await teamApi.removeUser(user.user_id);
      onSuccess(`${user.full_name} removed from team`);
      onRefresh();
    } catch {
      onError("Failed to remove user");
    } finally {
      setLoadingId(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const result = await teamApi.inviteUser(inviteEmail, inviteRole, inviteName || undefined);
      onSuccess(result.message);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("advocate");
    } catch {
      onError("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Role", "Status", "Open Cases", "Last Login"];
    const rows = users.map(u => [
      u.full_name,
      u.email,
      u.role,
      u.is_active ? "active" : "suspended",
      u.open_cases,
      u.last_login_at || "Never",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "letese-team.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-gradient text-white text-sm font-medium shadow-neon-cyan hover:opacity-90 transition-opacity"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/70 text-sm hover:text-white hover:bg-white/[0.07] transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
        <div className="ml-auto text-sm text-white/40">
          {users.length} member{users.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-glass-border overflow-hidden bg-glass-bg shadow-glass">
        <table className="w-full">
          <thead>
            <tr className="border-b border-glass-border">
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Member</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Open Cases</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Last Active</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {users.map(user => (
              <tr key={user.user_id} className="hover:bg-white/[0.02] transition-colors">
                {/* Avatar + Name */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {user.avatar_initials}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{user.full_name}</div>
                      <div className="text-xs text-white/40">{user.email}</div>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="px-4 py-3.5">
                  {loadingId === user.user_id && editingRoleId === user.user_id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                  ) : (
                    <div className="relative">
                      <RoleBadge
                        role={user.role}
                        onClick={() => setEditingRoleId(
                          editingRoleId === user.user_id ? null : user.user_id
                        )}
                      />
                      {editingRoleId === user.user_id && (
                        <div className="absolute top-full left-0 mt-1 z-20 bg-[#0d1224] border border-glass-border rounded-lg shadow-glass overflow-hidden min-w-[140px]">
                          {ROLES.map(r => (
                            <button
                              key={r}
                              onClick={() => handleRoleChange(user.user_id, r)}
                              className={clsx(
                                "w-full text-left px-3 py-2 text-xs hover:bg-white/[0.07] transition-colors flex items-center gap-2",
                                user.role === r ? "text-neon-cyan" : "text-white/70"
                              )}
                            >
                              <div className={clsx(
                                "w-1.5 h-1.5 rounded-full",
                                r === "admin" ? "bg-purple-400" :
                                r === "advocate" ? "bg-blue-400" :
                                r === "clerk" ? "bg-cyan-400" :
                                r === "paralegal" ? "bg-amber-400" : "bg-gray-400"
                              )} />
                              {r.charAt(0).toUpperCase() + r.slice(1)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3.5">
                  <div className={clsx(
                    "inline-flex items-center gap-1.5 text-xs font-medium",
                    user.is_active ? "text-neon-green" : "text-white/30"
                  )}>
                    <div className={clsx(
                      "w-1.5 h-1.5 rounded-full",
                      user.is_active ? "bg-neon-green shadow-neon-green" : "bg-white/20"
                    )} />
                    {user.is_active ? "Active" : "Suspended"}
                  </div>
                </td>

                {/* Open Cases */}
                <td className="px-4 py-3.5">
                  <span className={clsx(
                    "text-sm font-mono",
                    user.open_cases > 0 ? "text-white" : "text-white/30"
                  )}>
                    {user.open_cases}
                  </span>
                </td>

                {/* Last Active */}
                <td className="px-4 py-3.5">
                  <span className="text-xs text-white/40">
                    {user.last_login_at
                      ? formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true })
                      : "Never"}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5">
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === user.user_id ? null : user.user_id)}
                      disabled={loadingId === user.user_id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.07] transition-all disabled:opacity-50"
                    >
                      {loadingId === user.user_id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <MoreHorizontal className="w-4 h-4" />
                      }
                    </button>
                    {openMenuId === user.user_id && (
                      <div className="absolute right-0 top-full mt-1 z-20 bg-[#0d1224] border border-glass-border rounded-lg shadow-glass overflow-hidden min-w-[160px]">
                        <button
                          onClick={() => handleToggleActive(user)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-white/[0.07] transition-colors flex items-center gap-2 text-white/70"
                        >
                          {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          {user.is_active ? "Suspend" : "Reactivate"}
                        </button>
                        <button
                          onClick={() => handleRemove(user)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-red-500/10 transition-colors flex items-center gap-2 text-red-400"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="py-16 text-center text-white/30 text-sm">
            No team members yet — invite someone to get started.
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0d1224] border border-glass-border rounded-2xl shadow-glass p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Invite Team Member</h3>
            <p className="text-sm text-white/40 mb-5">
              They'll receive a magic link valid for 24 hours.
            </p>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Full Name (optional)</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="Priya Sharma"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 outline-none focus:border-brand/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="priya@lawfirm.in"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 outline-none focus:border-brand/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Role *</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white outline-none focus:border-brand/50 transition-colors appearance-none"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r} className="bg-[#0d1224]">
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 hover:bg-white/[0.07] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-brand-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
