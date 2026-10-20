import { Dashboard } from "@/components/Dashboard";
import { HomeGate } from "@/components/HomeGate";
import { PayPanel } from "@/components/PayPanel";
import { getCourse, getCourseIndex } from "@/lib/content";

export default function Home() {
  const course = getCourseIndex();
  const info = getCourse().examInfo;
  return (
    <HomeGate pay={<PayPanel info={info} />}>
      <Dashboard course={course} pay={<PayPanel info={info} compact />} />
    </HomeGate>
  );
}
