"use client";
import React, { useState } from "react";
import { Invoice, billingApi } from "@/lib/api";
import { format } from "date-fns";
import { Download, Send, Loader2 } from "lucide-react";
import clsx from "clsx";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  paid: { label: "Paid", color: "text-neon-green", bg: "bg-neon-green/15 border-neon-green/40" },
  pending: { label: "Pending", color: "text-neon-amber", bg: "bg-neon-amber/15 border-neon-amber/40" },
  partial: { label: "Partial", color: "text-blue-300", bg: "bg-blue-500/15 border-blue-500/40" },
  overdue: { label: "Overdue", color: "text-red-400", bg: "bg-red-500/15 border-red-500/40" },
  failed: { label: "Failed", color: "text-red-400", bg: "bg-red-500/15 border-red-500/40" },
};

interface InvoiceTableProps {
  invoices: Invoice[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function InvoiceTable({ invoices, onRefresh, onSuccess, onError }: InvoiceTableProps) {
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleDownload = async (invoice: Invoice) => {
    try {
      const token = localStorage.getItem("letese_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.letese.xyz"}/api/v1/invoices/${invoice.invoice_id}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      onError("Failed to download PDF");
    }
  };

  const handleSend = async (invoice: Invoice) => {
    setSendingId(invoice.invoice_id);
    try {
      await billingApi.sendInvoice(invoice.invoice_id);
      onSuccess(`Invoice sent to ${invoice.client_name}`);
    } catch {
      onError("Failed to send invoice");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-glass-border bg-glass-bg shadow-glass overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-glass-border">
            {["Invoice #", "Client", "Amount", "Status", "Due Date", "Actions"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {invoices.map(inv => {
            const status = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG["pending"];
            return (
              <tr key={inv.invoice_id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3.5">
                  <span className="text-sm font-mono text-white/80">{inv.invoice_number}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-white">{inv.client_name}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm font-mono font-medium text-white">
                    ₹{inv.total_inr.toLocaleString("en-IN")}
                  </span>
                  {inv.paid_inr > 0 && inv.paid_inr < inv.total_inr && (
                    <div className="text-[10px] text-white/30 font-mono mt-0.5">
                      ₹{inv.paid_inr.toLocaleString("en-IN")} paid
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span className={clsx(
                    "inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border",
                    status.color, status.bg
                  )}>
                    {status.label}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-white/50">
                    {format(new Date(inv.due_date), "dd MMM yyyy")}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(inv)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:text-white hover:bg-white/[0.07] transition-all"
                    >
                      <Download className="w-3 h-3" />
                      PDF
                    </button>
                    {inv.status !== "paid" && (
                      <button
                        onClick={() => handleSend(inv)}
                        disabled={sendingId === inv.invoice_id}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand/20 border border-brand/40 text-xs text-neon-cyan hover:bg-brand/30 transition-all disabled:opacity-50"
                      >
                        {sendingId === inv.invoice_id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Send className="w-3 h-3" />
                        }
                        Send
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {invoices.length === 0 && (
        <div className="py-16 text-center text-white/30 text-sm">
          No invoices yet. Create one from the Cases page.
        </div>
      )}
    </div>
  );
}
