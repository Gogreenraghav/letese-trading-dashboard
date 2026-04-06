"use client";

import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import VendorConfigForm, { type VendorField } from "@/components/VendorConfigForm";
import {
  MessageSquare,
  Phone,
  Mic,
  BotMessageSquare,
  Brain,
  Globe,
  Cpu,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Vendor Sections ──────────────────────────────────────────────────────────

const COMMUNICATION_VENDORS = [
  {
    id: "whatsapp_360dialog",
    name: "WhatsApp (360dialog)",
    icon: MessageSquare,
    color: "#25D366",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "••••••••••••••••" },
      { key: "instance_id", label: "Instance ID", type: "text", placeholder: "your-instance-id" },
      { key: "webhook_url", label: "Webhook URL", type: "text", placeholder: "https://your-app.com/webhooks/whatsapp" },
      {
        key: "status",
        label: "Status",
        type: "select",
        defaultValue: "SANDBOX",
        options: [
          { label: "LIVE", value: "LIVE" },
          { label: "SANDBOX", value: "SANDBOX" },
          { label: "SUSPENDED", value: "SUSPENDED" },
        ],
      },
      {
        key: "approved_templates",
        label: "Approved Templates (one per line)",
        type: "code",
        placeholder: "hearing_reminder\norder_update\ncase_status",
      },
    ] as VendorField[],
  },
  {
    id: "sms_msg91",
    name: "SMS (MSG91)",
    icon: MessageSquare,
    color: "#FF6B35",
    fields: [
      { key: "auth_key", label: "Auth Key", type: "password", placeholder: "••••••••••••••••" },
      { key: "sender_id", label: "Sender ID", type: "text", placeholder: "LETESE" },
      {
        key: "route",
        label: "Route",
        type: "select",
        defaultValue: "promotional",
        options: [
          { label: "Promotional", value: "promotional" },
          { label: "Transactional", value: "transactional" },
          { label: "OTP", value: "otp" },
        ],
      },
      { key: "template_ids", label: "Template IDs (comma-separated)", type: "text", placeholder: "tmpl_123, tmpl_456" },
    ] as VendorField[],
  },
  {
    id: "voice_exotel",
    name: "Voice / IVR (Exotel)",
    icon: Phone,
    color: "#4F46E5",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "••••••••••••••••" },
      { key: "api_token", label: "API Token", type: "password", placeholder: "••••••••••••••••" },
      { key: "app_id", label: "App ID", type: "text", placeholder: "your-app-id" },
      { key: "caller_id", label: "Caller ID", type: "text", placeholder: "+919876543210" },
      {
        key: "call_flow_xml",
        label: "Call Flow XML",
        type: "code",
        placeholder: `<Response>\n  <Play>welcome.mp3</Play>\n  <Dial>\n    <Number>+919876543210</Number>\n  </Dial>\n</Response>`,
      },
    ] as VendorField[],
  },
  {
    id: "ai_voice_elevenlabs",
    name: "AI Voice (ElevenLabs)",
    icon: Mic,
    color: "#000000",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "••••••••••••••••" },
      {
        key: "voice_id",
        label: "Voice ID (Indian English)",
        type: "select",
        defaultValue: "rachel",
        options: [
          { label: "Rachel (Female, Indian English)", value: "rachel" },
          { label: "Domi (Male, Warm)", value: "domi" },
          { label: "Bella (Female, Soft)", value: "bella" },
          { label: "Antoni (Male, Professional)", value: "antoni" },
          { label: "Aravi (Male, Indian Accent)", value: "aravi" },
          { label: "Priya (Female, Indian English)", value: "priya" },
        ],
      },
      {
        key: "model",
        label: "Model",
        type: "select",
        defaultValue: "eleven_multilingual_v2",
        options: [
          { label: "Eleven Multilingual v2", value: "eleven_multilingual_v2" },
          { label: "Eleven English v2", value: "eleven_v2" },
          { label: "Turbo v2", value: "eleven_turbo_v2" },
        ],
      },
    ] as VendorField[],
  },
];

const LLM_VENDORS = [
  {
    id: "openai",
    name: "OpenAI",
    icon: Brain,
    color: "#10A37F",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "sk-••••••••••••••••" },
      {
        key: "default_model",
        label: "Default Model",
        type: "select",
        defaultValue: "gpt-4o",
        options: [
          { label: "GPT-4o", value: "gpt-4o" },
          { label: "GPT-4o Mini", value: "gpt-4o-mini" },
          { label: "GPT-4 Turbo", value: "gpt-4-turbo" },
          { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
        ],
      },
      { key: "max_tokens", label: "Max Tokens", type: "text", placeholder: "4096", defaultValue: "4096" },
      { key: "monthly_budget_inr", label: "Monthly Budget (INR)", type: "text", placeholder: "50000" },
      { key: "current_spend_inr", label: "Current Spend (INR)", type: "text", placeholder: "0", defaultValue: "0", readOnly: true },
    ] as VendorField[],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    icon: Brain,
    color: "#CC785C",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "sk-ant-••••••••••••••••" },
      {
        key: "default_model",
        label: "Default Model",
        type: "select",
        defaultValue: "claude-3-5-sonnet-20241022",
        options: [
          { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-20241022" },
          { label: "Claude 3.5 Haiku", value: "claude-3-5-haiku-20241022" },
          { label: "Claude 3 Opus", value: "claude-3-opus-20240229" },
          { label: "Claude 3 Sonnet", value: "claude-3-sonnet-20240229" },
        ],
      },
      {
        key: "max_tokens",
        label: "Max Tokens",
        type: "text",
        placeholder: "8192",
        defaultValue: "8192",
      },
    ] as VendorField[],
  },
  {
    id: "google",
    name: "Google AI (Gemini)",
    icon: Globe,
    color: "#4285F4",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "AIza••••••••••••••••" },
      {
        key: "default_model",
        label: "Default Model",
        type: "select",
        defaultValue: "gemini-1.5-pro",
        options: [
          { label: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
          { label: "Gemini 1.5 Flash", value: "gemini-1.5-flash" },
          { label: "Gemini 1.5 Flash-8B", value: "gemini-1.5-flash-8b" },
          { label: "Gemini 1.0 Pro", value: "gemini-1.0-pro" },
        ],
      },
    ] as VendorField[],
  },
  {
    id: "ollama",
    name: "Ollama (Self-hosted)",
    icon: Cpu,
    color: "#8B5CF6",
    fields: [
      { key: "base_url", label: "Base URL", type: "text", placeholder: "http://localhost:11434" },
      {
        key: "model",
        label: "Model",
        type: "select",
        defaultValue: "llama3:8b",
        options: [
          { label: "Llama 3 8B", value: "llama3:8b" },
          { label: "Llama 3 70B", value: "llama3:70b" },
          { label: "Mistral 7B", value: "mistral:7b" },
          { label: "Codellama 13B", value: "codellama:13b" },
          { label: "Phi-3", value: "phi3:latest" },
          { label: "Gemma 2B", value: "gemma:2b" },
        ],
      },
      { key: "enabled", label: "Enabled", type: "toggle", defaultValue: false },
    ] as VendorField[],
  },
];

const PAYMENT_VENDORS = [
  {
    id: "razorpay",
    name: "Razorpay",
    icon: CreditCard,
    color: "#0066FF",
    fields: [
      { key: "key_id", label: "Key ID", type: "text", placeholder: "rzp_live_••••••••••••" },
      { key: "key_secret", label: "Key Secret", type: "password", placeholder: "••••••••••••••••" },
      { key: "webhook_secret", label: "Webhook Secret", type: "password", placeholder: "••••••••••••••••" },
      {
        key: "mode",
        label: "Mode",
        type: "select",
        defaultValue: "TEST",
        options: [
          { label: "LIVE", value: "LIVE" },
          { label: "TEST", value: "TEST" },
        ],
      },
    ] as VendorField[],
  },
  {
    id: "payu",
    name: "PayU",
    icon: CreditCard,
    color: "#F97316",
    fields: [
      { key: "merchant_key", label: "Merchant Key", type: "text", placeholder: "Your merchant key" },
      { key: "merchant_salt", label: "Merchant Salt", type: "password", placeholder: "••••••••••••••••" },
      {
        key: "mode",
        label: "Mode",
        type: "select",
        defaultValue: "TEST",
        options: [
          { label: "LIVE", value: "LIVE" },
          { label: "TEST", value: "TEST" },
        ],
      },
    ] as VendorField[],
  },
];

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  icon: Icon,
  color,
  count,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  count: number;
}) {
  const [open, setOpen] = useState(true);
  return (
    <button
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
      style={{
        background: `${color}12`,
        border: `1px solid ${color}30`,
      }}
      onClick={() => setOpen((o) => !o)}
    >
      <Icon size={16} style={{ color }} />
      <span className="text-sm font-semibold text-white flex-1 text-left">{title}</span>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: `${color}20`, color }}>
        {count}
      </span>
      {open ? <ChevronUp size={14} style={{ color: "#475569" }} /> : <ChevronDown size={14} style={{ color: "#475569" }} />}
    </button>
  );
}

// ─── Vendor Accordion Item ───────────────────────────────────────────────────

function VendorItem({
  vendor,
}: {
  vendor: {
    id: string;
    name: string;
    icon: React.ElementType;
    color: string;
    fields: VendorField[];
  };
}) {
  const [open, setOpen] = useState(false);
  const Icon = vendor.icon;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 transition-colors duration-150"
        style={{ background: "transparent" }}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon size={14} style={{ color: vendor.color }} />
        <span className="text-xs font-medium text-white flex-1 text-left">{vendor.name}</span>
        {open ? <ChevronUp size={13} style={{ color: "#475569" }} /> : <ChevronDown size={13} style={{ color: "#475569" }} />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <VendorConfigForm vendorName={vendor.id} fields={vendor.fields} />
        </div>
      )}
    </div>
  );
}

// ─── Provider Selector ────────────────────────────────────────────────────────

function ProviderSelector() {
  const [active, setActive] = useState("razorpay");
  const [fallback, setFallback] = useState("payu");
  const [costMode, setCostMode] = useState("QUALITY");

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Payment Routing</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Active Provider</label>
          <select
            className="input select"
            value={active}
            onChange={(e) => setActive(e.target.value)}
          >
            <option value="razorpay">Razorpay</option>
            <option value="payu">PayU</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Fallback Provider</label>
          <select
            className="input select"
            value={fallback}
            onChange={(e) => setFallback(e.target.value)}
          >
            <option value="payu">PayU</option>
            <option value="razorpay">Razorpay</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>Cost Mode</label>
          <select
            className="input select"
            value={costMode}
            onChange={(e) => setCostMode(e.target.value)}
          >
            <option value="QUALITY">QUALITY</option>
            <option value="BALANCED">BALANCED</option>
            <option value="ECONOMY">ECONOMY</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <span style={{ color: "#22C55E" }}>
          {active === "razorpay" ? "Razorpay" : "PayU"} active · Falls back to {fallback === "razorpay" ? "Razorpay" : "PayU"} · {costMode} mode
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function APIVendorsPage() {
  return (
    <DashboardShell title="API Vendor Hub">
      <div className="space-y-6 animate-fade-in">
        <div className="text-xs" style={{ color: "#475569" }}>
          Configure third-party vendor credentials. Keys are encrypted at rest and masked in the UI.
        </div>

        {/* Communication */}
        <section>
          <div className="mb-3">
            <SectionHeader
              title="COMMUNICATION"
              icon={MessageSquare}
              color="#00D4FF"
              count={COMMUNICATION_VENDORS.length}
            />
          </div>
          <div className="space-y-2 pl-2">
            {COMMUNICATION_VENDORS.map((v) => (
              <VendorItem key={v.id} vendor={v} />
            ))}
          </div>
        </section>

        {/* LLM */}
        <section>
          <div className="mb-3">
            <SectionHeader
              title="LLM PROVIDERS"
              icon={Brain}
              color="#8B5CF6"
              count={LLM_VENDORS.length}
            />
          </div>
          <div className="space-y-2 pl-2">
            {LLM_VENDORS.map((v) => (
              <VendorItem key={v.id} vendor={v} />
            ))}
          </div>
        </section>

        {/* Payment */}
        <section>
          <div className="mb-3">
            <SectionHeader
              title="PAYMENT GATEWAYS"
              icon={CreditCard}
              color="#22C55E"
              count={PAYMENT_VENDORS.length}
            />
          </div>
          <div className="space-y-2 pl-2">
            {PAYMENT_VENDORS.map((v) => (
              <VendorItem key={v.id} vendor={v} />
            ))}
          </div>
          <div className="mt-3 pl-2">
            <ProviderSelector />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
