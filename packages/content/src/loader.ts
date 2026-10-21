import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import YAML from "yaml";
import type { z } from "zod";
import * as S from "./schemas";

export interface Issue {
  level: "error" | "warning";
  file: string;
  message: string;
}

export interface LoadedTask extends S.Task {
  /** Markdown body for file-backed tasks. */
  body?: string;
  frontMatter?: z.infer<typeof S.taskFrontMatter>;
}

export interface LoadedModule extends S.Module {
  dir: string;
  tasks: LoadedTask[];
  tasksProvenance: S.Provenance;
  questions: S.Question[];
  test: S.ModuleTest;
}

export interface LoadedStage extends S.Stage {
  dir: string;
  modules: LoadedModule[];
}

export interface Course {
  root: string;
  syllabus: S.Syllabus;
  outcomes: S.OutcomesFile;
  stages: LoadedStage[];
  examInfo: S.ExamInfo;
  taxTables: S.TaxTable[];
  officialPapers: S.OfficialPapers;
}

export interface LoadResult {
  course: Course | null;
  issues: Issue[];
}

function rel(root: string, file: string) {
  return path.relative(path.dirname(root), file);
}

function readYaml<T extends z.ZodTypeAny>(file: string, schema: T, root: string, issues: Issue[]): z.infer<T> | null {
  if (!fs.existsSync(file)) {
    issues.push({ level: "error", file: rel(root, file), message: "file missing" });
    return null;
  }
  let raw: unknown;
  try {
    raw = YAML.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    issues.push({ level: "error", file: rel(root, file), message: `YAML parse error: ${(e as Error).message}` });
    return null;
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    for (const err of parsed.error.issues) {
      issues.push({ level: "error", file: rel(root, file), message: `${err.path.join(".") || "(root)"}: ${err.message}` });
    }
    return null;
  }
  return parsed.data;
}

function subdirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => path.join(dir, d.name)).sort();
}

function yamlFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort().map((f) => path.join(dir, f));
}

/** Load one syllabus (e.g. content/imc). Never throws on content problems; reports issues instead. */
export function loadCourse(syllabusRoot: string): LoadResult {
  const issues: Issue[] = [];
  const root = path.resolve(syllabusRoot);
  const syllabus = readYaml(path.join(root, "syllabus.yml"), S.syllabus, root, issues);
  const examInfo = readYaml(path.join(root, "exam-info.yml"), S.examInfo, root, issues);
  const officialPapers = readYaml(path.join(root, "passpapers", "official.yml"), S.officialPapers, root, issues);
  const taxTables = yamlFiles(path.join(root, "tax-tables"))
    .map((f) => readYaml(f, S.taxTable, root, issues))
    .filter((t): t is S.TaxTable => t !== null);
  if (!syllabus || !examInfo || !officialPapers) return { course: null, issues };

  const versionDir = path.join(root, syllabus.current_dir);
  const outcomes = readYaml(path.join(versionDir, "outcomes.yml"), S.outcomesFile, root, issues);
  if (!outcomes) return { course: null, issues };
  const stages: LoadedStage[] = [];
  for (const stageDir of subdirs(versionDir)) {
    const stage = readYaml(path.join(stageDir, "stage.yml"), S.stage, root, issues);
    if (!stage) continue;
    const modules: LoadedModule[] = [];
    for (const moduleDir of subdirs(stageDir)) {
      const mod = readYaml(path.join(moduleDir, "module.yml"), S.module, root, issues);
      const tasksFile = readYaml(path.join(moduleDir, "tasks.yml"), S.tasksFile, root, issues);
      const test = readYaml(path.join(moduleDir, "module-test.yml"), S.moduleTest, root, issues);
      if (!mod || !tasksFile || !test) continue;
      const questions = yamlFiles(path.join(moduleDir, "questions"))
        .map((f) => {
          const q = readYaml(f, S.question, root, issues);
          if (q && path.basename(f).replace(/\.ya?ml$/, "") !== q.id) {
            issues.push({ level: "error", file: rel(root, f), message: `file name must match question id "${q.id}"` });
          }
          return q;
        })
        .filter((q): q is S.Question => q !== null);
      const tasks: LoadedTask[] = tasksFile.tasks.map((t) => {
        if (!t.file) return t;
        const file = path.join(moduleDir, "tasks", t.file);
        if (!fs.existsSync(file)) {
          issues.push({ level: "error", file: rel(root, file), message: `task "${t.id}" references a missing file` });
          return t;
        }
        const { data, content } = matter(fs.readFileSync(file, "utf8"));
        const fm = S.taskFrontMatter.safeParse(normaliseDates(data));
        if (!fm.success) {
          for (const err of fm.error.issues) {
            issues.push({ level: "error", file: rel(root, file), message: `front matter ${err.path.join(".")}: ${err.message}` });
          }
        }
        return { ...t, body: content.trim(), frontMatter: fm.success ? fm.data : undefined };
      });
      modules.push({ ...mod, dir: rel(root, moduleDir), tasks, tasksProvenance: tasksFile.provenance, questions, test });
    }
    modules.sort((a, b) => a.order - b.order);
    stages.push({ ...stage, dir: rel(root, stageDir), modules });
  }
  stages.sort((a, b) => a.order - b.order);
  return { course: { root, syllabus, outcomes, stages, examInfo, taxTables, officialPapers }, issues };
}

/** gray-matter parses bare YAML dates into Date objects; schemas expect strings. */
function normaliseDates(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v instanceof Date ? v.toISOString().slice(0, 10) : v]),
  );
}
