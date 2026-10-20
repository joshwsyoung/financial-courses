import { ModuleTest } from "@/components/Tests";
import { getCourse, getCourseIndex } from "@/lib/content";

export function generateStaticParams() {
  return getCourse().stages.flatMap((s) => s.modules.map((m) => ({ stage: s.id, module: m.id })));
}

export const metadata = { title: "Module test" };

export default async function ModuleTestPage({ params }: { params: Promise<{ stage: string; module: string }> }) {
  const { stage, module } = await params;
  return <ModuleTest course={getCourseIndex()} stageId={stage} moduleId={module} />;
}
