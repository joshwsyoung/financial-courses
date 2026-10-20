import { PayPanel } from "@/components/PayPanel";
import { getCourse } from "@/lib/content";

export const metadata = { title: "What you pay for" };

export default function Costs() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">What you pay for</h1>
      <PayPanel info={getCourse().examInfo} />
    </div>
  );
}
