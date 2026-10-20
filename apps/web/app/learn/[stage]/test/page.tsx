import { StageTest } from "@/components/Tests";
import { getCourse, getCourseIndex } from "@/lib/content";

export function generateStaticParams() {
  return getCourse().stages.map((s) => ({ stage: s.id }));
}

export const metadata = { title: "Stage test" };

export default async function StageTestPage({ params }: { params: Promise<{ stage: string }> }) {
  const { stage } = await params;
  return <StageTest course={getCourseIndex()} stageId={stage} />;
}
