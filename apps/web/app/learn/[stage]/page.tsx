import Link from "next/link";
import { StageModuleList } from "@/components/Lists";
import { getCourse, getCourseIndex } from "@/lib/content";

export function generateStaticParams() {
  return getCourse().stages.map((s) => ({ stage: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ stage: string }> }) {
  const { stage } = await params;
  return { title: getCourseIndex().stages.find((s) => s.id === stage)?.title };
}

export default async function StagePage({ params }: { params: Promise<{ stage: string }> }) {
  const { stage: id } = await params;
  const course = getCourseIndex();
  const stage = course.stages.find((s) => s.id === id)!;
  const unit = course.syllabus.units.find((u) => u.id === stage.unit)!;
  return (
    <div className="space-y-6">
      <div>
        <Link href="/syllabus/" className="text-sm text-muted underline">Syllabus</Link>
        <h1 className="mt-1 text-3xl font-bold">{stage.title}</h1>
        <p className="text-muted">{unit.name} · {stage.summary}</p>
      </div>
      <StageModuleList stage={stage} />
    </div>
  );
}
