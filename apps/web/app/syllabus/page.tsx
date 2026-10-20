import { SyllabusMap } from "@/components/SyllabusMap";
import { getCourseIndex } from "@/lib/content";

export const metadata = { title: "Syllabus map" };

export default function SyllabusPage() {
  const course = getCourseIndex();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Syllabus map</h1>
        <p className="text-muted">{course.syllabus.name} (v{course.syllabus.version}). Topic list and learning outcome ids are provisional until checked against the published syllabus.</p>
      </div>
      <SyllabusMap course={course} />
    </div>
  );
}
