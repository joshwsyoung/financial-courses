"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { grade, mulberry32, selectQuestions, type Answer } from "@ofc/engine";
import { actions, useProgress, type AttemptContext } from "@/lib/progress";
import type { ClientQuestion, CourseIndex } from "@/lib/types";
import { hasAnswer, QuestionBody, QuestionMeta, ReportLink } from "./Question";
import { Badge, buttonClass, Card, ProgressBar } from "./ui";

export interface TestConfig {
  key: string;
  title: string;
  kind: "module" | "stage" | "mock";
  context: AttemptContext;
  count: number;
  passMark: number;
  pool: ClientQuestion[];
  /** Minutes; omitted means untimed. */
  timeLimit?: number;
  doneHref: string;
  doneLabel: string;
  mock?: { paperId: string; unit: string };
}

type Phase = "intro" | "running" | "results";

export function TestRunner({ config, los }: { config: TestConfig; los: CourseIndex["outcomes"] }) {
  const p = useProgress();
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const previous = p.tests[config.key] ?? [];

  const start = () => {
    const seen = new Set(p.attempts.map((a) => a.questionId));
    const lastTest = new Set(previous.at(-1)?.questionIds ?? []);
    const picked = selectQuestions(config.pool, {
      count: Math.min(config.count, config.pool.length),
      mastery: p.mastery,
      seen,
      lastTest,
      rand: mulberry32(Date.now() % 2 ** 31),
    }) as ClientQuestion[];
    setQuestions(picked);
    setAnswers({});
    setFlags(new Set());
    setIndex(0);
    setEndsAt(config.timeLimit ? Date.now() + config.timeLimit * 60_000 : null);
    setPhase("running");
  };

  const submit = () => {
    const results = questions.map((q) => ({ q, correct: answers[q.id] !== undefined && grade(q, answers[q.id]!) }));
    results.forEach((r) => actions.recordAnswer(r.q, r.correct, config.context));
    const score = results.filter((r) => r.correct).length;
    const passed = score / questions.length >= config.passMark;
    actions.recordTest(config.key, { at: new Date().toISOString(), score, total: questions.length, passed, questionIds: questions.map((q) => q.id) });
    if (config.mock) {
      actions.addMock({ paperId: config.mock.paperId, kind: "ai", unit: config.mock.unit, date: new Date().toISOString().slice(0, 10), percent: Math.round((score / questions.length) * 100), timed: !!config.timeLimit });
    }
    setPhase("results");
  };

  useEffect(() => {
    if (phase !== "running" || !endsAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phase, endsAt]);

  const remaining = endsAt ? Math.max(0, endsAt - now) : null;
  useEffect(() => {
    if (remaining === 0 && phase === "running") submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, phase]);

  const results = useMemo(
    () => questions.map((q) => ({ q, correct: answers[q.id] !== undefined && grade(q, answers[q.id]!) })),
    [questions, answers],
  );

  if (phase === "intro") {
    const best = previous.reduce((b, a) => Math.max(b, a.score / a.total), 0);
    return (
      <Card className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold">{config.title}</h1>
        {config.kind === "mock" && <Badge tone="warn">AI-generated, unofficial</Badge>}
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>{Math.min(config.count, config.pool.length)} questions{config.timeLimit ? `, ${config.timeLimit} minutes` : ", untimed"}.</li>
          <li>Pass mark {Math.round(config.passMark * 100)}%. You can retake it; each retake gets fresh questions where the bank allows.</li>
          <li>You can flag questions and come back to them before you submit.</li>
          {config.pool.length < config.count && <li className="text-warn">The question bank is still small, so this test is shorter than planned.</li>}
        </ul>
        {previous.length > 0 && <p className="text-sm text-muted">Attempts so far: {previous.length} · best {Math.round(best * 100)}%</p>}
        <button className={buttonClass.primary} onClick={start}>Start</button>
      </Card>
    );
  }

  if (phase === "running") {
    const q = questions[index]!;
    const answered = questions.filter((x) => hasAnswer(x, answers[x.id])).length;
    const mins = remaining !== null ? Math.floor(remaining / 60000) : 0;
    const secs = remaining !== null ? Math.floor((remaining % 60000) / 1000) : 0;
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium">{config.title}</span>
          <span className="text-muted">{answered} of {questions.length} answered</span>
          {remaining !== null && (
            <span role="timer" aria-live="off" className={`font-mono ${remaining < 60000 ? "text-bad" : ""}`}>{mins}:{secs.toString().padStart(2, "0")} left</span>
          )}
        </div>
        <ProgressBar value={answered / questions.length} label="Answered" />
        <nav aria-label="Questions" className="flex flex-wrap gap-1.5">
          {questions.map((x, i) => (
            <button
              key={x.id}
              onClick={() => setIndex(i)}
              aria-current={i === index ? "step" : undefined}
              aria-label={`Question ${i + 1}${hasAnswer(x, answers[x.id]) ? ", answered" : ""}${flags.has(x.id) ? ", flagged" : ""}`}
              className={`h-9 w-9 rounded-md border text-sm ${i === index ? "border-accent bg-accent text-accent-fg" : hasAnswer(x, answers[x.id]) ? "border-accent bg-accent-soft" : "border-border"} ${flags.has(x.id) ? "ring-2 ring-warn" : ""}`}
            >
              {i + 1}
            </button>
          ))}
        </nav>
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Question {index + 1}</span>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={flags.has(q.id)} onChange={() => { const f = new Set(flags); if (f.has(q.id)) f.delete(q.id); else f.add(q.id); setFlags(f); }} />
              Flag for review
            </label>
          </div>
          <QuestionBody key={q.id} q={q} answer={answers[q.id]} onChange={(a) => setAnswers({ ...answers, [q.id]: a })} reveal={false} />
        </Card>
        <div className="flex justify-between gap-3">
          <button className={buttonClass.secondary} disabled={index === 0} onClick={() => setIndex(index - 1)}>Previous</button>
          {index < questions.length - 1 ? (
            <button className={buttonClass.primary} onClick={() => setIndex(index + 1)}>Next</button>
          ) : (
            <button className={buttonClass.primary} onClick={() => { if (answered === questions.length || confirm(`${questions.length - answered} unanswered. Submit anyway?`)) submit(); }}>Submit</button>
          )}
        </div>
      </div>
    );
  }

  const score = results.filter((r) => r.correct).length;
  const pct = score / results.length;
  const passed = pct >= config.passMark;
  const byLo = new Map<string, { right: number; total: number }>();
  for (const r of results) for (const lo of r.q.lo) {
    const e = byLo.get(lo) ?? { right: 0, total: 0 };
    byLo.set(lo, { right: e.right + (r.correct ? 1 : 0), total: e.total + 1 });
  }
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card className="space-y-3">
        <h1 className="text-2xl font-bold">{config.title}: results</h1>
        <p className="text-4xl font-bold">{Math.round(pct * 100)}%</p>
        <p>{score} of {results.length} correct. {passed ? <Badge tone="good">Passed</Badge> : <Badge tone="bad">Below the {Math.round(config.passMark * 100)}% pass mark</Badge>}</p>
        {config.kind === "mock" && <p className="text-xs text-muted">AI-generated, unofficial. A rough guide only; it does not predict your real exam result.</p>}
        <div className="flex flex-wrap gap-3">
          <button className={buttonClass.secondary} onClick={start}>Retake with fresh questions</button>
          <Link href={config.doneHref} className={buttonClass.primary}>{config.doneLabel}</Link>
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold">By learning outcome</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {[...byLo].sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total).map(([lo, v]) => (
            <li key={lo}>
              <div className="flex justify-between gap-3"><span><span className="text-muted">{lo}</span> {los.find((l) => l.id === lo)?.summary}</span><span>{v.right}/{v.total}</span></div>
              <ProgressBar value={v.right / v.total} label={`${lo} score`} tone={v.right / v.total >= 0.8 ? "good" : v.right / v.total >= 0.6 ? "warn" : "bad"} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">Missed questions have been added to your review queue.</p>
      </Card>
      <h2 className="text-lg font-semibold">Your answers</h2>
      {results.map(({ q }, i) => (
        <Card key={q.id} className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted"><span>Question {i + 1}</span><ReportLink q={q} answer={answers[q.id]} /></div>
          <QuestionMeta q={q} />
          <QuestionBody q={q} answer={answers[q.id]} onChange={() => {}} reveal />
        </Card>
      ))}
    </div>
  );
}
