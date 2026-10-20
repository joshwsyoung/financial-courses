import { ReviewQueue } from "@/components/ReviewQueue";
import { getCourseIndex } from "@/lib/content";

export const metadata = { title: "Review queue" };

export default function ReviewPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Review queue</h1>
      <ReviewQueue course={getCourseIndex()} />
    </div>
  );
}
