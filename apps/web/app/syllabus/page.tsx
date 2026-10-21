import { Suspense } from "react";
import { SyllabusExplorer } from "@/components/SyllabusExplorer";
import { getCourseIndex } from "@/lib/content";

export const metadata = { title: "The syllabus" };

export default function SyllabusPage() {
  const course = getCourseIndex();
  const total = course.outcomes.length;
  const covered = course.outcomes.filter((o) => o.covered.tasks.length || o.covered.questions).length;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">The syllabus: what CFA UK expects</h1>
        <p className="mt-2 text-muted">
          Every learning outcome in the {course.syllabus.short_name} v{course.syllabus.version} syllabus, by its official number and command word.
          The summaries are in our own words. Follow the link to read CFA UK&rsquo;s exact wording. The course covers {covered} of {total} outcomes so far.
        </p>
      </div>
      <Suspense fallback={null}>
        <SyllabusExplorer course={course} />
      </Suspense>
    </div>
  );
}
