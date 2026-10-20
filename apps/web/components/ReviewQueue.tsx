"use client";

import { useState } from "react";
import { dueItems, INTERVALS, today } from "@ofc/engine";
import { useHydrated, useProgress } from "@/lib/progress";
import type { CourseIndex } from "@/lib/types";
import { PracticeQuestion } from "./Question";
import { buttonClass, Card } from "./ui";

export function ReviewQueue({ course }: { course: CourseIndex }) {
  const hydrated = useHydrated();
  const p = useProgress();
  // Freeze the session's list at start so answering doesn't reshuffle it underneath the learner.
  const [session, setSession] = useState<string[] | null>(null);
  const [i, setI] = useState(0);
  const [answered, setAnswered] = useState(false);
  if (!hydrated) return null;
  const due = dueItems(p.review, today()).filter((r) => course.questions[r.questionId]);
  const upcoming = p.review.filter((r) => r.due > today()).sort((a, b) => a.due.localeCompare(b.due));

  if (!session) {
    return (
      <Card className="space-y-3">
        <p><strong className="text-2xl">{due.length}</strong> question{due.length === 1 ? "" : "s"} due today.</p>
        <p className="text-sm text-muted">
          Missed questions come back after {INTERVALS.join(", ")} days. Each correct answer moves a question one step along; after the last step it leaves the queue.
        </p>
        {due.length > 0 && <button className={buttonClass.primary} onClick={() => { setSession(due.map((d) => d.questionId)); setI(0); setAnswered(false); }}>Start review</button>}
        {upcoming.length > 0 && <p className="text-sm text-muted">Next due: {upcoming[0]!.due} ({upcoming.length} scheduled).</p>}
      </Card>
    );
  }
  if (i >= session.length) {
    return (
      <Card className="space-y-3">
        <p className="text-lg font-semibold">Review done for today.</p>
        <button className={buttonClass.secondary} onClick={() => setSession(null)}>Back</button>
      </Card>
    );
  }
  const q = course.questions[session[i]!]!;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Review {i + 1} of {session.length}</p>
      <Card><PracticeQuestion key={q.id} q={q} context="review" onDone={() => setAnswered(true)} /></Card>
      {answered && <button className={buttonClass.primary} onClick={() => { setI(i + 1); setAnswered(false); }}>Next</button>}
    </div>
  );
}
