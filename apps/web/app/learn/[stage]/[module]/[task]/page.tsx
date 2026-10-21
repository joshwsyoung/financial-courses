import { TaskPlayer } from "@/components/TaskPlayer";
import { StatusBadge } from "@/components/ui";
import { findModule, getCourse, getCourseIndex, getTaskDetail } from "@/lib/content";
import { taskHref } from "@/lib/derive";

type Params = { stage: string; module: string; task: string };

export function generateStaticParams(): Params[] {
  return getCourse().stages.flatMap((s) => s.modules.flatMap((m) => m.tasks.map((t) => ({ stage: s.id, module: m.id, task: t.id }))));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const p = await params;
  return { title: getTaskDetail(p.stage, p.module, p.task).title };
}

export default async function TaskPage({ params }: { params: Promise<Params> }) {
  const { stage, module: moduleId, task: taskId } = await params;
  const module = findModule(stage, moduleId);
  const task = getTaskDetail(stage, moduleId, taskId);
  const i = module.tasks.findIndex((t) => t.id === taskId);
  const prev = module.tasks[i - 1];
  const next = module.tasks[i + 1];
  const index = getCourseIndex();
  const question = task.question ? index.questions[task.question] : undefined;
  const outcomes = index.outcomes.filter((o) => task.lo.includes(o.id)).map(({ id, summary, verbs }) => ({ id, summary, verbs }));
  return (
    <TaskPlayer
      task={task}
      outcomes={outcomes}
      question={question}
      position={i + 1}
      total={module.tasks.length}
      prevHref={prev ? taskHref(stage, moduleId, prev.id) : undefined}
      nextHref={next ? taskHref(stage, moduleId, next.id) : `/learn/${stage}/${moduleId}/test/`}
      nextLabel={next ? "Continue" : "Go to module test"}
      moduleHref={`/learn/${stage}/${moduleId}/`}
      moduleTitle={module.title}
      statusNote={task.type !== "question" ? <StatusBadge status={module.status} origin="ai_generated" /> : undefined}
    />
  );
}
