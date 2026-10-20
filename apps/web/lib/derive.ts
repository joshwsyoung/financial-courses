import { averageMastery, courseProgress, minutesRemaining, weakestLos } from "@ofc/engine";
import type { ProgressState } from "./progress";
import type { CourseIndex, ModuleSummary, StageSummary, TaskSummary } from "./types";

export interface FlatTask extends TaskSummary {
  stage: StageSummary;
  module: ModuleSummary;
  href: string;
}

export function taskHref(stageId: string, moduleId: string, taskId: string) {
  return `/learn/${stageId}/${moduleId}/${taskId}/`;
}

export function flatTasks(course: CourseIndex, unit?: string): FlatTask[] {
  return course.stages
    .filter((s) => !unit || s.unit === unit)
    .flatMap((stage) =>
      stage.modules.flatMap((module) =>
        module.tasks.map((t) => ({ ...t, stage, module, href: taskHref(stage.id, module.id, t.id) })),
      ),
    );
}

const doneSet = (p: ProgressState) =>
  new Set(Object.entries(p.tasks).filter(([, v]) => v.status === "done").map(([k]) => k));

export function isDone(p: ProgressState, taskId: string) {
  return p.tasks[taskId]?.status === "done";
}

export function bestTest(p: ProgressState, key: string) {
  const attempts = p.tests[key] ?? [];
  return attempts.reduce<(typeof attempts)[number] | null>((best, a) => (!best || a.score / a.total > best.score / best.total ? a : best), null);
}

export function moduleState(p: ProgressState, m: ModuleSummary) {
  const done = m.tasks.filter((t) => isDone(p, t.id)).length;
  const best = bestTest(p, `module:${m.id}`);
  const testPassed = !!best?.passed;
  return { done, total: m.tasks.length, tasksComplete: done === m.tasks.length, testPassed, complete: done === m.tasks.length && testPassed, best };
}

export function stageState(p: ProgressState, s: StageSummary) {
  const modules = s.modules.map((m) => moduleState(p, m));
  const best = bestTest(p, `stage:${s.id}`);
  const modulesComplete = modules.every((m) => m.complete);
  return { modules, modulesComplete, testPassed: !!best?.passed, complete: modulesComplete && !!best?.passed, best };
}

/** The next thing to do: first unfinished task, else first module/stage test not yet passed. */
export function nextStep(course: CourseIndex, p: ProgressState): { label: string; href: string; detail: string } | null {
  for (const stage of course.stages) {
    for (const module of stage.modules) {
      const next = module.tasks.find((t) => !isDone(p, t.id));
      if (next) return { label: next.title, href: taskHref(stage.id, module.id, next.id), detail: `${stage.title} · ${module.title}` };
      if (!moduleState(p, module).testPassed) {
        return { label: `${module.title}: module test`, href: `/learn/${stage.id}/${module.id}/test/`, detail: `${stage.title} · pass mark ${Math.round(module.test.pass_mark * 100)}%` };
      }
    }
    if (!stageState(p, stage).testPassed) {
      return { label: `${stage.title}: stage test`, href: `/learn/${stage.id}/test/`, detail: `Cumulative · pass mark ${Math.round(stage.test.pass_mark * 100)}%` };
    }
  }
  return null;
}

export function unitProgress(course: CourseIndex, p: ProgressState, unitId: string) {
  const tasks = flatTasks(course, unitId);
  const done = doneSet(p);
  const unit = course.syllabus.units.find((u) => u.id === unitId)!;
  const topics = course.syllabus.topics.filter((t) => t.unit === unitId);
  const builtTopics = new Set(course.stages.filter((s) => s.unit === unitId).map((s) => s.topic));
  return {
    unit,
    share: courseProgress(tasks, done),
    minutesLeft: minutesRemaining(tasks, done),
    taskCount: tasks.length,
    topicsBuilt: topics.filter((t) => builtTopics.has(t.id)).length,
    topicsTotal: topics.length,
  };
}

export function topicMastery(course: CourseIndex, p: ProgressState, unitId?: string) {
  return course.syllabus.topics
    .filter((t) => !unitId || t.unit === unitId)
    .map((t) => {
      const los = course.syllabus.los.filter((l) => l.topic === t.id).map((l) => l.id);
      const weight = (t.weight_band[0] + t.weight_band[1]) / 2;
      const attempted = los.some((lo) => p.mastery[lo] !== undefined);
      return { topic: t.id, name: t.name, unit: t.unit, weight, score: averageMastery(p.mastery, los), attempted };
    });
}

export function weakest(course: CourseIndex, p: ProgressState, n = 3) {
  const attemptedLos = course.syllabus.los.filter((l) => p.mastery[l.id] !== undefined).map((l) => l.id);
  return weakestLos(p.mastery, attemptedLos, n).map((w) => ({ ...w, lo: course.syllabus.los.find((l) => l.id === w.lo)! }));
}
