/**
 * Syllabus coverage report: which official learning outcomes have lessons or questions yet.
 * Usage: pnpm coverage [--gaps]   (--gaps lists every uncovered outcome)
 */
import path from "node:path";
import { loadCourse } from "@ofc/content";

const { course } = loadCourse(path.resolve(import.meta.dirname, "..", "content", "imc"));
if (!course) throw new Error("Content failed to load; run pnpm validate");

const taught = new Set<string>();
const tested = new Set<string>();
for (const s of course.stages) for (const m of s.modules) {
  m.tasks.forEach((t) => t.lo.forEach((lo) => taught.add(lo)));
  m.questions.forEach((q) => q.lo.forEach((lo) => tested.add(lo)));
}

const pct = (n: number, d: number) => `${Math.round((n / d) * 100)}%`.padStart(4);
let all = 0;
let covered = 0;
console.log(`IMC v${course.syllabus.version} syllabus coverage\n`);
console.log("Topic                                                   Outcomes  Taught  Tested");
for (const t of course.syllabus.topics) {
  const los = course.outcomes.outcomes.filter((o) => Number(o.id.split(".")[0]) === t.number);
  const nTaught = los.filter((o) => taught.has(o.id)).length;
  const nTested = los.filter((o) => tested.has(o.id)).length;
  all += los.length;
  covered += los.filter((o) => taught.has(o.id) || tested.has(o.id)).length;
  console.log(`${`${t.number}. ${t.name}`.padEnd(56).slice(0, 56)}${String(los.length).padStart(8)}  ${pct(nTaught, los.length)}    ${pct(nTested, los.length)}`);
}
console.log(`\nOverall: ${covered} of ${all} outcomes have at least one lesson or question (${pct(covered, all).trim()})`);

if (process.argv.includes("--gaps")) {
  console.log("\nUncovered outcomes:");
  for (const o of course.outcomes.outcomes) if (!taught.has(o.id) && !tested.has(o.id)) console.log(`  ${o.id.padEnd(8)} ${o.summary}`);
}
