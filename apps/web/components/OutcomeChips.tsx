import Link from "next/link";
import { syllabusHref } from "@/lib/derive";
import type { OutcomeRow } from "@/lib/types";

/** Official outcome numbers for a lesson or question, linking to the highlighted syllabus. */
export function OutcomeChips({ outcomes, label = "Syllabus" }: { outcomes: Pick<OutcomeRow, "id" | "summary" | "verbs">[]; label?: string }) {
  if (!outcomes.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-muted">{label}:</span>
      {outcomes.map((o) => (
        <Link
          key={o.id}
          href={syllabusHref([o.id])}
          title={`${o.verbs.join(", ")}: ${o.summary}`}
          className="rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 font-mono text-accent hover:border-accent"
        >
          {o.id}
        </Link>
      ))}
      {outcomes.length > 1 && (
        <Link href={syllabusHref(outcomes.map((o) => o.id))} className="text-muted underline">see all in syllabus</Link>
      )}
    </div>
  );
}
