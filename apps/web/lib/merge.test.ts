import { describe, expect, it } from "vitest";
import { mergeProgress } from "./merge";
import { EMPTY, type ProgressState } from "./progress";

const base = (patch: Partial<ProgressState>): ProgressState => ({ ...EMPTY, ...patch });

describe("mergeProgress", () => {
  it("keeps work from both devices", () => {
    const phone = base({
      tasks: { a: { status: "done", at: "2026-10-20T10:00:00Z" } },
      attempts: [{ questionId: "q1", correct: true, at: "2026-10-20T10:00:00Z", context: "task" }],
    });
    const laptop = base({
      tasks: { b: { status: "done", at: "2026-10-21T10:00:00Z" } },
      attempts: [{ questionId: "q2", correct: false, at: "2026-10-21T10:00:00Z", context: "task" }],
    });
    const m = mergeProgress(phone, laptop);
    expect(Object.keys(m.tasks).sort()).toEqual(["a", "b"]);
    expect(m.attempts.map((a) => a.questionId)).toEqual(["q1", "q2"]);
  });

  it("never downgrades a done task to skipped", () => {
    const local = base({ tasks: { a: { status: "skipped", at: "2026-10-22T00:00:00Z" } } });
    const remote = base({ tasks: { a: { status: "done", at: "2026-10-20T00:00:00Z" } } });
    expect(mergeProgress(local, remote).tasks.a!.status).toBe("done");
  });

  it("dedupes identical attempts and test results", () => {
    const shared = { questionId: "q1", correct: true, at: "2026-10-20T10:00:00Z", context: "task" as const };
    const t = { at: "2026-10-20T11:00:00Z", score: 7, total: 8, passed: true, questionIds: [] };
    const m = mergeProgress(base({ attempts: [shared], tests: { "module:x": [t] } }), base({ attempts: [shared], tests: { "module:x": [t] } }));
    expect(m.attempts).toHaveLength(1);
    expect(m.tests["module:x"]).toHaveLength(1);
  });

  it("prefers local settings but keeps remote values local hasn't set", () => {
    const m = mergeProgress(
      base({ settings: { theme: "dark" } }),
      base({ settings: { theme: "light", examDate: "2027-03-01", weeklyHours: 6 } }),
    );
    expect(m.settings).toEqual({ theme: "dark", examDate: "2027-03-01", weeklyHours: 6 });
  });
});
