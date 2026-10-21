"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { moduleState } from "@/lib/derive";
import { useProgress } from "@/lib/progress";
import type { CourseIndex, OutcomeRow } from "@/lib/types";
import { Badge, ProgressBar } from "./ui";

/** What each command word asks of the learner, from easiest to hardest. */
export const COMMAND_WORDS: { words: string[]; level: string; meaning: string }[] = [
  { words: ["identify", "define", "classify"], level: "Know it", meaning: "Recognise or state it correctly." },
  { words: ["describe", "explain"], level: "Understand it", meaning: "Say what it is and why or how it works." },
  { words: ["distinguish", "differentiate", "compare", "contrast"], level: "Tell things apart", meaning: "Spot the differences and similarities." },
  { words: ["calculate", "interpret", "determine"], level: "Work it out", meaning: "Do the numbers and say what they mean." },
  { words: ["apply", "analyse", "evaluate", "critically evaluate", "select"], level: "Use it", meaning: "Apply it to a scenario and judge the best answer." },
];

const verbTone = (v: string) => {
  const i = COMMAND_WORDS.findIndex((c) => c.words.includes(v));
  return (["muted", "muted", "accent", "warn", "good"] as const)[i] ?? "muted";
};

export function VerbBadges({ verbs }: { verbs: string[] }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {verbs.map((v) => <Badge key={v} tone={verbTone(v)}>{v[0]!.toUpperCase() + v.slice(1)}</Badge>)}
    </span>
  );
}

function OutcomeItem({ o, focused, mastery }: { o: OutcomeRow; focused: boolean; mastery?: number }) {
  const covered = o.covered.tasks.length > 0 || o.covered.questions > 0;
  return (
    <li
      id={`lo-${o.id}`}
      className={`scroll-mt-28 rounded-lg border p-3 transition-colors target:border-accent target:bg-accent-soft ${focused ? "border-accent bg-accent-soft" : "border-border bg-card"}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <a href={`#lo-${o.id}`} className="font-mono text-sm font-semibold text-accent">{o.id}</a>
        <VerbBadges verbs={o.verbs} />
        {!covered && <Badge>Not covered yet</Badge>}
        {mastery !== undefined && <span className="ml-auto text-xs text-muted">Your mastery {Math.round(mastery)}%</span>}
      </div>
      <p className="mt-1">{o.summary}</p>
      {covered && (
        <p className="mt-1 text-sm text-muted">
          Covered in:{" "}
          {o.covered.tasks.map((t, i) => (
            <span key={t.href}>{i ? ", " : ""}<Link href={t.href} className="underline">{t.title}</Link></span>
          ))}
          {o.covered.questions > 0 && <> · {o.covered.questions} practice question{o.covered.questions === 1 ? "" : "s"}</>}
        </p>
      )}
    </li>
  );
}

export function SyllabusExplorer({ course }: { course: CourseIndex }) {
  const params = useSearchParams();
  const p = useProgress();
  const focus = useMemo(() => new Set((params.get("focus") ?? "").split(",").filter(Boolean)), [params]);
  const [query, setQuery] = useState("");
  const [onlyGaps, setOnlyGaps] = useState(false);
  const [unit, setUnit] = useState<string>(() => {
    const first = [...focus][0];
    return first && Number(first.split(".")[0]) >= 7 ? "unit2" : "unit1";
  });

  useEffect(() => {
    const first = [...focus][0];
    if (first) document.getElementById(`lo-${first}`)?.scrollIntoView({ block: "center" });
  }, [focus, unit]);

  const q = query.trim().toLowerCase();
  const visible = (o: OutcomeRow) =>
    o.unit === unit &&
    (!onlyGaps || (o.covered.tasks.length === 0 && o.covered.questions === 0)) &&
    (!q || o.id.startsWith(q) || o.summary.toLowerCase().includes(q) || o.verbs.some((v) => v.includes(q)));

  const sectionTitle = (id: string) => course.syllabus.sections.find((s) => s.id === id)?.title ?? id;
  const unitInfo = course.syllabus.units.find((u) => u.id === unit)!;

  return (
    <div className="space-y-6">
      {focus.size > 0 && (
        <p className="rounded-lg border border-accent bg-accent-soft p-3 text-sm" role="status">
          Highlighted: the {focus.size === 1 ? "outcome" : `${focus.size} outcomes`} this lesson covers ({[...focus].join(", ")}).
        </p>
      )}

      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer font-semibold">What the command words mean</summary>
        <p className="mt-2 text-sm text-muted">Each outcome starts with a command word. It tells you how deep the exam expects you to go.</p>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {COMMAND_WORDS.map((c) => (
            <div key={c.level} className="rounded-lg border border-border p-3">
              <dt className="font-medium">{c.level}</dt>
              <dd className="text-sm text-muted">{c.meaning}</dd>
              <dd className="mt-1"><VerbBadges verbs={c.words} /></dd>
            </div>
          ))}
        </dl>
      </details>

      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Unit" className="flex gap-1 rounded-lg border border-border p-1">
          {course.syllabus.units.map((u) => (
            <button key={u.id} role="tab" aria-selected={unit === u.id} onClick={() => setUnit(u.id)}
              className={`rounded-md px-3 py-1.5 text-sm ${unit === u.id ? "bg-accent text-accent-fg" : ""}`}>
              {u.id === "unit1" ? "Unit 1" : "Unit 2"}: {u.name}
            </button>
          ))}
        </div>
        <input type="search" placeholder="Search outcomes, e.g. 3.5 or suitability" aria-label="Search outcomes"
          value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyGaps} onChange={(e) => setOnlyGaps(e.target.checked)} /> Only show gaps
        </label>
      </div>

      <p className="text-sm text-muted">
        {unitInfo.questions} questions in {unitInfo.duration_min} minutes · about {unitInfo.recommended_hours} study hours ·{" "}
        <a href={course.syllabus.official_url} className="underline" target="_blank" rel="noopener noreferrer">
          Read CFA UK&rsquo;s exact wording ({unitInfo.official_doc}) ↗
        </a>
      </p>

      {course.syllabus.areas.filter((a) => a.unit === unit).map((area) => (
        <section key={area.id} className="space-y-4">
          <h2 className="flex flex-wrap items-baseline gap-2 text-xl font-semibold">
            {area.name}
            <span className="text-sm font-normal text-muted">about {area.questions[0]}–{area.questions[1]} exam questions</span>
          </h2>
          {course.syllabus.topics.filter((t) => t.area === area.id).map((topic) => {
            const all = course.outcomes.filter((o) => o.topic === topic.id);
            const shown = all.filter(visible);
            const coveredCount = all.filter((o) => o.covered.tasks.length || o.covered.questions).length;
            const stage = course.stages.find((s) => s.topic === topic.id);
            if (!shown.length && (q || onlyGaps)) return null;
            const sections = [...new Set(shown.map((o) => o.section))];
            return (
              <div key={topic.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">Topic {topic.number}: {topic.name}</h3>
                  {stage && <Link href={`/learn/${stage.id}/`} className="text-sm underline">Go to the lessons</Link>}
                </div>
                <div className="mt-2 flex items-center gap-3 text-sm text-muted">
                  <div className="w-40"><ProgressBar value={coveredCount / all.length} label={`Topic ${topic.number} coverage`} tone="good" /></div>
                  {coveredCount} of {all.length} outcomes covered by the course so far
                  {stage && stage.modules.every((m) => moduleState(p, m).complete) && <Badge tone="good">You&rsquo;ve completed this stage</Badge>}
                </div>
                {sections.map((sid) => {
                  const rows = shown.filter((o) => o.section === sid);
                  let lastGroup: string | undefined;
                  return (
                    <div key={sid} className="mt-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted">{sid} {sectionTitle(sid)}</h4>
                      <ul className="mt-2 space-y-2">
                        {rows.map((o) => {
                          const heading = o.group && o.group !== lastGroup ? o.group : null;
                          lastGroup = o.group;
                          return (
                            <div key={o.id}>
                              {heading && <p className="mb-1 mt-3 text-sm font-medium italic">{heading}</p>}
                              <OutcomeItem o={o} focused={focus.has(o.id)} mastery={p.mastery[o.id]} />
                            </div>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
