"use client";

// Local-first progress (spec 9.1): everything lives in this browser's localStorage.
// No account needed. Export/import as JSON from Settings.
import { useSyncExternalStore } from "react";
import {
  applyAttempt,
  scheduleReview,
  today,
  type Attempt,
  type EngineQuestion,
  type MasteryMap,
  type ReviewItem,
} from "@ofc/engine";

export type AttemptContext = "task" | "module-test" | "stage-test" | "mock" | "review" | "drill" | "diagnostic";

export interface LoggedAttempt extends Attempt {
  context: AttemptContext;
}

export interface TestAttempt {
  at: string;
  score: number;
  total: number;
  passed: boolean;
  questionIds: string[];
}

export interface MockRecord {
  id: string;
  paperId: string;
  kind: "official" | "ai";
  unit: string;
  date: string;
  percent: number;
  timed: boolean;
  notes?: string;
}

export interface Settings {
  examDate?: string;
  weeklyHours?: number;
  theme: "system" | "light" | "dark";
}

export interface ProgressState {
  version: 1;
  seenWelcome: boolean;
  tasks: Record<string, { status: "done" | "skipped"; at: string }>;
  attempts: LoggedAttempt[];
  mastery: MasteryMap;
  review: ReviewItem[];
  tests: Record<string, TestAttempt[]>;
  mocks: MockRecord[];
  settings: Settings;
  /** A local copy of feedback this learner has sent, for their own reference. */
  feedback: { at: string; kind: string; page: string; message: string }[];
}

const KEY = "ofc:progress:v1";

export const EMPTY: ProgressState = {
  version: 1,
  seenWelcome: false,
  tasks: {},
  attempts: [],
  mastery: {},
  review: [],
  tests: {},
  mocks: [],
  settings: { theme: "system" },
  feedback: [],
};

let state: ProgressState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = migrate(JSON.parse(raw));
  } catch {
    // Private mode or blocked storage: keep in-memory state for this visit.
  }
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore; progress still works for this session
  }
}

export function migrate(raw: unknown): ProgressState {
  if (!raw || typeof raw !== "object" || (raw as { version?: unknown }).version !== 1) {
    throw new Error("Not a recognised progress file");
  }
  const r = raw as Partial<ProgressState>;
  return { ...EMPTY, ...r, settings: { ...EMPTY.settings, ...r.settings } } as ProgressState;
}

function set(update: (s: ProgressState) => ProgressState) {
  load();
  state = update(state);
  persist();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  load();
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  load();
  return state;
}

/** True after hydration, so client-only UI (like the welcome screen) doesn't flash on load. */
export function useHydrated(): boolean {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

/** Raw store access for the sync layer (not for components; use useProgress there). */
export const store = {
  get: getSnapshot,
  subscribe(cb: () => void) {
    load();
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  replace(next: ProgressState) {
    set(() => next);
  },
};

export const actions = {
  dismissWelcome() {
    set((s) => ({ ...s, seenWelcome: true }));
  },
  markTask(taskId: string, status: "done" | "skipped" = "done") {
    set((s) => ({ ...s, tasks: { ...s.tasks, [taskId]: { status, at: new Date().toISOString() } } }));
  },
  recordAnswer(q: Pick<EngineQuestion, "id" | "lo" | "difficulty">, correct: boolean, context: AttemptContext, timeMs?: number) {
    set((s) => ({
      ...s,
      attempts: [...s.attempts, { questionId: q.id, correct, at: new Date().toISOString(), timeMs, context }],
      mastery: applyAttempt(s.mastery, q, correct),
      review: context === "drill" ? s.review : scheduleReview(s.review, q.id, correct, today()),
    }));
  },
  recordTest(key: string, attempt: TestAttempt) {
    set((s) => ({ ...s, tests: { ...s.tests, [key]: [...(s.tests[key] ?? []), attempt] } }));
  },
  addMock(m: Omit<MockRecord, "id">) {
    set((s) => ({ ...s, mocks: [...s.mocks, { ...m, id: `${m.paperId}-${Date.now()}` }] }));
  },
  removeMock(id: string) {
    set((s) => ({ ...s, mocks: s.mocks.filter((m) => m.id !== id) }));
  },
  updateSettings(patch: Partial<Settings>) {
    set((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },
  logFeedback(f: { kind: string; page: string; message: string }) {
    set((s) => ({ ...s, feedback: [...s.feedback, { ...f, at: new Date().toISOString() }].slice(-50) }));
  },
  importState(json: string) {
    const next = migrate(JSON.parse(json));
    set(() => next);
  },
  exportState(): string {
    load();
    return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
  },
  reset() {
    set(() => ({ ...EMPTY, seenWelcome: true }));
  },
};

export function testKey(kind: "module" | "stage" | "mock", id: string) {
  return `${kind}:${id}`;
}
