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

const COMMIT = process.env.NEXT_PUBLIC_COMMIT || "";
const SYLLABUS = process.env.NEXT_PUBLIC_SYLLABUS_VERSION || "";

/** "database" when Supabase is configured for this build, otherwise feedback goes via a GitHub issue. */
export const feedbackChannel: "database" | "github" =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "database" : "github";

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

/** Saves to Supabase: optional screenshot into a private bucket, then an insert-only row. */
export async function saveToDatabase(p: FeedbackPayload, screenshot?: Blob): Promise<void> {
  const { supabase } = await import("./supabase");
  const db = supabase();
  if (!db) throw new Error("Feedback database is not configured");
  let screenshotPath: string | null = null;
  if (screenshot) {
    const ext = screenshot.type === "image/png" ? "png" : screenshot.type === "image/webp" ? "webp" : "jpg";
    screenshotPath = `feedback/${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage.from("fc-feedback-screenshots").upload(screenshotPath, screenshot, { contentType: screenshot.type });
    if (error) throw new Error(`Could not upload the screenshot (${error.message})`);
  }
  const { error } = await db.from("fc_feedback").insert({
    kind: p.kind,
    message: p.message,
    page: p.page,
    task_id: p.taskId ?? null,
    question_id: p.questionId ?? null,
    answer: p.answer ?? null,
    syllabus_version: SYLLABUS || null,
    app_commit: COMMIT || null,
    screenshot_path: screenshotPath,
  });
  if (error) throw new Error(`Could not save feedback (${error.message})`);
}

/** Captures what the learner can currently see, as a JPEG no wider than 1280px. */
export async function captureViewport(): Promise<Blob | null> {
  try {
    const { toBlob } = await import("html-to-image");
    const root = document.documentElement;
    const scale = Math.min(1, 1280 / window.innerWidth);
    return await toBlob(root, {
      type: "image/jpeg",
      quality: 0.8,
      pixelRatio: scale,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      style: { transform: `translate(${-window.scrollX}px, ${-window.scrollY}px)`, transformOrigin: "top left" },
      filter: (node) => !(node instanceof HTMLElement && node.dataset.noScreenshot !== undefined),
    });
  } catch {
    return null;
  }
}
