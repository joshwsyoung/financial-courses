import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const slug = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "lowercase letters, numbers and dashes only");
const loId = z.string().min(1);

/** Spec 4.3: every content file carries provenance. CI fails if any field is missing. */
export const provenance = z.object({
  sources: z.array(z.string().min(1)).min(1),
  licence: z.string().min(1),
  last_verified: isoDate,
  author: z.string().min(1),
  reviewer: z.string().min(1),
});
export type Provenance = z.infer<typeof provenance>;

export const status = z.enum(["draft", "review", "published", "retired"]);
export const origin = z.enum(["human", "ai_generated", "ai_assisted"]);

export const unit = z.object({
  id: slug,
  name: z.string(),
  questions: z.number().int().positive(),
  duration_min: z.number().int().positive(),
  pass_mark_range: z.tuple([z.number(), z.number()]),
  recommended_hours: z.number().positive(),
});

/** A content area groups topics and carries CFA UK's published question allocation. */
export const contentArea = z.object({
  id: slug,
  unit: slug,
  name: z.string(),
  /** Range of exam questions CFA UK says to expect from this area. */
  questions: z.tuple([z.number().int(), z.number().int()]),
});

export const topic = z.object({
  id: slug,
  number: z.number().int().positive(),
  unit: slug,
  area: slug,
  name: z.string(),
});

export const syllabus = z.object({
  id: slug,
  name: z.string(),
  short_name: z.string(),
  awarding_body: z.string(),
  version: z.string(),
  valid_from: isoDate,
  valid_to: isoDate,
  current_dir: z.string(),
  /** Where learners can read CFA UK's exact wording. */
  official_url: z.string().url(),
  units: z.array(unit.extend({ official_doc: z.string() })).min(1),
  areas: z.array(contentArea).min(1),
  topics: z.array(topic).min(1),
  notes: z.array(z.string()).default([]),
  provenance,
});
export type Syllabus = z.infer<typeof syllabus>;

export const commandWord = z.enum([
  "identify", "define", "describe", "explain", "distinguish", "differentiate", "compare", "contrast",
  "classify", "calculate", "interpret", "determine", "apply", "analyse", "evaluate", "critically evaluate", "select",
]);
export type CommandWord = z.infer<typeof commandWord>;

/**
 * One official learning outcome. `id`, `section`, `group` and `verbs` are facts taken from the
 * published syllabus; `summary` is our own paraphrase. Official wording is never stored here.
 */
export const learningOutcome = z.object({
  id: z.string().regex(/^\d+\.\d+\.\d+$/),
  section: z.string().regex(/^\d+\.\d+$/),
  group: z.string().optional(),
  verbs: z.array(commandWord).min(1),
  summary: z.string().min(1),
});
export type LearningOutcome = z.infer<typeof learningOutcome>;

export const outcomesFile = z.object({
  syllabus_version: z.string(),
  sections: z.array(z.object({ id: z.string().regex(/^\d+\.\d+$/), title: z.string() })).min(1),
  outcomes: z.array(learningOutcome).min(1),
  provenance,
});
export type OutcomesFile = z.infer<typeof outcomesFile>;

export const stage = z.object({
  id: slug,
  title: z.string(),
  unit: slug,
  topic: slug,
  order: z.number().int(),
  summary: z.string(),
  test: z.object({ count: z.number().int().positive(), pass_mark: z.number().min(0).max(1) }),
  provenance,
});
export type Stage = z.infer<typeof stage>;

export const module = z.object({
  id: slug,
  title: z.string(),
  order: z.number().int(),
  summary: z.string(),
  los: z.array(loId).min(1),
  status,
  provenance,
});
export type Module = z.infer<typeof module>;

export const taskType = z.enum([
  "read", "eli5", "diagram", "video", "audio", "worked_example",
  "question", "flashcard", "calc_drill", "teach_back", "memory_aid",
]);
export type TaskType = z.infer<typeof taskType>;

/** Types whose body lives in a Markdown file under tasks/. */
export const FILE_TASK_TYPES: TaskType[] = ["read", "eli5", "diagram", "worked_example", "teach_back"];

export const calcDrill = z.object({
  prompt: z.string(),
  /** Inputs drawn uniformly from [min, max] rounded to `step`. */
  inputs: z.record(z.object({ min: z.number(), max: z.number(), step: z.number().positive() })),
  formula: z.string(),
  tolerance: z.number().nonnegative(),
  units: z.string().optional(),
  rounds: z.number().int().positive().default(5),
});

/**
 * A memory aid for lists of roughly 5+ items learners must recall (e.g. the COCON rules).
 * `letters` is optional: when present, CI checks it matches the first letter of each item.
 */
export const memoryAid = z.object({
  intro: z.string().optional(),
  items: z.array(z.object({ label: z.string().min(1), detail: z.string().optional() })).min(3),
  device: z.object({
    kind: z.enum(["acronym", "phrase", "story", "chunks"]),
    text: z.string().min(1),
    letters: z.string().regex(/^[A-Z]+$/).optional(),
  }),
  ordered: z.boolean().default(true),
});
export type MemoryAid = z.infer<typeof memoryAid>;

export const task = z.object({
  id: slug,
  type: taskType,
  title: z.string(),
  minutes: z.number().min(0.5).max(3),
  lo: z.array(loId).min(1),
  file: z.string().optional(),
  question: z.string().optional(),
  front: z.string().optional(),
  back: z.string().optional(),
  video: z.object({ url: z.string().url(), licence: z.string(), embed: z.boolean(), transcript: z.string().optional() }).optional(),
  drill: calcDrill.optional(),
  memory: memoryAid.optional(),
});
export type Task = z.infer<typeof task>;

export const tasksFile = z.object({ provenance, tasks: z.array(task).min(1) });

export const option = z.object({ id: z.string().min(1), text: z.string().min(1) });

const gapfillAnswer = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("numeric"), value: z.number(), tolerance: z.number().nonnegative(), units: z.string().optional() }),
  z.object({ kind: z.literal("text"), accepted: z.array(z.string().min(1)).min(1) }),
]);

const calc = z.object({
  formula: z.string(),
  inputs: z.record(z.number()),
  tolerance: z.number().nonnegative(),
});

const questionPart = z.object({
  id: z.string().min(1),
  type: z.enum(["mcq", "gapfill"]),
  lo: z.array(loId).min(1),
  difficulty: z.number().int().min(1).max(5),
  stem: z.string().min(1),
  options: z.array(option).optional(),
  correct: z.string().optional(),
  answer: gapfillAnswer.optional(),
  explanation: z.string().min(1),
  distractor_notes: z.record(z.string()).optional(),
  calc: calc.optional(),
});

export const question = questionPart.extend({
  type: z.enum(["mcq", "itemset", "gapfill"]),
  unit: slug,
  tags: z.array(z.string()).default([]),
  tax_year: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
  syllabus_versions: z.array(z.string()).min(1),
  scenario: z.string().optional(),
  parts: z.array(questionPart).optional(),
  source_refs: z.array(z.string()).default([]),
  origin,
  reviewed_by: z.array(z.string()),
  status,
  provenance,
});
export type Question = z.infer<typeof question>;
export type QuestionPart = z.infer<typeof questionPart>;

export const moduleTest = z.object({
  count: z.number().int().positive(),
  pass_mark: z.number().min(0).max(1),
  /** Pull from the module's bank, filtered by LO and/or tag. Empty means the whole bank. */
  select: z.object({ los: z.array(loId).default([]), tags: z.array(z.string()).default([]) }).default({}),
});
export type ModuleTest = z.infer<typeof moduleTest>;

/** Front matter of a Markdown task body. */
export const taskFrontMatter = provenance.extend({ title: z.string().optional() });

export const examFee = z.object({ item: z.string(), amount_gbp: z.number().nullable(), note: z.string() });
export const examInfo = z.object({
  last_verified: isoDate,
  sources: z.array(z.string().url()).min(1),
  fees: z.array(examFee),
  delivery: z.string(),
  calculator_policy_url: z.string().url(),
  disclaimer: z.string(),
});
export type ExamInfo = z.infer<typeof examInfo>;

export const taxTable = z.object({
  tax_year: z.string().regex(/^\d{4}-\d{2}$/),
  jurisdiction: z.string(),
  status,
  values: z.record(z.object({ value: z.number(), units: z.string(), note: z.string().optional() })),
  provenance,
});
export type TaxTable = z.infer<typeof taxTable>;

export const officialPapers = z.object({
  last_verified: isoDate,
  papers: z.array(z.object({
    id: slug,
    unit: slug,
    title: z.string(),
    url: z.string().url(),
    syllabus_version: z.string(),
    current: z.boolean(),
    note: z.string().optional(),
  })),
});
export type OfficialPapers = z.infer<typeof officialPapers>;

export const bannedPhrases = z.object({
  phrases: z.array(z.object({ pattern: z.string(), reason: z.string() })),
});
