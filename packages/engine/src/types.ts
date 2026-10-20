/** Minimal question shape the engine needs. Content schemas are a superset of this. */
export type QuestionType = "mcq" | "itemset" | "gapfill";

export interface McqOption {
  id: string;
  text: string;
}

export interface GapfillNumeric {
  kind: "numeric";
  value: number;
  /** Absolute tolerance, in the same units as value. */
  tolerance: number;
  units?: string;
}

export interface GapfillText {
  kind: "text";
  accepted: string[];
}

export interface EngineQuestion {
  id: string;
  type: QuestionType;
  lo: string[];
  difficulty: number;
  options?: McqOption[];
  correct?: string;
  answer?: GapfillNumeric | GapfillText;
  /** Item sets: child questions sharing one scenario. */
  parts?: EngineQuestion[];
}

export type Answer = string | number | Record<string, string | number>;

export interface Attempt {
  questionId: string;
  correct: boolean;
  /** ISO timestamp */
  at: string;
  timeMs?: number;
}

/** Per learning outcome mastery, 0 to 100. */
export type MasteryMap = Record<string, number>;

export interface ReviewItem {
  questionId: string;
  /** Index into the interval ladder. */
  step: number;
  /** ISO date (YYYY-MM-DD) when it is next due. */
  due: string;
}
