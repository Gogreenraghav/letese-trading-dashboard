"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  Users,
  Search,
  Plus,
  TrendingUp,
  Clock,
  UserCheck,
  RefreshCw,
  ChevronDown,
  DollarSign,
  UserPlus,
} from "lucide-react";

interface TradingUser {
  id: number;
  userId: string;
  username: string;
  email: string | null;
  balance: number;
  initialBalance: number;
  plan: string;
  referralCode: string;
  referredBy: string | null;
  createdAt: string;
  lastActive: string;
  totalDeposits: number;
  totalWithdrawals: number;
  tradesCount: number;
  status: string;
}

const PLAN_COLORS: Record<string, string> = {
  basic: "#94A3B8",
  professional: "#00D4FF",
  elite: "#F59E0B",
  enterprise: "#A855F7",
};

export default function UsersPage() {
  const [users, setUsers] = useState<TradingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TradingUser | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [fundNote, setFundNote] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRef, setNewRef] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const TRADING_API = "http://139.59.65.82:3005";

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch(`${TRADING_API}/api/admin/users`);
      const data = await res.json();
      // Balance hidden in list — fetch each user
      const withBalances = await Promise.all(
        (data.users || []).map(async (u: { userId: string }) => {
          try {
            const r = await fetch(`${TRADING_API}/api/admin/users/${u.userId}`);
            return r.json();
          } catch {
            return u;
          }
        })
      );
      setUsers(withBalances);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      u.userId.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAddFunds() {
    if (!selectedUser || !fundAmount) return;
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetch(
        `${TRADING_API}/api/admin/users/${selectedUser.userId}/add-balance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: parseFloat(fundAmount), note: fundNote }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setMsg({ type: "success", text: `₹${parseFloat(fundAmount).toLocaleString("en-IN")} added to ${selectedUser.username}!` });
        setFundAmount("");
        setFundNote("");
        setShowAddFunds(false);
        loadUsers();
      } else {
        setMsg({ type: "error", text: data.error || "Failed" });
      }
    } catch (e: unknown) {
      setMsg({ type: "error", text: String(e) });
    }
    setActionLoading(false);
  }

  async function handleCreateUser() {
    if (!newUsername) return;
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${TRADING_API}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, email: newEmail || undefined, referredBy: newRef || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: "success", text: `User ${data.username} created! ID: ${data.userId}` });
        setNewUsername("");
        setNewEmail("");
        setNewRef("");
        setShowAddUser(false);
        loadUsers();
      } else {
        setMsg({ type: "error", text: data.error || "Failed" });
      }
    } catch (e: unknown) {
      setMsg({ type: "error", text: String(e) });
    }
    setActionLoading(false);
  }

  function formatINR(n: number) {
    return "₹" + Math.round(n).toLocaleString("en-IN");
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  const totalBalance = users.reduce((s, u) => s + (u.balance || 0), 0);
  const totalDeposits = users.reduce((s, u) => s + (u.totalDeposits || 0), 0);
  const activeUsers = users.filter(
    (u) => Date.now() - new Date(u.lastActive).getTime() < 86400000
  ).length;

  return (
    <DashboardShell title="AI24X7 Users" active="users">
      <div className="p-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: users.length, icon: Users, color: "#00D4FF" },
            { label: "Total Balance", value: formatINR(totalBalance), icon: DollarSign, color: "#22C55E" },
            { label: "Total Deposits", value: formatINR(totalDeposits), icon: TrendingUp, color: "#F59E0B" },
            { label: "Active Today", value: activeUsers, icon: UserCheck, color: "#A855F7" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card p-5 flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Message */}
        {msg && (
          <div className={`px-4 py-3 rounded-lg text-sm font-medium ${msg.type === "success" ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
            {msg.text}
          </div>
        )}

        {/* Actions bar */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username, email, or ID..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => { setShowAddUser(false); setShowAddFunds(false); loadUsers(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => { setShowAddUser(true); setShowAddFunds(false); setMsg(null); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition"
            style={{ background: "linear-gradient(135deg, #00D4FF, #0066FF)" }}
          >
            <UserPlus size={14} /> New User
          </button>
        </div>

        {/* New User Form */}
        {showAddUser && (
          <div className="glass-card p-5 border border-blue-500/30">
            <h3 className="text-sm font-bold text-white mb-4">Create New User</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Username *</label>
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  placeholder="e.g. arjun_trader"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Email</label>
                <input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="arjun@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Referred By (optional)</label>
                <input
                  value={newRef}
                  onChange={(e) => setNewRef(e.target.value)}
                  placeholder="Referral code"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateUser}
                disabled={actionLoading || !newUsername}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-50 transition"
                style={{ background: "linear-gradient(135deg, #00D4FF, #0066FF)" }}
              >
                {actionLoading ? "Creating..." : "Create User"}
              </button>
              <button
                onClick={() => setShowAddUser(false)}
                className="px-5 py-2.5 rounded-lg text-sm text-slate-400 border border-white/10 hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-slate-500">
                  <th className="text-left px-4 py-3 font-medium">USER</th>
                  <th className="text-left px-4 py-3 font-medium">USER ID</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">PLAN</th>
                  <th className="text-right px-4 py-3 font-medium">BALANCE</th>
                  <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">DEPOSITS</th>
                  <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">TRADES</th>
                  <th className="text-right px-4 py-3 font-medium hidden xl:table-cell">JOINED</th>
                  <th className="text-right px-4 py-3 font-medium">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-500">Loading...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-500">No users found</td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/3 transition">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg, #00D4FF22, #0066FF22)", border: "1px solid #00D4FF30" }}>
                            {user.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white text-sm">{user.username}</div>
                            <div className="text-xs text-slate-500">{user.email || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs text-slate-400">{user.userId}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: PLAN_COLORS[user.plan] || "#94A3B8", background: `${PLAN_COLORS[user.plan] || "#94A3B8"}18` }}>
                          {user.plan?.toUpperCase() || "BASIC"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-bold text-green-400">{formatINR(user.balance || 0)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                        <span className="text-slate-300 font-mono text-xs">{formatINR(user.totalDeposits || 0)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                        <span className="text-slate-400 font-mono text-xs">{user.tradesCount || 0}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right hidden xl:table-cell">
                        <div className="flex items-center justify-end gap-1 text-slate-500 text-xs">
                          <Clock size={11} /> {timeAgo(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => { setSelectedUser(user); setShowAddFunds(true); setShowAddUser(false); setMsg(null); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-green-400 border border-green-500/30 hover:bg-green-500/10 transition"
                        >
                          + Add Funds
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Funds Modal */}
        {showAddFunds && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
            <div className="glass-card p-6 w-full max-w-md border border-green-500/30">
              <h3 className="text-lg font-bold text-white mb-1">Add Funds</h3>
              <p className="text-sm text-slate-400 mb-4">
                Adding to: <span className="text-white font-medium">@{selectedUser.username}</span>{" "}
                <span className="font-mono text-xs text-slate-500">({selectedUser.userId})</span>
              </p>
              <div className="space-y-3">
                {["5000", "10000", "25000", "50000"].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setFundAmount(amt)}
                    className={`w-full py-3 rounded-lg text-sm font-bold border transition ${fundAmount === amt ? "bg-green-500/20 border-green-500 text-green-400" : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"}`}
                  >
                    ₹{parseInt(amt).toLocaleString("en-IN")}
                  </button>
                ))}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Or enter custom amount</label>
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="Enter amount in ₹"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-green-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Note (optional)</label>
                  <input
                    value={fundNote}
                    onChange={(e) => setFundNote(e.target.value)}
                    placeholder="e.g. Deposit from bank transfer"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
              {fundAmount && (
                <div className="mt-3 text-center text-sm text-slate-400">
                  New Balance: <span className="text-green-400 font-bold text-lg">₹{Math.round((selectedUser.balance || 0) + parseFloat(fundAmount || "0")).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={handleAddFunds}
                  disabled={actionLoading || !fundAmount || parseFloat(fundAmount) <= 0}
                  className="flex-1 py-3 rounded-lg text-sm font-bold text-white disabled:opacity-50 transition"
                  style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}
                >
                  {actionLoading ? "Adding..." : `Add ₹${parseFloat(fundAmount || "0").toLocaleString("en-IN")}`}
                </button>
                <button
                  onClick={() => { setShowAddFunds(false); setFundAmount(""); setFundNote(""); }}
                  className="px-5 py-3 rounded-lg text-sm text-slate-400 border border-white/10 hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
