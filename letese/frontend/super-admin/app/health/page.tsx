"use client";

import DashboardShell from "@/components/DashboardShell";
import SystemHealthMatrix from "@/components/SystemHealthMatrix";

export default function HealthPage() {
  return (
    <DashboardShell title="System Health">
      <SystemHealthMatrix />
    </DashboardShell>
  );
}
