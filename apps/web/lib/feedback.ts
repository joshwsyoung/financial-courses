import { REPO_URL } from "./site";

export const FEEDBACK_KINDS = [
  { id: "wrong", label: "Answer looks wrong" },
  { id: "unclear", label: "Unclear or confusing" },
  { id: "typo", label: "Typo or formatting" },
  { id: "difficulty", label: "Too hard or too easy" },
  { id: "idea", label: "Idea or request" },
  { id: "other", label: "Something else" },
] as const;

export type FeedbackKind = (typeof FEEDBACK_KINDS)[number]["id"];

export interface FeedbackContext {
  page: string;
  taskId?: string;
  questionId?: string;
  /** What the learner had selected or typed, if anything. */
  answer?: string;
}

export interface FeedbackPayload extends FeedbackContext {
  kind: FeedbackKind;
  message: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const COMMIT = process.env.NEXT_PUBLIC_COMMIT || "";
const SYLLABUS = process.env.NEXT_PUBLIC_SYLLABUS_VERSION || "";

/** "database" when Supabase is configured for this build, otherwise feedback goes via a GitHub issue. */
export const feedbackChannel: "database" | "github" = SUPABASE_URL && SUPABASE_KEY ? "database" : "github";

export function contextLines(p: FeedbackPayload): string[] {
  return [
    `Page: ${p.page}`,
    p.taskId && `Task: ${p.taskId}`,
    p.questionId && `Question: ${p.questionId}`,
    p.answer && `Learner's answer: ${p.answer}`,
    SYLLABUS && `Syllabus version: ${SYLLABUS}`,
    COMMIT && `App version: ${COMMIT.slice(0, 7)}`,
  ].filter((l): l is string => !!l);
}

export function githubIssueUrl(p: FeedbackPayload): string {
  const kind = FEEDBACK_KINDS.find((k) => k.id === p.kind)?.label ?? p.kind;
  const subject = p.questionId ?? p.taskId ?? p.page;
  const params = new URLSearchParams({
    template: "feedback.yml",
    title: `[Feedback] ${kind}: ${subject}`,
    kind,
    context: contextLines(p).join("\n"),
    details: p.message,
  });
  return `${REPO_URL}/issues/new?${params.toString()}`;
}

/** Saves to Supabase (insert-only table, see supabase/migrations). Throws on failure. */
export async function saveToDatabase(p: FeedbackPayload): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      kind: p.kind,
      message: p.message,
      page: p.page,
      task_id: p.taskId ?? null,
      question_id: p.questionId ?? null,
      answer: p.answer ?? null,
      syllabus_version: SYLLABUS || null,
      app_commit: COMMIT || null,
    }),
  });
  if (!res.ok) throw new Error(`Could not save feedback (${res.status})`);
}
