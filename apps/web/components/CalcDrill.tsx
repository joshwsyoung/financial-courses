"use client";

import { useMemo, useState } from "react";
import { evaluate, mulberry32, parseNumeric } from "@ofc/engine";
import { actions } from "@/lib/progress";
import type { DrillSpec } from "@/lib/types";
import { buttonClass } from "./ui";

function drawInputs(spec: DrillSpec, rand: () => number) {
  return Object.fromEntries(
    Object.entries(spec.inputs).map(([k, r]) => {
      const steps = Math.floor((r.max - r.min) / r.step);
      return [k, r.min + Math.floor(rand() * (steps + 1)) * r.step];
    }),
  );
}

/** Repeated numeric practice with fresh numbers each round, so answers can't be memorised. */
export function CalcDrill({ taskId, lo, spec, onComplete }: { taskId: string; lo: string[]; spec: DrillSpec; onComplete: () => void }) {
  const seed = useMemo(() => Math.floor(Math.random() * 2 ** 31), []);
  const rounds = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: spec.rounds }, () => {
      const vars = drawInputs(spec, rand);
      return { vars, answer: evaluate(spec.formula, vars) };
    });
  }, [seed, spec]);
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState<null | boolean>(null);
  const [score, setScore] = useState(0);
  const round = rounds[i];
  const finished = i >= rounds.length;

  const prompt = round
    ? spec.prompt.replace(/\{(\w+)\}/g, (_, k: string) => (round.vars[k] ?? 0).toLocaleString("en-GB"))
    : "";

  const check = () => {
    if (!round) return;
    const n = parseNumeric(value);
    const ok = n !== null && Math.abs(n - round.answer) <= spec.tolerance + 1e-9;
    actions.recordAnswer({ id: `drill:${taskId}`, lo, difficulty: 2 }, ok, "drill");
    setChecked(ok);
    if (ok) setScore((s) => s + 1);
  };
  const next = () => {
    setI(i + 1);
    setValue("");
    setChecked(null);
    if (i + 1 >= rounds.length) onComplete();
  };

  if (finished) {
    return <p className="rounded-lg bg-accent-soft p-4 font-medium">Drill complete: {score} of {rounds.length} correct.</p>;
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (checked === null) check(); else next(); }} className="space-y-3">
      <p className="text-sm text-muted">Round {i + 1} of {rounds.length} · {score} correct so far</p>
      <p className="text-lg font-medium">{prompt}</p>
      <div className="flex items-center gap-2">
        {spec.units === "£" && <span aria-hidden>£</span>}
        <input aria-label="Your answer" inputMode="decimal" className="w-full max-w-xs rounded-lg border border-border bg-bg px-3 py-2" value={value} disabled={checked !== null} onChange={(e) => setValue(e.target.value)} autoFocus />
      </div>
      {checked !== null && round && (
        <p role="status" className={`rounded-lg p-3 text-sm ${checked ? "bg-good-soft text-good" : "bg-bad-soft text-bad"}`}>
          {checked ? "Correct." : "Not quite."} The answer is {spec.units === "£" ? "£" : ""}{round.answer.toLocaleString("en-GB", { maximumFractionDigits: 2 })}.
        </p>
      )}
      <button type="submit" className={buttonClass.primary} disabled={checked === null && value.trim() === ""}>
        {checked === null ? "Check" : i + 1 < rounds.length ? "Next round" : "Finish drill"}
      </button>
    </form>
  );
}
