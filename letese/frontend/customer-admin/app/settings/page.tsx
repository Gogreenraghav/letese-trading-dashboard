"use client";
import React, { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Settings, Building2, Bell, Webhook, Download } from "lucide-react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

function Toast({ message, type, onDone }: { message: string; type: "success" | "error"; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-glass text-sm font-medium ${
      type === "success" ? "bg-neon-green/10 border-neon-green/40 text-neon-green" : "bg-red-500/10 border-red-500/40 text-red-400"
    }`}>
      {message}
    </div>
  );
}

const SECTIONS = [
  { id: "profile", label: "Firm Profile", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "webhooks", label: "API & Webhooks", icon: Webhook },
  { id: "data", label: "Data & Privacy", icon: Download },
] as const;

type Section = typeof SECTIONS[number]["id"];

const HEARING_REMINDER_DAYS = [15, 7, 48, 24];

export default function SettingsPage() {
  const [section, setSection] = useState<Section>("profile");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const firmName = typeof window !== "undefined" ? localStorage.getItem("firm_name") || "Your Law Firm" : "Your Law Firm";

  // Form state
  const [profile, setProfile] = useState({
    name: firmName,
    email: "admin@lawfirm.in",
    phone: "+91 98765 43210",
    bar_enrolment_no: "PB/2019/12345",
    gstin: "03AAACL1234C1Z5",
    firm_address: "SCO 12, Sector 17, Chandigarh",
  });

  const [notifPrefs, setNotifPrefs] = useState({
    whatsapp_hearing_15d: true,
    whatsapp_hearing_7d: true,
    whatsapp_hearing_48h: true,
    whatsapp_hearing_24h: false,
    sms_reminders: true,
    email_notifications: true,
    inapp_notifications: true,
  });

  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState({
    "case.hearing_date": true,
    "case.order_updated": true,
    "task.due": false,
    "invoice.paid": true,
    "payment.captured": true,
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setToast({ msg: "Firm profile updated successfully", type: "success" });
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setToast({ msg: "Notification preferences saved", type: "success" });
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    setToast({ msg: `Test webhook sent to ${webhookUrl}`, type: "success" });
  };

  const handleExportData = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
    setToast({ msg: "Data export email sent — check your inbox", type: "success" });
  };

  return (
    <AdminShell firmName={firmName}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white/70" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-sm text-white/40">Firm profile, notifications, and data management</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar nav */}
          <div className="w-48 shrink-0">
            <div className="space-y-1">
              {SECTIONS.map(s => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSection(s.id)}
                    className={clsx(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                      section === s.id
                        ? "bg-brand/20 text-white border border-brand/30"
                        : "text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent"
                    )}
                  >
                    <Icon className={clsx("w-4 h-4", section === s.id ? "text-neon-purple" : "text-white/30")} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {section === "profile" && (
              <div className="rounded-2xl border border-glass-border bg-glass-bg shadow-glass p-6 space-y-5">
                <h2 className="text-base font-semibold text-white">Firm Profile</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {([
                    ["Firm Name", "name"],
                    ["Email", "email"],
                    ["Phone", "phone"],
                    ["Bar Enrolment No.", "bar_enrolment_no"],
                    ["GSTIN", "gstin"],
                  ] as const).map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">{label}</label>
                      <input
                        type={key === "email" ? "email" : "text"}
                        value={(profile as any)[key]}
                        onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white outline-none focus:border-brand/50 transition-colors"
                      />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Address</label>
                    <textarea
                      value={profile.firm_address}
                      onChange={e => setProfile(p => ({ ...p, firm_address: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white outline-none focus:border-brand/50 transition-colors resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-lg bg-brand-gradient text-white text-sm font-medium shadow-neon-cyan hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {section === "notifications" && (
              <div className="rounded-2xl border border-glass-border bg-glass-bg shadow-glass p-6 space-y-6">
                <h2 className="text-base font-semibold text-white">Notification Preferences</h2>

                {/* WhatsApp reminders */}
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-3">WhatsApp Hearing Reminders</h3>
                  <div className="space-y-2">
                    {HEARING_REMINDER_DAYS.map(days => (
                      <label key={days} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={(notifPrefs as any)[`whatsapp_hearing_${days}d`]}
                          onChange={e =>
                            setNotifPrefs(p => ({ ...p, [`whatsapp_hearing_${days}d`]: e.target.checked }))
                          }
                          className="w-4 h-4 rounded accent-neon-cyan"
                        />
                        <div>
                          <div className="text-sm text-white">{days === 24 ? "24 hours" : days === 48 ? "48 hours" : `${days} days`} before hearing</div>
                          <div className="text-xs text-white/30">Send WhatsApp reminder via LETESE AI</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Other channels */}
                <div className="space-y-2">
                  {([
                    ["sms_reminders", "SMS Reminders", "Fallback notification via SMS gateway"],
                    ["email_notifications", "Email Notifications", "Receive email alerts for important updates"],
                    ["inapp_notifications", "In-App Notifications", "Browser push notifications"],
                  ] as const).map(([key, label, desc]) => (
                    <label key={key} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={(notifPrefs as any)[key]}
                        onChange={e => setNotifPrefs(p => ({ ...p, [key]: e.target.checked }))}
                        className="w-4 h-4 rounded accent-neon-cyan"
                      />
                      <div>
                        <div className="text-sm text-white">{label}</div>
                        <div className="text-xs text-white/30">{desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-lg bg-brand-gradient text-white text-sm font-medium shadow-neon-cyan hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {section === "webhooks" && (
              <div className="rounded-2xl border border-glass-border bg-glass-bg shadow-glass p-6 space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-white">API & Webhooks</h2>
                  <p className="text-sm text-white/40 mt-1">Enterprise feature — receive real-time events in your system</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Webhook URL</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={e => setWebhookUrl(e.target.value)}
                    placeholder="https://your-system.com/letese/webhook"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 outline-none focus:border-brand/50 transition-colors"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-3">Event Subscriptions</h3>
                  <div className="space-y-2">
                    {Object.entries(webhookEvents).map(([event, checked]) => (
                      <label key={event} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => setWebhookEvents(p => ({ ...p, [event]: e.target.checked }))}
                          className="w-4 h-4 rounded accent-neon-cyan"
                        />
                        <div className="text-xs font-mono text-white/70">{event}</div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleTestWebhook}
                    disabled={saving || !webhookUrl}
                    className="px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 hover:text-white hover:bg-white/[0.07] transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Test Webhook
                  </button>
                </div>
              </div>
            )}

            {section === "data" && (
              <div className="rounded-2xl border border-glass-border bg-glass-bg shadow-glass p-6 space-y-6">
                <h2 className="text-base font-semibold text-white">Data & Privacy</h2>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <h3 className="text-sm font-medium text-white mb-2">Export Your Data</h3>
                  <p className="text-xs text-white/40 mb-4">
                    Download a complete JSON export of all your firm's data including cases, documents metadata, communications logs, and invoices.
                  </p>
                  <button
                    onClick={handleExportData}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-lg bg-neon-green/15 border border-neon-green/30 text-sm text-neon-green hover:bg-neon-green/25 transition-all flex items-center gap-2 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Export All Data (JSON)
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-red-500/15 bg-red-500/5">
                  <h3 className="text-sm font-medium text-red-400 mb-2">Data Deletion Request</h3>
                  <p className="text-xs text-white/40 mb-4">
                    Permanently delete all firm data. This action is irreversible and will cancel your subscription.
                  </p>
                  <button
                    className="px-4 py-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-sm text-red-400 hover:bg-red-500/25 transition-all"
                  >
                    Request Data Deletion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </AdminShell>
  );
}
