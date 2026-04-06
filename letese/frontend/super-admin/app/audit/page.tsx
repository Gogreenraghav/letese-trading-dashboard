"use client";

import DashboardShell from "@/components/DashboardShell";
import AuditLogTable from "@/components/AuditLogTable";

export default function AuditPage() {
  return (
    <DashboardShell title="Audit Logs">
      <AuditLogTable />
    </DashboardShell>
  );
}
