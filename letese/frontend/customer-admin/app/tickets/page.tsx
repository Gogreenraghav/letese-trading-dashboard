"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/AdminShell";
import {
  LifeBuoy,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Send,
} from "lucide-react";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

interface TicketMessage {
  id: string;
  sender: "user" | "support";
  text: string;
  timestamp: string;
}

const CATEGORIES = [
  "Technical Issue",
  "Billing Problem",
  "Feature Request",
  "Court Scraper",
  "Document Drafting",
  "WhatsApp Integration",
  "Payment Issue",
  "Account Access",
  "Other",
];

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: "#94A3B8",
  medium: "#F59E0B",
  high: "#F97316",
  urgent: "#EF4444",
};

const STATUS_ICONS: Record<TicketStatus, React.ReactNode> = {
  open: <AlertCircle size={14} className="text-blue-400" />,
  in_progress: <Clock size={14} className="text-amber-400" />,
  resolved: <CheckCircle size={14} className="text-green-400" />,
  closed: <XCircle size={14} className="text-slate-500" />,
};

const INITIAL_TICKETS: Ticket[] = [
  {
    id: "TKT-001",
    subject: "WhatsApp notifications not working",
    description: "My clients are not receiving WhatsApp reminders for upcoming hearings. This started happening since yesterday.",
    priority: "high",
    status: "open",
    category: "WhatsApp Integration",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
    messages: [
      { id: "m1", sender: "user", text: "My clients are not receiving WhatsApp reminders for upcoming hearings. This started happening since yesterday.", timestamp: new Date(Date.now() - 86400000).toISOString() },
    ],
  },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">("all");
  const [newMsg, setNewMsg] = useState("");
  const [user, setUser] = useState({ full_name: "Admin" });
  const [tenant, setTenant] = useState({ name: "Your Firm", plan: "professional" });

  // New ticket form
  const [newSubject, setNewSubject] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newPriority, setNewPriority] = useState<TicketPriority>("medium");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem("ca_user") || '{"full_name":"Admin"}'));
      setTenant(JSON.parse(localStorage.getItem("ca_tenant") || '{"name":"Your Firm","plan":"professional"}'));
    } catch(e) { /* ignore */ }
  }, []);

  const filtered = tickets.filter((t) => filterStatus === "all" || t.status === filterStatus);
  const openCount = tickets.filter((t) => t.status === "open").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

  function createTicket() {
    if (!newSubject.trim() || !newDesc.trim()) return;
    setSubmitting(true);
    const ticket: Ticket = {
      id: `TKT-${String(tickets.length + 1).padStart(3, "0")}`,
      subject: newSubject,
      description: newDesc,
      priority: newPriority,
      status: "open",
      category: newCategory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [{ id: "m0", sender: "user", text: newDesc, timestamp: new Date().toISOString() }],
    };
    setTimeout(() => {
      setTickets((prev) => [ticket, ...prev]);
      setShowNew(false);
      setNewSubject("");
      setNewDesc("");
      setNewPriority("medium");
      setSubmitting(false);
    }, 500);
  }

  function sendReply() {
    if (!newMsg.trim() || !selectedTicket) return;
    const msg: TicketMessage = {
      id: `m${Date.now()}`,
      sender: "user",
      text: newMsg,
      timestamp: new Date().toISOString(),
    };
    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? { ...t, messages: [...t.messages, msg], updatedAt: new Date().toISOString() }
          : t
      )
    );
    setSelectedTicket((prev) =>
      prev ? { ...prev, messages: [...prev.messages, msg] } : null
    );
    setNewMsg("");
  }

  return (
    <AdminShell firmName={tenant.name} userName={user.full_name} plan={tenant.plan}>
      <div className="flex gap-6 h-full min-h-0">
        {/* ── Ticket List ── */}
        <div className="w-80 shrink-0 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Support Tickets</h2>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition"
              style={{ background: "linear-gradient(135deg, #00D4FF, #0066FF)" }}
            >
              <Plus size={13} /> New Ticket
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-1 mb-3 flex-wrap">
            {(["all", "open", "in_progress", "resolved", "closed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition"
                style={{
                  background: filterStatus === s ? "#00D4FF20" : "rgba(255,255,255,0.04)",
                  color: filterStatus === s ? "#00D4FF" : "#64748B",
                  border: `1px solid ${filterStatus === s ? "#00D4FF30" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                {s === "open" && openCount > 0 && ` (${openCount})`}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">No tickets</div>
            ) : (
              filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTicket(t); setShowNew(false); }}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    selectedTicket?.id === t.id
                      ? "bg-white/[0.06] border-blue-500/30"
                      : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono text-slate-500">{t.id}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ color: PRIORITY_COLORS[t.priority], background: `${PRIORITY_COLORS[t.priority]}18` }}
                      >
                        {t.priority.toUpperCase()}
                      </span>
                      {STATUS_ICONS[t.status]}
                    </div>
                  </div>
                  <div className="text-sm text-white font-medium mb-1 leading-snug">{t.subject}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{t.category}</span>
                    <span className="text-[10px] text-slate-500">{timeAgo(t.createdAt)}</span>
                  </div>
                  {t.messages.length > 1 && (
                    <div className="mt-1 text-[10px] text-blue-400">
                      <MessageSquare size={10} className="inline mr-1" />
                      {t.messages.length - 1} replies
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Ticket Detail / New Ticket ── */}
        <div className="flex-1 min-w-0 flex flex-col glass-card rounded-xl overflow-hidden">
          {showNew ? (
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-white">New Support Ticket</h3>
                <button onClick={() => setShowNew(false)} className="text-slate-400 hover:text-white transition">
                  <XCircle size={18} />
                </button>
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Subject *</label>
                  <input
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Brief description of the issue"
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none appearance-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none appearance-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🟠 High</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-400 block mb-1.5">Description *</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    className="w-full h-40 px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
              </div>
              <button
                onClick={createTicket}
                disabled={submitting || !newSubject.trim() || !newDesc.trim()}
                className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition"
                style={{ background: "linear-gradient(135deg, #00D4FF, #0066FF)" }}
              >
                {submitting ? "Submitting..." : (<><Send size={14} /> Submit Ticket</>)}
              </button>
            </div>
          ) : selectedTicket ? (
            <>
              {/* Header */}
              <div className="p-5 border-b border-white/5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-slate-500">{selectedTicket.id}</span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ color: PRIORITY_COLORS[selectedTicket.priority], background: `${PRIORITY_COLORS[selectedTicket.priority]}18` }}
                      >
                        {selectedTicket.priority.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{selectedTicket.subject}</h3>
                  </div>
                  <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white shrink-0">
                    <XCircle size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{selectedTicket.category}</span>
                  <span>•</span>
                  <span>Created {timeAgo(selectedTicket.createdAt)}</span>
                  <span>•</span>
                  <span>Updated {timeAgo(selectedTicket.updatedAt)}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {selectedTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className="max-w-[75%] rounded-2xl px-4 py-3"
                      style={{
                        background: msg.sender === "user"
                          ? "linear-gradient(135deg, #00D4FF15, #0066FF15)"
                          : "rgba(255,255,255,0.05)",
                        border: msg.sender === "user"
                          ? "1px solid rgba(0,212,255,0.2)"
                          : "1px solid rgba(255,255,255,0.08)",
                        borderRadius: msg.sender === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                      }}
                    >
                      <div className="text-xs font-medium mb-1" style={{ color: msg.sender === "user" ? "#00D4FF" : "#94A3B8" }}>
                        {msg.sender === "user" ? user.full_name : "LETESE Support"}
                      </div>
                      <div className="text-sm text-white leading-relaxed">{msg.text}</div>
                      <div className="text-[10px] text-slate-500 mt-1 text-right">{formatDate(msg.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply */}
              {selectedTicket.status !== "closed" && (
                <div className="p-4 border-t border-white/5">
                  <div className="flex gap-2">
                    <input
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendReply())}
                      placeholder="Type your reply... (Enter to send)"
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                    <button
                      onClick={sendReply}
                      disabled={!newMsg.trim()}
                      className="px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition"
                      style={{ background: "linear-gradient(135deg, #00D4FF, #0066FF)" }}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <LifeBuoy size={48} className="text-slate-600 mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">No ticket selected</h3>
              <p className="text-slate-500 text-sm mb-5">Select a ticket to view or create a new one</p>
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition"
                style={{ background: "linear-gradient(135deg, #00D4FF, #0066FF)" }}
              >
                <Plus size={14} /> New Ticket
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
