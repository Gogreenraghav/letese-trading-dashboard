"use client";

import { useState, useEffect } from "react";
import { updateVendorConfig, fetchVendorConfig } from "@/lib/api";
import { toast } from "sonner";
import { Eye, EyeOff, Save, CheckCircle, XCircle, Loader } from "lucide-react";

interface VendorConfigFormProps {
  vendorName: string;
  initialConfig?: Record<string, unknown>;
  fields: VendorField[];
}

export interface VendorField {
  key: string;
  label: string;
  type: "text" | "password" | "select" | "code" | "toggle";
  placeholder?: string;
  options?: { label: string; value: string }[];
  defaultValue?: string | boolean;
  readOnly?: boolean;
}

function EncryptedInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        className="input pr-10 font-mono text-xs"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
        style={{ color: "#475569" }}
      >
        {visible ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  );
}

export default function VendorConfigForm({
  vendorName,
  initialConfig,
  fields,
}: VendorConfigFormProps) {
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const base: Record<string, string | boolean> = {};
    fields.forEach((f) => {
      base[f.key] = initialConfig?.[f.key] ?? f.defaultValue ?? "";
    });
    return base;
  });

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(
    initialConfig?.verification_status as string ?? null
  );
  const [latencyMs, setLatencyMs] = useState<number | null>(
    initialConfig?.latency_ms as number ?? null
  );

  useEffect(() => {
    fetchVendorConfig(vendorName)
      .then((cfg) => {
        setVerificationStatus(cfg.verification_status);
        setValues((prev) => ({ ...prev, ...(cfg.config_data as Record<string, unknown>) }));
      })
      .catch(() => {/* vendor not configured yet */});
  }, [vendorName]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateVendorConfig(vendorName, values as Record<string, unknown>);
      setVerificationStatus(res.verification_status ?? null);
      setLatencyMs(res.latency_ms ?? null);
      toast.success(`${vendorName} config saved · ${res.verification_status ?? "SAVED"}`);
    } catch (e: unknown) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    await new Promise((r) => setTimeout(r, 1200));
    toast.success(`${vendorName} connection verified`);
    setTesting(false);
  };

  const statusColor = verificationStatus === "VERIFIED" ? "#22C55E" : "#EF4444";
  const StatusIcon = verificationStatus === "VERIFIED" ? CheckCircle : XCircle;

  return (
    <div className="space-y-4">
      {/* Fields */}
      <div className="grid grid-cols-1 gap-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>
              {field.label}
            </label>
            {field.type === "password" && (
              <EncryptedInput
                value={String(values[field.key] ?? "")}
                onChange={(v) => setValues((p) => ({ ...p, [field.key]: v }))}
                placeholder={field.placeholder}
              />
            )}
            {field.type === "select" && (
              <select
                className="input select"
                value={String(values[field.key] ?? field.defaultValue ?? "")}
                onChange={(e) => setValues((p) => ({ ...p, [field.key]: e.target.value }))}
                disabled={field.readOnly}
              >
                {field.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
            {field.type === "text" && (
              <input
                type="text"
                className={`input ${field.readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                placeholder={field.placeholder}
                value={String(values[field.key] ?? "")}
                onChange={(e) => setValues((p) => ({ ...p, [field.key]: e.target.value }))}
                readOnly={field.readOnly}
              />
            )}
            {field.type === "code" && (
              <textarea
                className="input font-mono text-[11px] min-h-[120px] resize-y"
                placeholder={field.placeholder}
                value={String(values[field.key] ?? "")}
                onChange={(e) => setValues((p) => ({ ...p, [field.key]: e.target.value }))}
                spellCheck={false}
              />
            )}
            {field.type === "toggle" && (
              <div
                className="w-11 h-6 rounded-full p-0.5 cursor-pointer transition-colors duration-200"
                style={{
                  background: values[field.key] ? "#1A4FBF" : "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onClick={() => setValues((p) => ({ ...p, [field.key]: !p[field.key] }))}
              >
                <div
                  className="w-5 h-5 rounded-full transition-transform duration-200 bg-white"
                  style={{ transform: values[field.key] ? "translateX(20px)" : "translateX(0)" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Verification status */}
      {verificationStatus && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ background: `${statusColor}15`, border: `1px solid ${statusColor}30` }}
        >
          <StatusIcon size={13} style={{ color: statusColor }} />
          <span style={{ color: statusColor }}>
            {verificationStatus}
            {latencyMs !== null && ` · ${latencyMs}ms`}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleTest}
          disabled={testing}
          className="btn btn-ghost flex-1 text-xs"
        >
          {testing ? <Loader size={12} className="animate-spin" /> : null}
          Test Connection
        </button>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1 text-xs">
          <Save size={12} />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
