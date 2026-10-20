import { Papers } from "@/components/Papers";
import { getCourseIndex } from "@/lib/content";

export const metadata = { title: "Pass papers" };

export default function PapersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pass papers</h1>
      <Papers course={getCourseIndex()} />
    </div>
  );
}
