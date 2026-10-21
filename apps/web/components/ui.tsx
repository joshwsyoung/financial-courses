import Link from "next/link";
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-border bg-card p-5 ${className}`}>{children}</section>;
}

export function ProgressBar({ value, label, tone = "accent" }: { value: number; label: string; tone?: "accent" | "good" | "warn" | "bad" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  const color = { accent: "bg-accent", good: "bg-good", warn: "bg-warn", bad: "bg-bad" }[tone];
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-2.5 w-full overflow-hidden rounded-full bg-border">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" | "good" | "warn" | "bad" }) {
  const cls = {
    muted: "bg-border/60 text-muted",
    accent: "bg-accent-soft text-accent",
    good: "bg-good-soft text-good",
    warn: "bg-warn-soft text-warn",
    bad: "bg-bad-soft text-bad",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{children}</span>;
}

export function ButtonLink({ href, children, variant = "primary", className = "" }: { href: string; children: ReactNode; variant?: "primary" | "secondary"; className?: string }) {
  const v = variant === "primary" ? "bg-accent text-accent-fg hover:opacity-90" : "border border-border bg-card hover:bg-accent-soft";
  return (
    <Link href={href} className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 font-medium ${v} ${className}`}>
      {children}
    </Link>
  );
}

export const buttonClass = {
  primary: "inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-fg hover:opacity-90 disabled:opacity-40",
  secondary: "inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2.5 font-medium hover:bg-accent-soft disabled:opacity-40",
};

export function StatusBadge({ status, origin }: { status: string; origin?: string }) {
  if (status === "published") return null;
  const who = origin && origin !== "human" ? "AI draft" : "Draft";
  return <Badge tone="warn">{who} · awaiting expert review</Badge>;
}

export function TaskTypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    read: "Read", eli5: "Explain like I'm five", diagram: "Diagram", video: "Video", audio: "Listen",
    worked_example: "Worked example", question: "Question", flashcard: "Flashcard", calc_drill: "Calc drill", teach_back: "Teach back", memory_aid: "Memory aid",
  };
  return <span className="text-xs font-semibold uppercase tracking-wide text-muted">{labels[type] ?? type}</span>;
}
