"use client";

import type { CourseIndex } from "@/lib/types";
import { TestRunner } from "./TestRunner";

export function ModuleTest({ course, stageId, moduleId }: { course: CourseIndex; stageId: string; moduleId: string }) {
  const module = course.stages.find((s) => s.id === stageId)!.modules.find((m) => m.id === moduleId)!;
  return (
    <TestRunner
      los={course.syllabus.los}
      config={{
        key: `module:${module.id}`,
        title: `${module.title}: module test`,
        kind: "module",
        context: "module-test",
        count: module.test.count,
        passMark: module.test.pass_mark,
        pool: module.questionIds.map((id) => course.questions[id]!),
        doneHref: `/learn/${stageId}/`,
        doneLabel: "Back to stage",
      }}
    />
  );
}

export function StageTest({ course, stageId }: { course: CourseIndex; stageId: string }) {
  const stage = course.stages.find((s) => s.id === stageId)!;
  return (
    <TestRunner
      los={course.syllabus.los}
      config={{
        key: `stage:${stage.id}`,
        title: `${stage.title}: stage test`,
        kind: "stage",
        context: "stage-test",
        count: stage.test.count,
        passMark: stage.test.pass_mark,
        pool: stage.modules.flatMap((m) => m.questionIds.map((id) => course.questions[id]!)),
        doneHref: "/",
        doneLabel: "Back to dashboard",
      }}
    />
  );
}

export function PracticeMock({ course, unitId }: { course: CourseIndex; unitId: string }) {
  const unit = course.syllabus.units.find((u) => u.id === unitId)!;
  const pool = Object.values(course.questions).filter((q) => q.unit === unitId);
  if (!pool.length) return <p>No questions for {unit.name} yet.</p>;
  const count = Math.min(unit.questions, pool.length);
  // Keep the real exam's pace: minutes per question.
  const minutes = Math.max(5, Math.round((unit.duration_min / unit.questions) * count));
  return (
    <TestRunner
      los={course.syllabus.los}
      config={{
        key: `mock:practice-${unitId}`,
        title: `${unit.name}: practice mock`,
        kind: "mock",
        context: "mock",
        count,
        passMark: 0.75,
        pool,
        timeLimit: minutes,
        doneHref: "/papers/",
        doneLabel: "Back to pass papers",
        mock: { paperId: `practice-${unitId}`, unit: unitId },
      }}
    />
  );
}
