import { PracticeMock } from "@/components/Tests";
import { getCourse, getCourseIndex } from "@/lib/content";

export function generateStaticParams() {
  return getCourse().syllabus.units.map((u) => ({ unit: u.id }));
}

export const metadata = { title: "Practice mock" };

export default async function PracticeMockPage({ params }: { params: Promise<{ unit: string }> }) {
  const { unit } = await params;
  return <PracticeMock course={getCourseIndex()} unitId={unit} />;
}
