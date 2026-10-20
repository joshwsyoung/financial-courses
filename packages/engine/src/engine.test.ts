import { describe, expect, it } from "vitest";
import {
  applyAttempt,
  courseProgress,
  dueItems,
  grade,
  mulberry32,
  parseNumeric,
  readiness,
  scheduleReview,
  selectQuestions,
  updateLoScore,
  weakestLos,
  type EngineQuestion,
} from "./index";

const mcq: EngineQuestion = {
  id: "q1",
  type: "mcq",
  lo: ["1.1"],
  difficulty: 2,
  options: [
    { id: "a", text: "A" },
    { id: "b", text: "B" },
  ],
  correct: "a",
};

describe("grade", () => {
  it("grades MCQ", () => {
    expect(grade(mcq, "a")).toBe(true);
    expect(grade(mcq, "b")).toBe(false);
  });

  it("grades numeric gap-fill with tolerance and symbols", () => {
    const q: EngineQuestion = {
      id: "g", type: "gapfill", lo: ["2.1"], difficulty: 2,
      answer: { kind: "numeric", value: 4.17, tolerance: 0.05, units: "%" },
    };
    expect(grade(q, "4.2%")).toBe(true);
    expect(grade(q, "4.13")).toBe(true);
    expect(grade(q, "4.3")).toBe(false);
    expect(grade(q, "abc")).toBe(false);
  });

  it("grades text gap-fill with accepted variants", () => {
    const q: EngineQuestion = {
      id: "t", type: "gapfill", lo: ["1.2"], difficulty: 1,
      answer: { kind: "text", accepted: ["Consumer Duty", "the consumer duty"] },
    };
    expect(grade(q, "  consumer   duty. ")).toBe(true);
    expect(grade(q, "Treating customers fairly")).toBe(false);
  });

  it("grades item sets only when every part is right", () => {
    const set: EngineQuestion = { id: "s", type: "itemset", lo: ["1.1"], difficulty: 3, parts: [mcq, { ...mcq, id: "q2", correct: "b" }] };
    expect(grade(set, { q1: "a", q2: "b" })).toBe(true);
    expect(grade(set, { q1: "a", q2: "a" })).toBe(false);
  });

  it("parses numbers", () => {
    expect(parseNumeric("£1,250.50")).toBe(1250.5);
    expect(parseNumeric("")).toBeNull();
  });
});

describe("mastery", () => {
  it("moves up on correct and down on wrong, within 0..100", () => {
    const up = updateLoScore(50, true, 3);
    const down = updateLoScore(50, false, 3);
    expect(up).toBeGreaterThan(50);
    expect(down).toBeLessThan(50);
    let s = 0;
    for (let i = 0; i < 100; i++) s = updateLoScore(s, true, 5);
    expect(s).toBeLessThanOrEqual(100);
  });

  it("updates every LO a question is tagged with", () => {
    const m = applyAttempt({}, { lo: ["a", "b"], difficulty: 2 }, true);
    expect(Object.keys(m).sort()).toEqual(["a", "b"]);
  });

  it("finds weakest LOs", () => {
    expect(weakestLos({ a: 90, b: 10 }, ["a", "b", "c"], 2).map((x) => x.lo)).toEqual(["c", "b"]);
  });
});

describe("review queue", () => {
  it("adds missed questions due tomorrow, climbs the ladder, then graduates", () => {
    let q = scheduleReview([], "x", false, "2026-10-20");
    expect(q).toEqual([{ questionId: "x", step: 0, due: "2026-10-21" }]);
    q = scheduleReview(q, "x", true, "2026-10-21");
    expect(q[0]).toEqual({ questionId: "x", step: 1, due: "2026-10-24" });
    for (const d of ["2026-10-24", "2026-10-31", "2026-11-14", "2026-12-14"]) q = scheduleReview(q, "x", true, d);
    expect(q).toEqual([]);
  });

  it("returns due items", () => {
    const q = [{ questionId: "a", step: 0, due: "2026-10-20" }, { questionId: "b", step: 0, due: "2026-10-25" }];
    expect(dueItems(q, "2026-10-21").map((r) => r.questionId)).toEqual(["a"]);
  });
});

describe("selectQuestions", () => {
  const bank: EngineQuestion[] = Array.from({ length: 12 }, (_, i) => ({
    ...mcq, id: `q${i}`, lo: [i % 2 ? "weak" : "strong"],
  }));

  it("returns the requested count with no duplicates", () => {
    const picked = selectQuestions(bank, { count: 8, mastery: {}, seen: new Set(), rand: mulberry32(1) });
    expect(picked).toHaveLength(8);
    expect(new Set(picked.map((p) => p.id)).size).toBe(8);
  });

  it("avoids the previous attempt's questions when the bank allows", () => {
    const first = selectQuestions(bank, { count: 6, mastery: {}, seen: new Set(), rand: mulberry32(2) });
    const last = new Set(first.map((q) => q.id));
    const second = selectQuestions(bank, { count: 6, mastery: {}, seen: last, lastTest: last, rand: mulberry32(3) });
    expect(second.filter((q) => last.has(q.id))).toHaveLength(0);
  });

  it("balances across LOs", () => {
    const picked = selectQuestions(bank, { count: 4, mastery: { strong: 90, weak: 10 }, seen: new Set(), rand: mulberry32(4) });
    expect(picked.filter((q) => q.lo[0] === "weak")).toHaveLength(2);
    expect(picked[0]!.lo[0]).toBe("weak");
  });
});

describe("progress and readiness", () => {
  it("weights progress by minutes", () => {
    expect(courseProgress([{ id: "a", minutes: 3 }, { id: "b", minutes: 1 }], new Set(["a"]))).toBe(0.75);
  });

  it("applies the on-track rule", () => {
    const topics = [{ topic: "t", weight: 1, score: 80 }];
    expect(readiness({ topicMastery: topics, mocks: [] }).onTrack).toBe(false);
    const mocks = [
      { percent: 78, timed: true, date: "2026-10-01" },
      { percent: 81, timed: true, date: "2026-10-10" },
    ];
    expect(readiness({ topicMastery: topics, mocks }).onTrack).toBe(true);
    expect(readiness({ topicMastery: [{ topic: "t", weight: 1, score: 50 }], mocks }).onTrack).toBe(false);
  });
});
