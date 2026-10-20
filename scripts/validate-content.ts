/**
 * Validates every syllabus under /content. Exits non-zero on any error.
 * Usage: pnpm validate [--strict]   (--strict also fails on warnings)
 */
import fs from "node:fs";
import path from "node:path";
import { checkCourse, loadCourse, type Issue } from "@ofc/content";

const contentDir = path.resolve(import.meta.dirname, "..", "content");
const strict = process.argv.includes("--strict");

const syllabuses = fs
  .readdirSync(contentDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(contentDir, d.name, "syllabus.yml")))
  .map((d) => d.name);

let errors = 0;
let warnings = 0;
for (const id of syllabuses) {
  const { course, issues } = loadCourse(path.join(contentDir, id));
  const all: Issue[] = [...issues, ...(course ? checkCourse(course) : [])];
  const e = all.filter((i) => i.level === "error");
  const w = all.filter((i) => i.level === "warning");
  errors += e.length;
  warnings += w.length;
  const counts = course
    ? `${course.stages.length} stages, ${course.stages.flatMap((s) => s.modules).length} modules, ` +
      `${course.stages.flatMap((s) => s.modules.flatMap((m) => m.tasks)).length} tasks, ` +
      `${course.stages.flatMap((s) => s.modules.flatMap((m) => m.questions)).length} questions`
    : "failed to load";
  console.log(`\n${id}: ${counts}`);
  for (const i of [...e, ...w]) console.log(`  ${i.level === "error" ? "ERROR" : "warn "}  ${i.file}: ${i.message}`);
}

console.log(`\n${errors} error(s), ${warnings} warning(s)`);
if (errors || (strict && warnings)) process.exit(1);
