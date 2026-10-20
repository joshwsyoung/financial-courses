import type { MasteryMap } from "./types";

export interface TaskRef {
  id: string;
  minutes: number;
}

/** Completed minutes / total minutes (spec 7.3). Returns 0..1. */
export function courseProgress(tasks: TaskRef[], done: Set<string>): number {
  const total = tasks.reduce((s, t) => s + t.minutes, 0);
  if (total === 0) return 0;
  const complete = tasks.filter((t) => done.has(t.id)).reduce((s, t) => s + t.minutes, 0);
  return complete / total;
}

export function minutesRemaining(tasks: TaskRef[], done: Set<string>): number {
  return tasks.filter((t) => !done.has(t.id)).reduce((s, t) => s + t.minutes, 0);
}

/**
 * Projected finish date given weekly study hours. Uses the course's
 * recommended hours scaled by remaining share, because task minutes alone
 * understate revision and practice time.
 */
export function projectedFinish(opts: {
  remainingShare: number;
  recommendedHours: number;
  weeklyHours: number;
  from: Date;
}): Date | null {
  if (opts.weeklyHours <= 0) return null;
  const hoursLeft = opts.remainingShare * opts.recommendedHours;
  const days = Math.ceil((hoursLeft / opts.weeklyHours) * 7);
  const d = new Date(opts.from);
  d.setDate(d.getDate() + days);
  return d;
}

export interface MockResult {
  /** 0..100 */
  percent: number;
  timed: boolean;
  /** ISO date */
  date: string;
}

export interface Readiness {
  /** 0..100, weighted by exam topic weighting. */
  masteryScore: number;
  onTrack: boolean;
  reasons: string[];
}

/**
 * Readiness rule (spec 6.3): "On track" when the last two timed mocks are at
 * or above 75% and no topic is below 60%. Always presented as an estimate.
 */
export function readiness(opts: {
  topicMastery: { topic: string; weight: number; score: number }[];
  mocks: MockResult[];
}): Readiness {
  const totalWeight = opts.topicMastery.reduce((s, t) => s + t.weight, 0) || 1;
  const masteryScore =
    Math.round((opts.topicMastery.reduce((s, t) => s + t.weight * t.score, 0) / totalWeight) * 10) / 10;
  const reasons: string[] = [];
  const timed = opts.mocks.filter((m) => m.timed).sort((a, b) => b.date.localeCompare(a.date));
  const lastTwo = timed.slice(0, 2);
  if (lastTwo.length < 2) reasons.push("Take at least two timed mocks");
  else if (lastTwo.some((m) => m.percent < 75)) reasons.push("Last two timed mocks need to be 75% or more");
  const weak = opts.topicMastery.filter((t) => t.score < 60);
  if (weak.length) reasons.push(`${weak.length} topic(s) below 60% mastery`);
  return { masteryScore, onTrack: reasons.length === 0, reasons };
}

export function averageMastery(mastery: MasteryMap, los: string[]): number {
  if (!los.length) return 0;
  return Math.round((los.reduce((s, lo) => s + (mastery[lo] ?? 0), 0) / los.length) * 10) / 10;
}
