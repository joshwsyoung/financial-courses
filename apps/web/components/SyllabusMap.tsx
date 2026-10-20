"use client";

import Link from "next/link";
import { moduleState, stageState } from "@/lib/derive";
import { useProgress } from "@/lib/progress";
import type { CourseIndex } from "@/lib/types";
import { Badge } from "./ui";

export function SyllabusMap({ course }: { course: CourseIndex }) {
  const p = useProgress();
  return (
    <div className="space-y-8">
      {course.syllabus.units.map((u) => (
        <section key={u.id}>
          <h2 className="text-xl font-semibold">{u.name}</h2>
          <p className="text-sm text-muted">{u.questions} questions · {u.duration_min} minutes · about {u.recommended_hours} study hours</p>
          <ul className="mt-3 space-y-3">
            {course.syllabus.topics.filter((t) => t.unit === u.id).map((t) => {
              const stage = course.stages.find((s) => s.topic === t.id);
              const ss = stage ? stageState(p, stage) : null;
              const los = course.syllabus.los.filter((l) => l.topic === t.id);
              return (
                <li key={t.id} className={`rounded-xl border p-4 ${ss?.complete ? "border-good bg-good-soft" : "border-border bg-card"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {stage ? <Link href={`/learn/${stage.id}/`} className="font-semibold underline">{t.name}</Link> : <span className="font-semibold text-muted">{t.name}</span>}
                    {ss?.complete ? <Badge tone="good">Stage passed</Badge> : stage ? <Badge tone="accent">Available</Badge> : <Badge>Not written yet</Badge>}
                  </div>
                  {stage && (
                    <ul className="mt-2 space-y-1 pl-4 text-sm">
                      {stage.modules.map((m) => {
                        const ms = moduleState(p, m);
                        return (
                          <li key={m.id} className="flex items-center gap-2">
                            <span aria-hidden className={ms.complete ? "text-good" : ms.done ? "text-warn" : "text-muted"}>●</span>
                            <Link href={`/learn/${stage.id}/${m.id}/`} className="underline">{m.title}</Link>
                            <span className="text-muted">{ms.complete ? "complete" : `${ms.done}/${ms.total}`}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <details className="mt-2 text-sm">
                    <summary className="cursor-pointer text-muted">{los.length} learning outcome{los.length === 1 ? "" : "s"}</summary>
                    <ul className="mt-1 space-y-1 pl-4">
                      {los.map((l) => (
                        <li key={l.id}><span className="text-muted">{l.id}</span> {l.summary} {!l.verified && <Badge tone="warn">provisional</Badge>}</li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
