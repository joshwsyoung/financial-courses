import type { Attempt, EngineQuestion, MasteryMap } from "./types";

/**
 * Simple weighted moving average (spec 7.2). Harder questions move the score
 * more when answered correctly, easier ones more when missed.
 * Upgrade path: swap this for an Elo or Bayesian model with the same signature.
 */
export const BASE_WEIGHT = 0.25;

export function updateLoScore(prev: number | undefined, correct: boolean, difficulty: number): number {
  const d = Math.min(5, Math.max(1, difficulty));
  const start = prev ?? 0;
  const weight = correct ? BASE_WEIGHT * (0.6 + 0.1 * d) : BASE_WEIGHT * (1.2 - 0.1 * d);
  const target = correct ? 100 : 0;
  return round1(start + weight * (target - start));
}

export function applyAttempt(mastery: MasteryMap, q: Pick<EngineQuestion, "lo" | "difficulty">, correct: boolean): MasteryMap {
  const next = { ...mastery };
  for (const lo of q.lo) next[lo] = updateLoScore(next[lo], correct, q.difficulty);
  return next;
}

/** Rebuild mastery from scratch from an attempt log, e.g. after importing progress. */
export function masteryFromAttempts(
  attempts: Attempt[],
  lookup: (id: string) => Pick<EngineQuestion, "lo" | "difficulty"> | undefined,
): MasteryMap {
  let m: MasteryMap = {};
  for (const a of [...attempts].sort((x, y) => x.at.localeCompare(y.at))) {
    const q = lookup(a.questionId);
    if (q) m = applyAttempt(m, q, a.correct);
  }
  return m;
}

export function weakestLos(mastery: MasteryMap, los: string[], n = 3): { lo: string; score: number }[] {
  return los
    .map((lo) => ({ lo, score: mastery[lo] ?? 0 }))
    .sort((a, b) => a.score - b.score || a.lo.localeCompare(b.lo))
    .slice(0, n);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
