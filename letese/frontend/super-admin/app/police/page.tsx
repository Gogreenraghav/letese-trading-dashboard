"use client";

import DashboardShell from "@/components/DashboardShell";
import PoliceFeed from "@/components/PoliceFeed";

export default function PolicePage() {
  const demoAlerts = [
    { id: "1", severity: "P2" as const, message: "Scraper pod crashed on tenant-a3f2: scraper-2", created_at: new Date(Date.now() - 5 * 60_000).toISOString() },
    { id: "2", severity: "P3" as const, message: "Kafka consumer lag elevated: letese.communications.dispatch (lag: 23)", created_at: new Date(Date.now() - 12 * 60_000).toISOString() },
    { id: "3", severity: "P1" as const, message: "WhatsApp API rate limit hit — 360dialog account throttled", created_at: new Date(Date.now() - 3 * 60_000).toISOString() },
  ];

  const demoDLQ = {
    "letese.scraper.jobs": 0,
    "letese.diary.updates": 0,
    "letese.communications.dispatch": 12,
  };

  const demoAutoFixes = [
    { timestamp: new Date(Date.now() - 8 * 60_000).toISOString(), action: "Auto-restarted scraper pod", target: "scraper-1" },
    { timestamp: new Date(Date.now() - 25 * 60_000).toISOString(), action: "Corrected WhatsApp template mapping", target: "tenant-b4c1" },
    { timestamp: new Date(Date.now() - 60 * 60_000).toISOString(), action: "Retried failed Kafka message", target: "letese.diary.updates" },
  ];

  return (
    <DashboardShell title="Digital Police Console">
      <PoliceFeed
        initialAlerts={demoAlerts}
        initialDLQ={demoDLQ}
        initialAutoFixes={demoAutoFixes}
      />
    </DashboardShell>
  );
}
