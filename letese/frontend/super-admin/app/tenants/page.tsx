"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import TenantCard from "@/components/TenantCard";
import { fetchTenants, createTenant, updateTenant, impersonateTenant } from "@/lib/api";
import type { Tenant, TenantCreatePayload } from "@/lib/api";
import { toast } from "sonner";
import {
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";

const PLANS = ["basic", "professional", "elite", "enterprise"];
const PAGE_SIZE = 50;

interface CreateForm {
  name: string;
  email: string;
  phone: string;
  plan: string;
  bar_enrolment_no: string;
  gstin: string;
}

const emptyForm: CreateForm = {
  name: "",
  email: "",
  phone: "",
  plan: "basic",
  bar_enrolment_no: "",
  gstin: "",
};

const PLAN_BADGE: Record<string, string> = {
  basic: "badge-plan-basic",
  professional: "badge-plan-professional",
  elite: "badge-plan-elite",
  enterprise: "badge-plan-enterprise",
};

const STATUS_BADGE: Record<string, string> = {
  active: "badge-active",
  suspended: "badge-suspended",
  trial: "badge-trial",
};

function UpgradeModal({
  tenant,
  onClose,
  onSave,
}: {
  tenant: Tenant;
  onClose: () => void;
  onSave: (id: string, plan: string) => Promise<void>;
}) {
  const [plan, setPlan] = useState(tenant.plan);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(tenant.tenant_id, plan);
      toast.success(`Upgraded ${tenant.name} to ${plan}`);
      onClose();
    } catch (e: unknown) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white">Upgrade Tenant</h3>
          <button onClick={onClose} className="btn btn-ghost p-1">
            <X size={16} />
          </button>
        </div>
        <div className="mb-4 text-sm" style={{ color: "#94A3B8" }}>
          Upgrading: <span className="text-white font-medium">{tenant.name}</span>
        </div>
        <div className="mb-5">
          <label className="block text-xs font-medium mb-2" style={{ color: "#94A3B8" }}>
            New Plan
          </label>
          <select
            className="input select"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            {PLANS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1">
            {saving ? "Saving..." : "Upgrade"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateTenantModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: TenantCreatePayload) => Promise<void>;
}) {
  const [form, setForm] = useState<CreateForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateForm>>({});

  const validate = () => {
    const errs: Partial<CreateForm> = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = "Valid email required";
    if (!form.phone.match(/^\+?[0-9]{10,13}$/)) errs.phone = "Valid phone required";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        name: form.name,
        email: form.email,
        phone: form.phone,
        plan: form.plan,
        bar_enrolment_no: form.bar_enrolment_no || undefined,
        gstin: form.gstin || undefined,
      });
      toast.success("Tenant created successfully");
      onClose();
    } catch (e: unknown) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof CreateForm, label: string, placeholder: string, required = false) => (
    <div key={key}>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      <input
        className="input"
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => {
          setForm((f) => ({ ...f, [key]: e.target.value }));
          setErrors((er) => ({ ...er, [key]: undefined }));
        }}
      />
      {errors[key] && (
        <p className="text-[11px] mt-1" style={{ color: "#EF4444" }}>
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white">Create New Tenant</h3>
          <button onClick={onClose} className="btn btn-ghost p-1">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4">
          {field("name", "Firm / Lawyer Name", "Ravi Sharma & Associates", true)}
          {field("email", "Admin Email", "ravi@lawfirm.in", true)}
          {field("phone", "Phone", "+919876543210", true)}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#94A3B8" }}>
              Plan <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <select
              className="input select"
              value={form.plan}
              onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
            >
              {PLANS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {field("bar_enrolment_no", "Bar Enrolment No.", "D/1234/2015")}
          {field("gstin", "GSTIN", "06AAACH1234H1ZX")}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="btn btn-primary flex-1">
            {saving ? "Creating..." : "Create Tenant"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImpersonateModal({
  tenant,
  token,
  onClose,
}: {
  tenant: Tenant;
  token: string;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <CheckCircle size={16} style={{ color: "#22C55E" }} />
            Impersonation Token
          </h3>
          <button onClick={onClose} className="btn btn-ghost p-1">
            <X size={16} />
          </button>
        </div>
        <div className="mb-3 text-sm" style={{ color: "#94A3B8" }}>
          Scoped read-only JWT for tenant:{" "}
          <span className="text-white font-medium">{tenant.name}</span>
        </div>
        <div className="p-3 rounded-lg mb-4 flex items-center gap-2" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <code className="flex-1 text-[11px] mono break-all" style={{ color: "#00D4FF" }}>
            {visible ? token : "•".repeat(Math.min(token.length, 60))}
          </code>
          <button
            onClick={() => setVisible((v) => !v)}
            className="btn btn-ghost p-1 shrink-0"
          >
            {visible ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText(token);
              toast.success("Token copied!");
            }}
            className="btn btn-primary flex-1"
          >
            <Copy size={12} />
            Copy Token
          </button>
          <button onClick={onClose} className="btn btn-ghost flex-1">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [upgradeTenant, setUpgradeTenant] = useState<Tenant | null>(null);
  const [impersonate, setImpersonate] = useState<{ tenant: Tenant; token: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTenants({ limit: 500 });
      setTenants(res.tenants);
      setTotal(res.tenants.length);
    } catch (e: unknown) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.tenant_id.includes(search)
  );

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const handleSuspend = async (id: string) => {
    try {
      await updateTenant(id, { status: "suspended" });
      toast.success("Tenant suspended");
      load();
    } catch (e: unknown) {
      toast.error(String(e));
    }
  };

  const handleUpgrade = async (id: string, plan: string) => {
    await updateTenant(id, { plan });
    load();
  };

  const handleImpersonate = async (id: string) => {
    try {
      const res = await impersonateTenant(id);
      const tenant = tenants.find((t) => t.tenant_id === id);
      if (tenant) setImpersonate({ tenant, token: res.token });
    } catch (e: unknown) {
      toast.error(String(e));
    }
  };

  const handleCreate = async (data: TenantCreatePayload) => {
    await createTenant(data);
    load();
  };

  return (
    <DashboardShell
      title="Tenant Management"
      actions={
        <button onClick={() => setShowCreate(true)} className="btn btn-primary text-xs">
          <Plus size={13} />
          New Tenant
        </button>
      }
    >
      <div className="space-y-4 animate-fade-in">
        {/* Search + count */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
            <input
              className="input pl-9"
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <span className="text-xs" style={{ color: "#475569" }}>
            {filtered.length} tenant{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table view */}
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant ID</th>
                <th>Name</th>
                <th>Plan</th>
                <th>Cases</th>
                <th>Storage (GB)</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j}>
                          <div className="h-4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)", width: j === 0 ? 160 : 60 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : paginated.map((t) => (
                    <tr key={t.tenant_id}>
                      <td>
                        <code className="mono" style={{ color: "#475569" }}>
                          {t.tenant_id.slice(0, 8)}...
                        </code>
                      </td>
                      <td>
                        <div className="font-medium text-white">{t.name}</div>
                        <div className="text-[10px]" style={{ color: "#475569" }}>{t.email}</div>
                      </td>
                      <td>
                        <span className={`badge ${PLAN_BADGE[t.plan] || "badge-plan-basic"}`}>
                          {t.plan}
                        </span>
                      </td>
                      <td>{t.cases_active_count}</td>
                      <td>{t.storage_gb}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[t.status] || "badge-active"}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ color: "#475569", fontSize: 12 }}>
                        {new Date(t.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {t.status !== "suspended" ? (
                            <button
                              onClick={() => handleSuspend(t.tenant_id)}
                              className="btn btn-danger text-[10px] px-2 py-1"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpgrade(t.tenant_id, t.plan === "basic" ? "professional" : t.plan)}
                              className="btn btn-success text-[10px] px-2 py-1"
                            >
                              Reactivate
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const found = tenants.find((t2) => t2.tenant_id === t.tenant_id);
                              if (found) handleImpersonate(t.tenant_id);
                            }}
                            className="btn btn-primary text-[10px] px-2 py-1"
                          >
                            Impersonate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <span className="text-xs" style={{ color: "#475569" }}>
                Page {page} of {totalPages} · {filtered.length} total
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-ghost text-xs"
                >
                  <ChevronLeft size={12} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-ghost text-xs"
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateTenantModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
      {upgradeTenant && (
        <UpgradeModal
          tenant={upgradeTenant}
          onClose={() => setUpgradeTenant(null)}
          onSave={handleUpgrade}
        />
      )}
      {impersonate && (
        <ImpersonateModal
          tenant={impersonate.tenant}
          token={impersonate.token}
          onClose={() => setImpersonate(null)}
        />
      )}
    </DashboardShell>
  );
}
