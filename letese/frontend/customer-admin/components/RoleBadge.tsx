"use client";
import React from "react";
import clsx from "clsx";

type Role = "admin" | "advocate" | "clerk" | "paralegal" | "intern";

const ROLE_CONFIG: Record<Role, { label: string; bg: string; border: string; text: string; dot: string }> = {
  admin: {
    label: "ADMIN",
    bg: "bg-purple-500/15",
    border: "border-purple-500/40",
    text: "text-purple-300",
    dot: "bg-purple-400",
  },
  advocate: {
    label: "ADVOCATE",
    bg: "bg-blue-500/15",
    border: "border-blue-500/40",
    text: "text-blue-300",
    dot: "bg-blue-400",
  },
  clerk: {
    label: "CLERK",
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/40",
    text: "text-cyan-300",
    dot: "bg-cyan-400",
  },
  paralegal: {
    label: "PARALEGAL",
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    text: "text-amber-300",
    dot: "bg-amber-400",
  },
  intern: {
    label: "INTERN",
    bg: "bg-gray-500/15",
    border: "border-gray-500/40",
    text: "text-gray-400",
    dot: "bg-gray-400",
  },
};

interface RoleBadgeProps {
  role: string;
  size?: "sm" | "md";
  onClick?: () => void;
  className?: string;
}

export default function RoleBadge({ role, size = "sm", onClick, className }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role as Role] ?? ROLE_CONFIG["intern"];
  const isInteractive = !!onClick;

  return (
    <button
      onClick={onClick}
      disabled={!isInteractive}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border font-medium uppercase tracking-wide transition-all",
        config.bg,
        config.border,
        config.text,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        isInteractive && "cursor-pointer hover:opacity-80 active:scale-95",
        !isInteractive && "cursor-default",
        className
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
      {config.label}
      {isInteractive && (
        <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </button>
  );
}
