import Link from "next/link";
import { ModuleTaskList } from "@/components/Lists";
import { StatusBadge } from "@/components/ui";
import { getCourse, getCourseIndex } from "@/lib/content";

export function generateStaticParams() {
  return getCourse().stages.flatMap((s) => s.modules.map((m) => ({ stage: s.id, module: m.id })));
}

export async function generateMetadata({ params }: { params: Promise<{ stage: string; module: string }> }) {
  const { stage, module } = await params;
  return { title: getCourseIndex().stages.find((s) => s.id === stage)?.modules.find((m) => m.id === module)?.title };
}

export default async function ModulePage({ params }: { params: Promise<{ stage: string; module: string }> }) {
  const { stage: stageId, module: moduleId } = await params;
  const course = getCourseIndex();
  const stage = course.stages.find((s) => s.id === stageId)!;
  const module = stage.modules.find((m) => m.id === moduleId)!;
  const minutes = module.tasks.reduce((s, t) => s + t.minutes, 0);
  return (
    <div className="space-y-6">
      <div>
        <Link href={`/learn/${stage.id}/`} className="text-sm text-muted underline">{stage.title}</Link>
        <h1 className="mt-1 text-3xl font-bold">{module.title}</h1>
        <p className="text-muted">{module.summary}</p>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
          About {Math.round(minutes)} min · learning outcomes {module.los.join(", ")} <StatusBadge status={module.status} origin="ai_generated" />
        </p>
      </div>
      <ModuleTaskList stageId={stage.id} module={module} />
    </div>
  );
}
