"use client";

import Link from "next/link";
import { moduleState, stageState, taskHref } from "@/lib/derive";
import { useProgress } from "@/lib/progress";
import type { ModuleSummary, StageSummary } from "@/lib/types";
import { Badge, ButtonLink, ProgressBar, TaskTypeLabel } from "./ui";

export function ModuleTaskList({ stageId, module }: { stageId: string; module: ModuleSummary }) {
  const p = useProgress();
  const s = moduleState(p, module);
  const next = module.tasks.find((t) => p.tasks[t.id]?.status !== "done");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <ProgressBar value={s.done / s.total} label="Module progress" />
        <span className="text-sm text-muted">{s.done} of {s.total} tasks done</span>
        {next && <ButtonLink href={taskHref(stageId, module.id, next.id)}>{s.done ? "Continue" : "Start module"}</ButtonLink>}
      </div>
      <ol className="divide-y divide-border rounded-xl border border-border bg-card">
        {module.tasks.map((t, i) => {
          const st = p.tasks[t.id]?.status;
          return (
            <li key={t.id}>
              <Link href={taskHref(stageId, module.id, t.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-accent-soft/50">
                <span aria-hidden className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${st === "done" ? "bg-good text-white" : "border border-border"}`}>{st === "done" ? "✓" : i + 1}</span>
                <span className="flex-1">
                  <TaskTypeLabel type={t.type} />
                  <span className="block">{t.title}</span>
                </span>
                <span className="text-xs text-muted">{t.minutes} min{st === "skipped" ? " · skipped" : ""}{st === "done" ? <span className="sr-only"> · done</span> : ""}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <Link href={`/learn/${stageId}/${module.id}/test/`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent-soft/50">
            <span aria-hidden className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${s.testPassed ? "bg-good text-white" : "border border-border"}`}>{s.testPassed ? "✓" : "T"}</span>
            <span className="flex-1 font-medium">Module test · {module.test.count} questions · pass mark {Math.round(module.test.pass_mark * 100)}%</span>
            {s.best && <Badge tone={s.best.passed ? "good" : "muted"}>best {Math.round((s.best.score / s.best.total) * 100)}%</Badge>}
          </Link>
        </li>
      </ol>
    </div>
  );
}

export function StageModuleList({ stage }: { stage: StageSummary }) {
  const p = useProgress();
  const s = stageState(p, stage);
  return (
    <ol className="space-y-3">
      {stage.modules.map((m, i) => {
        const ms = s.modules[i]!;
        return (
          <li key={m.id}>
            <Link href={`/learn/${stage.id}/${m.id}/`} className="block rounded-xl border border-border bg-card p-4 hover:bg-accent-soft/50">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">Module {i + 1}: {m.title}</span>
                {ms.complete ? <Badge tone="good">Complete</Badge> : <span className="text-sm text-muted">{ms.done}/{ms.total} tasks</span>}
              </div>
              <p className="mt-1 text-sm text-muted">{m.summary}</p>
              <div className="mt-2"><ProgressBar value={ms.done / ms.total} label={`${m.title} progress`} /></div>
            </Link>
          </li>
        );
      })}
      <li>
        <Link href={`/learn/${stage.id}/test/`} className="block rounded-xl border border-dashed border-border p-4 hover:bg-accent-soft/50">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Stage test (cumulative) · pass mark {Math.round(stage.test.pass_mark * 100)}%</span>
            {s.best ? <Badge tone={s.best.passed ? "good" : "muted"}>best {Math.round((s.best.score / s.best.total) * 100)}%</Badge> : !s.modulesComplete && <span className="text-sm text-muted">Finish the modules first (recommended)</span>}
          </div>
        </Link>
      </li>
    </ol>
  );
}
