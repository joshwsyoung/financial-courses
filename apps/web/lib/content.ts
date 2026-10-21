import "server-only";
import path from "node:path";
import { loadCourse, type Course, type LoadedModule, type LoadedStage } from "@ofc/content";
import { marked } from "marked";
import type { ClientQuestion, CourseIndex, TaskDetail } from "./types";

const CONTENT_ROOT = path.resolve(process.cwd(), "../../content/imc");

let cached: Course | null = null;

export function getCourse(): Course {
  if (cached) return cached;
  const { course, issues } = loadCourse(CONTENT_ROOT);
  const errors = issues.filter((i) => i.level === "error");
  if (!course || errors.length) {
    throw new Error(`Content failed to load. Run "pnpm validate".\n${errors.map((e) => `${e.file}: ${e.message}`).join("\n")}`);
  }
  cached = course;
  return course;
}

function toClientQuestion(q: LoadedModule["questions"][number]): ClientQuestion {
  return {
    id: q.id,
    type: q.type,
    unit: q.unit,
    lo: q.lo,
    difficulty: q.difficulty,
    stem: q.stem,
    scenario: q.scenario,
    options: q.options,
    correct: q.correct,
    answer: q.answer,
    explanation: q.explanation,
    distractor_notes: q.distractor_notes,
    tax_year: q.tax_year,
    origin: q.origin,
    status: q.status,
    parts: q.parts?.map((p) => ({
      ...p,
      unit: q.unit,
      tax_year: q.tax_year,
      origin: q.origin,
      status: q.status,
    })),
  };
}

export function getCourseIndex(): CourseIndex {
  const c = getCourse();
  const questions: Record<string, ClientQuestion> = {};
  for (const s of c.stages) for (const m of s.modules) for (const q of m.questions) {
    if (q.status !== "retired") questions[q.id] = toClientQuestion(q);
  }
  return {
    syllabus: {
      id: c.syllabus.id,
      name: c.syllabus.name,
      short_name: c.syllabus.short_name,
      awarding_body: c.syllabus.awarding_body,
      version: c.syllabus.version,
      valid_from: c.syllabus.valid_from,
      valid_to: c.syllabus.valid_to,
      units: c.syllabus.units,
      topics: c.syllabus.topics,
      los: c.syllabus.los,
    },
    stages: c.stages.map((s) => ({
      id: s.id,
      title: s.title,
      unit: s.unit,
      topic: s.topic,
      summary: s.summary,
      test: s.test,
      modules: s.modules.map((m) => ({
        id: m.id,
        title: m.title,
        summary: m.summary,
        los: m.los,
        status: m.status,
        test: { count: m.test.count, pass_mark: m.test.pass_mark },
        tasks: m.tasks.map((t) => ({ id: t.id, type: t.type, title: t.title, minutes: t.minutes, lo: t.lo })),
        questionIds: m.questions.filter((q) => q.status !== "retired").map((q) => q.id),
      })),
    })),
    questions,
    officialPapers: c.officialPapers.papers,
  };
}

export function findStage(stageId: string): LoadedStage {
  const s = getCourse().stages.find((x) => x.id === stageId);
  if (!s) throw new Error(`Unknown stage ${stageId}`);
  return s;
}

export function findModule(stageId: string, moduleId: string): LoadedModule {
  const m = findStage(stageId).modules.find((x) => x.id === moduleId);
  if (!m) throw new Error(`Unknown module ${moduleId}`);
  return m;
}

export function getTaskDetail(stageId: string, moduleId: string, taskId: string): TaskDetail {
  const t = findModule(stageId, moduleId).tasks.find((x) => x.id === taskId);
  if (!t) throw new Error(`Unknown task ${taskId}`);
  return {
    id: t.id,
    type: t.type,
    title: t.title,
    minutes: t.minutes,
    lo: t.lo,
    html: t.body ? (marked.parse(t.body, { async: false }) as string) : undefined,
    question: t.question,
    front: t.front,
    back: t.back,
    video: t.video,
    drill: t.drill,
    memory: t.memory,
  };
}

/** Every distinct source cited anywhere in the content, for the licences page. */
export function getAllSources(): string[] {
  const c = getCourse();
  const set = new Set<string>([...c.syllabus.provenance.sources, ...c.examInfo.sources]);
  for (const t of c.taxTables) t.provenance.sources.forEach((s) => set.add(s));
  for (const s of c.stages) {
    s.provenance.sources.forEach((x) => set.add(x));
    for (const m of s.modules) {
      m.provenance.sources.forEach((x) => set.add(x));
      m.tasks.forEach((t) => t.frontMatter?.sources.forEach((x) => set.add(x)));
      m.questions.forEach((q) => q.provenance.sources.forEach((x) => set.add(x)));
    }
  }
  set.delete("original");
  return [...set].sort();
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
