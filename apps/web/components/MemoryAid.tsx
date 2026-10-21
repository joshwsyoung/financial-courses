"use client";

import { useMemo, useState } from "react";
import { mulberry32, shuffle } from "@ofc/engine";
import { actions } from "@/lib/progress";
import type { MemoryAidSpec } from "@/lib/types";
import { buttonClass } from "./ui";

/** Highlights the first letter of each word that carries a letter of the device. */
function DeviceText({ text, letters }: { text: string; letters?: string }) {
  if (!letters) return <>{text}</>;
  let next = 0;
  return (
    <>
      {text.split(/(\s+)/).map((word, i) => {
        // Skip short lowercase joining words ("or", "and", "of") so they don't steal a letter.
        const joiner = /^[a-z]{1,3}$/.test(word);
        const hit = !joiner && next < letters.length && word[0]?.toUpperCase() === letters[next];
        if (hit) next++;
        return hit ? (
          <span key={i}><span className="font-bold text-accent underline decoration-2 underline-offset-4">{word[0]}</span>{word.slice(1)}</span>
        ) : (
          <span key={i}>{word}</span>
        );
      })}
    </>
  );
}

/**
 * Two steps: learn the list with its memory device, then recall it by tapping
 * the items back in order. Mistakes are shown straight away so the order sticks.
 */
export function MemoryAid({ taskId, lo, spec, onComplete }: { taskId: string; lo: string[]; spec: MemoryAidSpec; onComplete: () => void }) {
  const [phase, setPhase] = useState<"learn" | "recall" | "done">("learn");
  const [seed, setSeed] = useState(1);
  const shuffled = useMemo(() => shuffle(spec.items.map((_, i) => i), mulberry32(seed * 7919 + spec.items.length)), [seed, spec.items]);
  const [picked, setPicked] = useState<number[]>([]);
  const [miss, setMiss] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const tap = (i: number) => {
    const expected = spec.ordered ? picked.length : i;
    if (i === expected && !picked.includes(i)) {
      const next = [...picked, i];
      setPicked(next);
      setMiss(null);
      if (next.length === spec.items.length) {
        actions.recordAnswer({ id: `memory:${taskId}`, lo, difficulty: 2 }, mistakes === 0, "drill");
        setPhase("done");
        onComplete();
      }
    } else {
      setMiss(i);
      setMistakes((m) => m + 1);
    }
  };

  const restart = () => {
    setPicked([]);
    setMiss(null);
    setMistakes(0);
    setSeed((s) => s + 1);
    setPhase("recall");
  };

  const device = (
    <p className="rounded-lg bg-accent-soft p-4 text-center text-xl font-medium">
      &ldquo;<DeviceText text={spec.device.text} letters={spec.device.letters} />&rdquo;
    </p>
  );

  if (phase === "learn") {
    return (
      <div className="space-y-4">
        {spec.intro && <p>{spec.intro}</p>}
        {device}
        <ol className="space-y-2">
          {spec.items.map((item, i) => (
            <li key={i} className="flex gap-3 rounded-lg border border-border p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-fg">
                {spec.device.letters?.[i] ?? i + 1}
              </span>
              <span>
                <span className="font-medium">{item.label}</span>
                {item.detail && <span className="block text-sm text-muted">{item.detail}</span>}
              </span>
            </li>
          ))}
        </ol>
        <button className={buttonClass.primary} onClick={() => setPhase("recall")}>I&rsquo;ve got it, test me</button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="space-y-3" role="status">
        <p className="rounded-lg bg-good-soft p-4 font-medium text-good">
          {mistakes === 0 ? "Perfect recall." : `Done, with ${mistakes} slip${mistakes === 1 ? "" : "s"}.`} Say the sentence to yourself once more.
        </p>
        {device}
        <button className={buttonClass.secondary} onClick={restart}>Practise again</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {spec.ordered ? "Tap the items in order." : "Tap every item."} {picked.length} of {spec.items.length}
        {spec.device.letters && <> · hint: <span className="whitespace-nowrap font-mono font-semibold tracking-widest">{spec.device.letters.split("").map((l, i) => (i < picked.length ? l : "_")).join(" ")}</span></>}
      </p>
      <ol className="space-y-1">
        {picked.map((i, n) => (
          <li key={i} className="text-sm"><span className="font-semibold text-good">{n + 1}.</span> {spec.items[i]!.label}</li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        {shuffled.filter((i) => !picked.includes(i)).map((i) => (
          <button
            key={i}
            onClick={() => tap(i)}
            className={`rounded-lg border px-3 py-2 text-left ${miss === i ? "border-bad bg-bad-soft" : "border-border bg-card hover:bg-accent-soft"}`}
          >
            {spec.items[i]!.label}
          </button>
        ))}
      </div>
      {miss !== null && <p role="status" className="text-sm text-bad">Not that one yet. Think of the next word in the sentence.</p>}
    </div>
  );
}
