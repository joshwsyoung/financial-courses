import type { ReviewItem } from "./types";

/** Spaced repetition ladder in days (spec 7.2). */
export const INTERVALS = [1, 3, 7, 14, 30] as const;

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function today(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Update the review queue after an answer.
 * - Wrong: (re)enter the queue at step 0, due tomorrow.
 * - Right and in queue: climb one step; graduate (leave the queue) after the last interval.
 * - Right and not in queue: nothing to do.
 */
export function scheduleReview(queue: ReviewItem[], questionId: string, correct: boolean, on: string): ReviewItem[] {
  const rest = queue.filter((r) => r.questionId !== questionId);
  const existing = queue.find((r) => r.questionId === questionId);
  if (!correct) return [...rest, { questionId, step: 0, due: addDays(on, INTERVALS[0]) }];
  if (!existing) return queue;
  const step = existing.step + 1;
  if (step >= INTERVALS.length) return rest;
  return [...rest, { questionId, step, due: addDays(on, INTERVALS[step]!) }];
}

export function dueItems(queue: ReviewItem[], on: string): ReviewItem[] {
  return queue.filter((r) => r.due <= on).sort((a, b) => a.due.localeCompare(b.due));
}
