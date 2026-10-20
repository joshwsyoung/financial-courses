import type { Answer, EngineQuestion } from "./types";

export function normaliseText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.,;:!?]+$/, "");
}

/** Parse "4.2", "4.2%", "£1,250.50" and similar into a number. */
export function parseNumeric(input: string | number): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  const cleaned = input.replace(/[£$€,%\s]/g, "");
  if (cleaned === "" || !/^-?\d*\.?\d+(e-?\d+)?$/i.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Returns true when the answer is correct. Item sets are graded part by part via gradeParts. */
export function grade(q: EngineQuestion, answer: Answer): boolean {
  switch (q.type) {
    case "mcq":
      return typeof answer === "string" && answer === q.correct;
    case "gapfill": {
      if (!q.answer || typeof answer === "object") return false;
      if (q.answer.kind === "numeric") {
        const n = parseNumeric(answer);
        return n !== null && Math.abs(n - q.answer.value) <= q.answer.tolerance + 1e-9;
      }
      const given = normaliseText(String(answer));
      return q.answer.accepted.some((a) => normaliseText(a) === given);
    }
    case "itemset": {
      if (typeof answer !== "object" || !q.parts) return false;
      return gradeParts(q, answer).every((p) => p.correct);
    }
  }
}

export function gradeParts(
  q: EngineQuestion,
  answers: Record<string, string | number>,
): { id: string; correct: boolean }[] {
  return (q.parts ?? []).map((p) => {
    const a = answers[p.id];
    return { id: p.id, correct: a !== undefined && grade(p, a) };
  });
}
