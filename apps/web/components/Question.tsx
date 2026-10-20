"use client";

import { useEffect, useRef, useState } from "react";
import { grade, type Answer } from "@ofc/engine";
import { actions, type AttemptContext } from "@/lib/progress";
import { issueUrl } from "@/lib/site";
import type { ClientQuestion } from "@/lib/types";
import { Badge, buttonClass, StatusBadge } from "./ui";

type PartAnswer = string | number | undefined;

/** Controlled input for a single MCQ or gap-fill part. */
function PartInput({ q, value, onChange, reveal, name }: {
  q: ClientQuestion;
  value: PartAnswer;
  onChange: (v: string) => void;
  reveal: boolean;
  name: string;
}) {
  if (q.type === "mcq") {
    return (
      <fieldset className="mt-3 space-y-2">
        <legend className="sr-only">Choose one answer</legend>
        {q.options!.map((o, i) => {
          const chosen = value === o.id;
          const isCorrect = o.id === q.correct;
          const tone = reveal ? (isCorrect ? "border-good bg-good-soft" : chosen ? "border-bad bg-bad-soft" : "border-border") : chosen ? "border-accent bg-accent-soft" : "border-border hover:bg-accent-soft/50";
          return (
            <label key={o.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${tone}`}>
              <input type="radio" className="mt-1" name={name} value={o.id} checked={chosen} disabled={reveal} onChange={() => onChange(o.id)} />
              <span><span className="mr-2 font-semibold text-muted">{String.fromCharCode(65 + i)}</span>{o.text}</span>
            </label>
          );
        })}
      </fieldset>
    );
  }
  const units = q.answer?.kind === "numeric" ? q.answer.units : undefined;
  return (
    <div className="mt-3 flex items-center gap-2">
      {units === "£" && <span aria-hidden>£</span>}
      <input
        type="text"
        inputMode={q.answer?.kind === "numeric" ? "decimal" : "text"}
        aria-label="Your answer"
        className="w-full max-w-xs rounded-lg border border-border bg-bg px-3 py-2"
        value={value ?? ""}
        disabled={reveal}
        onChange={(e) => onChange(e.target.value)}
      />
      {units && units !== "£" && <span>{units}</span>}
    </div>
  );
}

function PartFeedback({ q, value }: { q: ClientQuestion; value: PartAnswer }) {
  const correct = value !== undefined && value !== "" && grade(q, value);
  const right = q.type === "mcq"
    ? q.options!.find((o) => o.id === q.correct)?.text
    : q.answer?.kind === "numeric" ? `${q.answer.units === "£" ? "£" : ""}${q.answer.value.toLocaleString("en-GB")}${q.answer.units && q.answer.units !== "£" ? ` ${q.answer.units}` : ""}` : q.answer?.accepted[0];
  const note = q.type === "mcq" && typeof value === "string" && !correct ? q.distractor_notes?.[value] : undefined;
  return (
    <div role="status" className={`mt-3 rounded-lg p-3 text-sm ${correct ? "bg-good-soft" : "bg-bad-soft"}`}>
      <p className={`font-semibold ${correct ? "text-good" : "text-bad"}`}>{correct ? "Correct" : `Not quite. The answer is ${right}.`}</p>
      {note && <p className="mt-1"><strong>Why your choice is wrong:</strong> {note}</p>}
      <p className="mt-1"><strong>Why the answer is right:</strong> {q.explanation}</p>
    </div>
  );
}

export function QuestionMeta({ q }: { q: ClientQuestion }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
      <span>LO {q.lo.join(", ")}</span>
      {q.tax_year && <Badge tone="accent">Tax year {q.tax_year}</Badge>}
      <StatusBadge status={q.status} origin={q.origin} />
    </div>
  );
}

export function ReportLink({ q }: { q: ClientQuestion }) {
  return (
    <a
      className="text-xs text-muted underline"
      href={issueUrl("wrong-answer.yml", `Wrong answer: ${q.id}`, `Question id: ${q.id}\n\nWhat is wrong:\n`)}
      target="_blank"
      rel="noopener noreferrer"
    >
      Report an error
    </a>
  );
}

/** The question body (scenario, stem, inputs). Used by both practice and test modes. */
export function QuestionBody({ q, answer, onChange, reveal }: {
  q: ClientQuestion;
  answer: Answer | undefined;
  onChange: (a: Answer) => void;
  reveal: boolean;
}) {
  if (q.type === "itemset") {
    const parts = (answer as Record<string, string | number> | undefined) ?? {};
    return (
      <div>
        {q.scenario && <div className="rounded-lg bg-accent-soft p-3 text-sm">{q.scenario}</div>}
        <p className="mt-3 font-medium">{q.stem}</p>
        <ol className="mt-3 space-y-5">
          {q.parts!.map((part, i) => (
            <li key={part.id}>
              <p className="font-medium">{i + 1}. {part.stem}</p>
              <PartInput q={part} name={`${q.id}-${part.id}`} value={parts[part.id]} reveal={reveal} onChange={(v) => onChange({ ...parts, [part.id]: v })} />
              {reveal && <PartFeedback q={part} value={parts[part.id]} />}
            </li>
          ))}
        </ol>
      </div>
    );
  }
  return (
    <div>
      <p className="text-lg font-medium">{q.stem}</p>
      <PartInput q={q} name={q.id} value={answer as PartAnswer} reveal={reveal} onChange={onChange} />
      {reveal && <PartFeedback q={q} value={answer as PartAnswer} />}
    </div>
  );
}

export function hasAnswer(q: ClientQuestion, a: Answer | undefined): boolean {
  if (a === undefined || a === "") return false;
  if (q.type === "itemset") return q.parts!.every((p) => {
    const v = (a as Record<string, string | number>)[p.id];
    return v !== undefined && v !== "";
  });
  return true;
}

/** Practice question with instant feedback. Records the attempt and calls onDone. */
export function PracticeQuestion({ q, context, onDone }: { q: ClientQuestion; context: AttemptContext; onDone?: (correct: boolean) => void }) {
  const [answer, setAnswer] = useState<Answer | undefined>();
  const [reveal, setReveal] = useState(false);
  const started = useRef(Date.now());
  const ready = hasAnswer(q, answer);

  const submit = () => {
    if (!ready || reveal) return;
    const correct = grade(q, answer!);
    actions.recordAnswer(q, correct, context, Date.now() - started.current);
    setReveal(true);
    onDone?.(correct);
  };

  useEffect(() => {
    if (q.type !== "mcq" || reveal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type === "text") return;
      const idx = "1234abcd".indexOf(e.key.toLowerCase()) % 4;
      if ("1234abcd".includes(e.key.toLowerCase()) && q.options![idx]) setAnswer(q.options![idx]!.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, reveal]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3">
      <QuestionMeta q={q} />
      <QuestionBody q={q} answer={answer} onChange={setAnswer} reveal={reveal} />
      <div className="flex items-center justify-between gap-3">
        {!reveal && <button type="submit" className={buttonClass.primary} disabled={!ready}>Check answer</button>}
        <ReportLink q={q} />
      </div>
    </form>
  );
}
