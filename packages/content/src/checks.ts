import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { evaluate } from "@ofc/engine";
import type { Course, Issue, LoadedModule } from "./loader";
import * as S from "./schemas";

export interface CheckOptions {
  /** Treat as "today" for staleness checks. */
  now?: Date;
  /** Months after which last_verified triggers a warning (spec 13). */
  staleMonths?: number;
}

const WORD_LIMITS: Partial<Record<S.TaskType, [number, number]>> = {
  read: [120, 330],
  eli5: [60, 260],
  worked_example: [60, 400],
  diagram: [10, 200],
};

export function countWords(md: string): number {
  const text = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<svg[\s\S]*?<\/svg>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`|[\]()-]/g, " ");
  return text.split(/\s+/).filter((w) => /[A-Za-z0-9£%]/.test(w)).length;
}

/** Average words per sentence: a cheap reading-level proxy. */
export function avgSentenceLength(md: string): number {
  const prose = md.replace(/```[\s\S]*?```/g, " ").replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/^\s*[|#].*$/gm, " ");
  const sentences = prose.split(/[.!?]+\s/).map((s) => s.trim()).filter((s) => countWords(s) > 2);
  if (!sentences.length) return 0;
  return sentences.reduce((n, s) => n + countWords(s), 0) / sentences.length;
}

function monthsBetween(a: Date, b: Date) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

export function checkCourse(course: Course, opts: CheckOptions = {}): Issue[] {
  const issues: Issue[] = [];
  const now = opts.now ?? new Date();
  const staleMonths = opts.staleMonths ?? 12;
  const err = (file: string, message: string) => issues.push({ level: "error", file, message });
  const warn = (file: string, message: string) => issues.push({ level: "warning", file, message });

  const { syllabus, outcomes } = course;
  const loIds = new Set(outcomes.outcomes.map((l) => l.id));
  const topicIds = new Set(syllabus.topics.map((t) => t.id));
  const areaIds = new Set(syllabus.areas.map((a) => a.id));
  const sectionIds = new Set(outcomes.sections.map((s) => s.id));
  const topicNumbers = new Set(syllabus.topics.map((t) => t.number));
  const unitIds = new Set(syllabus.units.map((u) => u.id));
  const taxYears = new Set(course.taxTables.map((t) => t.tax_year));
  const banned = loadBanned(course.root);

  const checkDate = (file: string, label: string, date: string) => {
    const d = new Date(`${date}T00:00:00Z`);
    if (d > now) err(file, `${label} ${date} is in the future`);
    else if (monthsBetween(d, now) >= staleMonths) warn(file, `${label} ${date} is over ${staleMonths} months old; re-verify`);
  };
  const checkBanned = (file: string, text: string) => {
    for (const b of banned) if (new RegExp(b.pattern, "i").test(text)) err(file, `banned phrase /${b.pattern}/: ${b.reason}`);
  };

  // Syllabus structure
  for (const a of syllabus.areas) if (!unitIds.has(a.unit)) err("syllabus.yml", `area ${a.id} references unknown unit ${a.unit}`);
  for (const t of syllabus.topics) {
    if (!unitIds.has(t.unit)) err("syllabus.yml", `topic ${t.id} references unknown unit ${t.unit}`);
    if (!areaIds.has(t.area)) err("syllabus.yml", `topic ${t.id} references unknown area ${t.area}`);
  }
  const outFile = `${syllabus.current_dir}/outcomes.yml`;
  if (outcomes.syllabus_version !== syllabus.version) err(outFile, `is for version ${outcomes.syllabus_version}, syllabus is ${syllabus.version}`);
  const seenLo = new Set<string>();
  for (const lo of outcomes.outcomes) {
    if (seenLo.has(lo.id)) err(outFile, `duplicate outcome ${lo.id}`);
    seenLo.add(lo.id);
    if (!lo.id.startsWith(`${lo.section}.`)) err(outFile, `outcome ${lo.id} is not in section ${lo.section}`);
    if (!sectionIds.has(lo.section)) err(outFile, `outcome ${lo.id} references unknown section ${lo.section}`);
    if (!topicNumbers.has(Number(lo.id.split(".")[0]))) err(outFile, `outcome ${lo.id} has no matching topic`);
    if (/^(explain|identify|describe|calculate|define|distinguish|apply|analyse|evaluate)\b/i.test(lo.summary)) {
      warn(outFile, `summary for ${lo.id} starts with a command word; describe the topic instead`);
    }
  }
  checkDate("syllabus.yml", "last_verified", syllabus.provenance.last_verified);
  checkDate("exam-info.yml", "last_verified", course.examInfo.last_verified);
  for (const t of course.taxTables) checkDate(`tax-tables/${t.tax_year}.yml`, "last_verified", t.provenance.last_verified);

  // Global id uniqueness
  const seen = new Map<string, string>();
  const unique = (kind: string, id: string, file: string) => {
    const key = `${kind}:${id}`;
    if (seen.has(key)) err(file, `duplicate ${kind} id "${id}" (also in ${seen.get(key)})`);
    else seen.set(key, file);
  };

  for (const stage of course.stages) {
    unique("stage", stage.id, stage.dir);
    if (!unitIds.has(stage.unit)) err(`${stage.dir}/stage.yml`, `unknown unit ${stage.unit}`);
    if (!topicIds.has(stage.topic)) err(`${stage.dir}/stage.yml`, `unknown topic ${stage.topic}`);
    const stageBank = stage.modules.reduce((n, m) => n + m.questions.length, 0);
    if (stageBank < stage.test.count) err(`${stage.dir}/stage.yml`, `stage test needs ${stage.test.count} questions but the stage bank has ${stageBank}`);
    for (const mod of stage.modules) checkModule(mod);
  }
  return issues;

  function checkModule(mod: LoadedModule) {
    const dir = mod.dir;
    unique("module", mod.id, dir);
    for (const lo of mod.los) if (!loIds.has(lo)) err(`${dir}/module.yml`, `unknown LO ${lo}`);
    checkDate(`${dir}/module.yml`, "last_verified", mod.provenance.last_verified);

    const n = mod.tasks.length;
    if (n < 10 || n > 15) warn(`${dir}/tasks.yml`, `module has ${n} tasks; target is 10 to 15`);
    const minutes = mod.tasks.reduce((s, t) => s + t.minutes, 0);
    if (minutes > 30) warn(`${dir}/tasks.yml`, `module is about ${minutes} min; target is 10 to 30`);

    const qById = new Map(mod.questions.map((q) => [q.id, q]));
    const teach = mod.tasks.filter((t) => ["read", "eli5", "diagram", "video", "audio", "worked_example"].includes(t.type)).length;
    if (n && teach / n > 0.6) warn(`${dir}/tasks.yml`, `teaching share is ${Math.round((teach / n) * 100)}%; aim for about 40%`);

    for (const t of mod.tasks) {
      const where = `${dir}/tasks.yml#${t.id}`;
      unique("task", t.id, where);
      for (const lo of t.lo) if (!loIds.has(lo)) err(where, `unknown LO ${lo}`);
      if (S.FILE_TASK_TYPES.includes(t.type)) {
        if (!t.file) err(where, `${t.type} task needs a "file"`);
        if (t.body !== undefined) {
          const file = `${dir}/tasks/${t.file}`;
          const words = countWords(t.body);
          const limits = WORD_LIMITS[t.type];
          if (limits && (words < limits[0] || words > limits[1])) warn(file, `${words} words; expected ${limits[0]} to ${limits[1]} for ${t.type}`);
          const asl = avgSentenceLength(t.body);
          if (asl > 26) warn(file, `average sentence is ${asl.toFixed(0)} words; aim for plain English (under 26)`);
          checkBanned(file, t.body);
          if (t.frontMatter) checkDate(file, "last_verified", t.frontMatter.last_verified);
        }
      }
      if (t.type === "question" && (!t.question || !qById.has(t.question))) err(where, `question task references unknown question "${t.question}"`);
      if (t.type === "flashcard" && (!t.front || !t.back)) err(where, "flashcard needs front and back");
      if (t.type === "video" && !t.video) err(where, "video task needs a video block");
      if (t.type === "video" && t.video && !t.video.transcript) warn(where, "video has no transcript (WCAG 2.2 AA)");
      if (t.type === "memory_aid") {
        if (!t.memory) err(where, "memory_aid needs a memory block");
        else if (t.memory.device.letters) {
          const first = t.memory.items.map((i) => i.label.trim()[0]?.toUpperCase()).join("");
          if (first !== t.memory.device.letters) err(where, `memory aid letters ${t.memory.device.letters} do not match item initials ${first}`);
        }
      }
      if (t.type === "calc_drill") {
        if (!t.drill) err(where, "calc_drill needs a drill block");
        else {
          const mid = Object.fromEntries(Object.entries(t.drill.inputs).map(([k, r]) => [k, (r.min + r.max) / 2]));
          try { evaluate(t.drill.formula, mid); } catch (e) { err(where, `drill formula: ${(e as Error).message}`); }
        }
      }
    }

    // Lists of 6+ items are hard to memorise; nudge authors to add a memory aid for that LO.
    const aidLos = new Set(mod.tasks.filter((t) => t.type === "memory_aid").flatMap((t) => t.lo));
    for (const t of mod.tasks) {
      if (!t.body) continue;
      if (longestList(t.body) >= 6 && !t.lo.some((lo) => aidLos.has(lo))) {
        warn(`${dir}/tasks/${t.file}`, "has a list of 6+ items with no memory_aid task for its LO; consider adding one");
      }
    }

    const pool = mod.questions.filter((q) => q.status !== "retired")
      .filter((q) => !mod.test.select.los.length || q.lo.some((lo) => mod.test.select.los.includes(lo)))
      .filter((q) => !mod.test.select.tags.length || q.tags.some((tg) => mod.test.select.tags.includes(tg)));
    if (pool.length < mod.test.count) err(`${dir}/module-test.yml`, `test needs ${mod.test.count} questions; pool has ${pool.length}`);
    else if (pool.length < mod.test.count * 1.5) warn(`${dir}/module-test.yml`, `pool of ${pool.length} is under 1.5x the test size; retakes will repeat questions`);

    for (const q of mod.questions) checkQuestion(q, `${dir}/questions/${q.id}.yml`);
  }

  function checkQuestion(q: S.Question, file: string) {
    unique("question", q.id, file);
    if (!unitIds.has(q.unit)) err(file, `unknown unit ${q.unit}`);
    if (q.tax_year && !taxYears.has(q.tax_year)) err(file, `tax_year ${q.tax_year} has no tax-tables file`);
    if (!q.syllabus_versions.includes(syllabus.version)) warn(file, `not tagged for current syllabus version ${syllabus.version}`);
    if (q.status === "published" && q.reviewed_by.length === 0) err(file, "published questions need at least one reviewer");
    if (q.origin !== "human" && q.status === "published" && q.reviewed_by.length === 0) err(file, "AI content must be reviewed before publishing");
    checkDate(file, "last_verified", q.provenance.last_verified);
    checkBanned(file, [q.stem, q.scenario ?? "", q.explanation].join("\n"));
    const parts: S.QuestionPart[] = q.type === "itemset" ? q.parts ?? [] : [q as S.QuestionPart];
    if (q.type === "itemset" && (parts.length < 3 || parts.length > 4)) warn(file, "item sets should have 3 to 4 linked questions");
    if (q.type === "itemset" && !q.scenario) err(file, "item set needs a scenario");
    for (const p of parts) {
      const at = p === q ? file : `${file}#${p.id}`;
      for (const lo of p.lo) if (!loIds.has(lo)) err(at, `unknown LO ${lo}`);
      if (p.type === "mcq") {
        const ids = (p.options ?? []).map((o) => o.id);
        if (ids.length < 3) err(at, "MCQ needs at least 3 options");
        if (new Set(ids).size !== ids.length) err(at, "duplicate option ids");
        if (!p.correct || !ids.includes(p.correct)) err(at, `correct answer "${p.correct}" is not an option`);
        for (const id of ids) {
          if (id !== p.correct && !p.distractor_notes?.[id]) err(at, `option ${id} needs a distractor note explaining why it is wrong`);
        }
      }
      if (p.type === "gapfill" && !p.answer) err(at, "gap-fill needs an answer block");
      if (p.calc) checkCalc(p, at);
    }
  }

  function checkCalc(p: S.QuestionPart, at: string) {
    const calc = p.calc!;
    let value: number;
    try {
      value = evaluate(calc.formula, calc.inputs);
    } catch (e) {
      err(at, `calc formula: ${(e as Error).message}`);
      return;
    }
    let expected: number | null = null;
    if (p.type === "gapfill" && p.answer?.kind === "numeric") expected = p.answer.value;
    if (p.type === "mcq") {
      const text = p.options?.find((o) => o.id === p.correct)?.text ?? "";
      const m = text.replace(/[£,]/g, "").match(/-?\d+(\.\d+)?/);
      expected = m ? Number(m[0]) : null;
    }
    if (expected === null) err(at, "calc present but no numeric answer to compare");
    else if (Math.abs(expected - value) > calc.tolerance + 1e-9) {
      err(at, `recomputed answer ${value.toFixed(4)} does not match stated answer ${expected} (tolerance ${calc.tolerance})`);
    }
  }
}

/** Length of the longest run of consecutive Markdown list items. */
export function longestList(md: string): number {
  let best = 0;
  let run = 0;
  for (const line of md.split("\n")) {
    if (/^\s*([-*+]|\d+\.)\s+\S/.test(line)) best = Math.max(best, ++run);
    else if (line.trim() !== "") run = 0;
  }
  return best;
}

function loadBanned(root: string) {
  const file = path.join(path.dirname(root), "banned-phrases.yml");
  if (!fs.existsSync(file)) return [];
  return S.bannedPhrases.parse(YAML.parse(fs.readFileSync(file, "utf8"))).phrases;
}
