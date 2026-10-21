"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { actions, useProgress } from "@/lib/progress";
import type { ClientQuestion, OutcomeRow, TaskDetail } from "@/lib/types";
import { CalcDrill } from "./CalcDrill";
import { FeedbackButton } from "./Feedback";
import { MemoryAid } from "./MemoryAid";
import { OutcomeChips } from "./OutcomeChips";
import { PracticeQuestion } from "./Question";
import { buttonClass, ProgressBar, TaskTypeLabel } from "./ui";

interface Props {
  task: TaskDetail;
  outcomes: Pick<OutcomeRow, "id" | "summary" | "verbs">[];
  question?: ClientQuestion;
  position: number;
  total: number;
  prevHref?: string;
  nextHref: string;
  nextLabel: string;
  moduleHref: string;
  moduleTitle: string;
  statusNote?: React.ReactNode;
}

const READ_TYPES = ["read", "eli5", "diagram", "worked_example"];

export function TaskPlayer({ task, outcomes, question, position, total, prevHref, nextHref, nextLabel, moduleHref, moduleTitle, statusNote }: Props) {
  const router = useRouter();
  const p = useProgress();
  const alreadyDone = p.tasks[task.id]?.status === "done";
  const [finished, setFinished] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const canContinue = alreadyDone || finished || READ_TYPES.includes(task.type) || task.type === "video" || task.type === "audio" || task.type === "teach_back";

  const complete = () => {
    actions.markTask(task.id, "done");
    router.push(nextHref);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (typing) return;
      if (e.key === "Enter" && canContinue && !(e.target instanceof HTMLButtonElement)) complete();
      if (e.key === " " && task.type === "flashcard" && !flipped) { e.preventDefault(); setFlipped(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted">
          <Link href={moduleHref} className="underline">{moduleTitle}</Link>
          <span>Task {position} of {total} · about {task.minutes} min</span>
        </div>
        <ProgressBar value={position / total} label="Position in module" />
      </div>

      <header className="space-y-1">
        <TaskTypeLabel type={task.type} />
        <h1 className="text-2xl font-bold">{task.title}</h1>
        <OutcomeChips outcomes={outcomes} />
        <div className="flex flex-wrap items-center gap-3">
          {statusNote}
          {task.type !== "question" && <FeedbackButton label="Feedback on this task" context={{ taskId: task.id }} />}
        </div>
      </header>

      <div className="rounded-xl border border-border bg-card p-5">
        {READ_TYPES.includes(task.type) && task.html && <div className="prose" dangerouslySetInnerHTML={{ __html: task.html }} />}

        {task.type === "question" && question && <PracticeQuestion q={question} context="task" onDone={() => setFinished(true)} />}

        {task.type === "flashcard" && (
          <div className="space-y-4 text-center">
            <p className="text-xl font-medium">{task.front}</p>
            {flipped ? (
              <>
                <p className="rounded-lg bg-accent-soft p-4 text-lg">{task.back}</p>
                <div className="flex justify-center gap-3">
                  <button className={buttonClass.secondary} onClick={() => { setFinished(true); complete(); }}>I need to review this</button>
                  <button className={buttonClass.primary} onClick={() => { setFinished(true); complete(); }}>I knew it</button>
                </div>
              </>
            ) : (
              <button className={buttonClass.primary} onClick={() => setFlipped(true)}>Show answer <span className="ml-2 text-xs opacity-75">(space)</span></button>
            )}
          </div>
        )}

        {task.type === "memory_aid" && task.memory && <MemoryAid taskId={task.id} lo={task.lo} spec={task.memory} onComplete={() => setFinished(true)} />}

        {task.type === "calc_drill" && task.drill && <CalcDrill taskId={task.id} lo={task.lo} spec={task.drill} onComplete={() => setFinished(true)} />}

        {task.type === "video" && task.video && (
          <div className="space-y-3">
            {task.video.embed ? (
              <iframe src={task.video.url} title={task.title} className="aspect-video w-full rounded-lg" allowFullScreen />
            ) : (
              <a href={task.video.url} className="underline" target="_blank" rel="noopener noreferrer">Watch the video (opens in a new tab)</a>
            )}
            <p className="text-xs text-muted">Licence: {task.video.licence}</p>
            {task.video.transcript && <details><summary className="cursor-pointer">Transcript</summary><p className="mt-2 whitespace-pre-line">{task.video.transcript}</p></details>}
          </div>
        )}

        {task.type === "teach_back" && (
          <div className="space-y-3">
            {task.html && <div className="prose" dangerouslySetInnerHTML={{ __html: task.html }} />}
            <label className="block text-sm font-medium" htmlFor="teach-back">Explain it in your own words</label>
            <textarea id="teach-back" rows={6} className="w-full rounded-lg border border-border bg-bg p-3" />
            <p className="text-xs text-muted">The optional AI audit is not switched on yet. Writing it out is still the point.</p>
          </div>
        )}

        {task.type === "audio" && <p className="text-muted">Audio versions are generated at build time and are not available yet.</p>}
      </div>

      <nav className="flex items-center justify-between gap-3" aria-label="Task navigation">
        {prevHref ? <Link href={prevHref} className={buttonClass.secondary}>Back</Link> : <span />}
        <div className="flex gap-3">
          {!canContinue && (
            <button className="text-sm text-muted underline" onClick={() => { actions.markTask(task.id, "skipped"); router.push(nextHref); }}>Skip for now</button>
          )}
          {canContinue && task.type !== "flashcard" && (
            <button className={buttonClass.primary} onClick={complete}>
              {nextLabel} <span className="ml-2 hidden text-xs opacity-75 sm:inline">(Enter)</span>
            </button>
          )}
        </div>
      </nav>
    </article>
  );
}
