"use client";

import Link from "next/link";
import { useState } from "react";
import { actions, useProgress } from "@/lib/progress";
import type { CourseIndex } from "@/lib/types";
import { Badge, buttonClass, Card } from "./ui";

const SCHEDULE = [
  ["Diagnostic (30 AI questions, untimed)", "Before Stage 1", "Baseline per topic"],
  ["Stage tests", "End of each stage", "Cumulative check, spaced review"],
  ["AI mock A (timed)", "About 50% through", "Practise pacing and formats"],
  ["Official mock 1", "About 75% through", "First calibration against the real thing"],
  ["Gap review", "After each mock", "Targeted drills on weak outcomes"],
  ["AI mocks B and C (timed)", "Final 2 to 3 weeks", "Stamina and fixing gaps"],
  ["Official mock 2", "5 to 7 days before the exam", "Final readiness check; don't use it earlier"],
  ["Light review only", "Last 2 days", "No new topics"],
];

function ScoreForm({ paperId, unit }: { paperId: string; unit: string }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [percent, setPercent] = useState("");
  if (!open) return <button className="text-sm underline" onClick={() => setOpen(true)}>Enter your score</button>;
  const pct = Number(percent);
  return (
    <form
      className="mt-2 flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!(pct >= 0 && pct <= 100)) return;
        actions.addMock({ paperId, kind: "official", unit, date, percent: pct, timed: true });
        setOpen(false);
        setPercent("");
      }}
    >
      <label className="text-sm">Date<input type="date" className="mt-1 block rounded border border-border bg-bg px-2 py-1" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
      <label className="text-sm">Score %<input type="number" min={0} max={100} className="mt-1 block w-24 rounded border border-border bg-bg px-2 py-1" value={percent} onChange={(e) => setPercent(e.target.value)} required /></label>
      <button className={buttonClass.primary} type="submit">Save</button>
    </form>
  );
}

export function Papers({ course }: { course: CourseIndex }) {
  const p = useProgress();
  return (
    <div className="space-y-8">
      {course.syllabus.units.map((u) => (
        <section key={u.id} className="space-y-3">
          <h2 className="text-xl font-semibold">{u.name}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {course.officialPapers.filter((x) => x.unit === u.id && x.current).map((paper) => {
              const scores = p.mocks.filter((m) => m.paperId === paper.id);
              return (
                <Card key={paper.id} className="space-y-2">
                  <Badge tone="accent">Official · CFA UK</Badge>
                  <h3 className="font-semibold">{paper.title}</h3>
                  {paper.note && <p className="text-sm text-muted">{paper.note}</p>}
                  <a href={paper.url} className="inline-block text-sm underline" target="_blank" rel="noopener noreferrer">Open on the CFA UK site (we never host official papers)</a>
                  {scores.map((s) => (
                    <p key={s.id} className="text-sm">{s.date}: <strong>{s.percent}%</strong> <button className="ml-2 text-xs text-muted underline" onClick={() => actions.removeMock(s.id)}>remove</button></p>
                  ))}
                  <ScoreForm paperId={paper.id} unit={u.id} />
                </Card>
              );
            })}
            <Card className="space-y-2">
              <Badge tone="warn">AI-generated, unofficial</Badge>
              <h3 className="font-semibold">Practice mock from the current question bank</h3>
              <p className="text-sm text-muted">
                Timed at the real exam&rsquo;s pace. Full AI mock papers (5 or more per unit) are on the roadmap; until then this draws from every published question for this unit.
              </p>
              {p.mocks.filter((m) => m.paperId === `practice-${u.id}`).slice(-3).map((s) => (
                <p key={s.id} className="text-sm">{s.date}: <strong>{s.percent}%</strong></p>
              ))}
              {Object.values(course.questions).some((q) => q.unit === u.id) ? (
                <Link href={`/papers/practice/${u.id}/`} className={buttonClass.primary}>Start</Link>
              ) : (
                <p className="text-sm text-muted">No questions for this unit yet.</p>
              )}
            </Card>
          </div>
        </section>
      ))}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">When to take papers</h2>
        <p className="text-sm text-muted">Only two official mocks exist per unit, and they are the best calibration, so save them. Aim for roughly 75 to 80% on official mocks before the live exam.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead><tr className="text-left"><th className="py-2 pr-3">Paper</th><th className="py-2 pr-3">When</th><th className="py-2">Why</th></tr></thead>
            <tbody>
              {SCHEDULE.map(([a, b, c]) => (
                <tr key={a} className="border-t border-border"><td className="py-2 pr-3 font-medium">{a}</td><td className="py-2 pr-3">{b}</td><td className="py-2 text-muted">{c}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
