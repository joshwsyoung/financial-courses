import type { ProgressState } from "./progress";

const later = (a?: string, b?: string) => ((a ?? "") >= (b ?? "") ? a : b);

function unionBy<T>(a: T[], b: T[], key: (x: T) => string): T[] {
  const map = new Map<string, T>();
  for (const x of [...a, ...b]) if (!map.has(key(x))) map.set(key(x), x);
  return [...map.values()];
}

/**
 * Merge progress from two devices without losing work. Completed tasks, attempts, tests,
 * mocks and feedback are unioned. Mastery comes from whichever side has answered more
 * questions (it is derived from those answers). Settings prefer `local`.
 */
export function mergeProgress(local: ProgressState, remote: ProgressState): ProgressState {
  const tasks: ProgressState["tasks"] = { ...remote.tasks };
  for (const [id, t] of Object.entries(local.tasks)) {
    const r = tasks[id];
    if (!r) tasks[id] = t;
    else if (t.status === "done" && r.status !== "done") tasks[id] = t;
    else if (t.status === r.status && later(t.at, r.at) === t.at) tasks[id] = t;
  }

  const attempts = unionBy(local.attempts, remote.attempts, (a) => `${a.questionId}|${a.at}`).sort((x, y) => x.at.localeCompare(y.at));
  const richer = local.attempts.length >= remote.attempts.length ? local : remote;
  const poorer = richer === local ? remote : local;

  const review = unionBy(richer.review, poorer.review, (r) => r.questionId);

  const tests: ProgressState["tests"] = {};
  for (const key of new Set([...Object.keys(local.tests), ...Object.keys(remote.tests)])) {
    tests[key] = unionBy(local.tests[key] ?? [], remote.tests[key] ?? [], (t) => t.at).sort((x, y) => x.at.localeCompare(y.at));
  }

  return {
    version: 1,
    seenWelcome: local.seenWelcome || remote.seenWelcome,
    tasks,
    attempts,
    mastery: { ...poorer.mastery, ...richer.mastery },
    review,
    tests,
    mocks: unionBy(local.mocks, remote.mocks, (m) => m.id),
    settings: { ...remote.settings, ...Object.fromEntries(Object.entries(local.settings).filter(([, v]) => v !== undefined)) } as ProgressState["settings"],
    feedback: unionBy(local.feedback ?? [], remote.feedback ?? [], (f) => f.at).slice(-50),
  };
}
