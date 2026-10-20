import { shuffle } from "./random";
import type { EngineQuestion, MasteryMap } from "./types";

export interface SelectOptions {
  count: number;
  mastery: MasteryMap;
  /** Question ids the learner has already seen (any attempt). */
  seen: Set<string>;
  /** Question ids used in the learner's most recent attempt at this test; avoided where possible. */
  lastTest?: Set<string>;
  rand: () => number;
}

/**
 * Pick questions for a module or stage test (spec 7.2):
 * prefer weak LOs and unseen questions, avoid repeating the last attempt,
 * and spread picks across LOs so one outcome does not dominate.
 */
export function selectQuestions(bank: EngineQuestion[], opts: SelectOptions): EngineQuestion[] {
  const { count, mastery, seen, lastTest = new Set(), rand } = opts;
  const scored = shuffle(bank, rand).map((q) => {
    const loScore = q.lo.reduce((s, lo) => s + (mastery[lo] ?? 0), 0) / Math.max(1, q.lo.length);
    let priority = 100 - loScore; // weak LOs first
    if (!seen.has(q.id)) priority += 50; // unseen first
    if (lastTest.has(q.id)) priority -= 200; // fresh questions on retake
    return { q, priority };
  });
  scored.sort((a, b) => b.priority - a.priority);

  // Round-robin by primary LO to keep coverage balanced.
  const byLo = new Map<string, EngineQuestion[]>();
  for (const { q } of scored) {
    const key = q.lo[0] ?? "";
    byLo.set(key, [...(byLo.get(key) ?? []), q]);
  }
  const loOrder = [...byLo.keys()].sort(
    (a, b) => (mastery[a] ?? 0) - (mastery[b] ?? 0) || a.localeCompare(b),
  );
  const picked: EngineQuestion[] = [];
  while (picked.length < count && [...byLo.values()].some((l) => l.length)) {
    for (const lo of loOrder) {
      const next = byLo.get(lo)?.shift();
      if (next) picked.push(next);
      if (picked.length >= count) break;
    }
  }
  return picked;
}
