"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { dueItems, projectedFinish, readiness, today } from "@ofc/engine";
import { nextStep, syllabusHref, topicMastery, unitProgress, weakest } from "@/lib/derive";
import { useProgress } from "@/lib/progress";
import type { CourseIndex } from "@/lib/types";
import { Badge, ButtonLink, Card, ProgressBar } from "./ui";

export function Dashboard({ course, pay }: { course: CourseIndex; pay: ReactNode }) {
  const p = useProgress();
  const next = nextStep(course, p);
  const due = dueItems(p.review, today()).length;
  const weak = weakest(course, p);
  const units = course.syllabus.units.map((u) => unitProgress(course, p, u.id));
  const exam = p.settings.examDate ? new Date(`${p.settings.examDate}T00:00:00`) : null;

  return (
    <div className="space-y-6">
      {/* 1. Where you are */}
      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Where you are</h2>
        {next ? (
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted">{next.detail}</p>
              <p className="text-xl font-semibold">Next: {next.label}</p>
            </div>
            <ButtonLink href={next.href} className="px-8 py-3 text-lg">Continue</ButtonLink>
          </div>
        ) : (
          <p className="mt-3">You have finished all published content. More modules are on the way.</p>
        )}
      </Card>

      {/* 2. How far to go */}
      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">How far to go</h2>
        <div className="mt-3 space-y-5">
          {units.map((u) => {
            const finish = p.settings.weeklyHours
              ? projectedFinish({ remainingShare: 1 - u.share, recommendedHours: u.unit.recommended_hours, weeklyHours: p.settings.weeklyHours, from: new Date() })
              : null;
            return (
              <div key={u.unit.id}>
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{u.unit.name}</span>
                  <span className="text-sm text-muted">{Math.round(u.share * 100)}% of published tasks</span>
                </div>
                <ProgressBar value={u.share} label={`${u.unit.name} progress`} />
                <p className="mt-1.5 text-sm text-muted">
                  {u.taskCount ? `${Math.round(u.minutesLeft)} min of tasks left · ` : ""}
                  about {Math.round((1 - u.share) * u.unit.recommended_hours)} of {u.unit.recommended_hours} recommended study hours left
                  {" · "}content built for {u.topicsBuilt} of {u.topicsTotal} topics
                  {finish && <> · projected finish {finish.toLocaleDateString("en-GB")}{exam && (finish > exam ? <Badge tone="bad">after your exam</Badge> : <Badge tone="good">before your exam</Badge>)}</>}
                </p>
              </div>
            );
          })}
          {!p.settings.weeklyHours && (
            <p className="text-sm text-muted">
              <Link href="/settings/" className="underline">Set your exam date and weekly hours</Link> to see a projected finish date.
            </p>
          )}
          <p className="text-xs text-muted">Estimated, not a guarantee.</p>
        </div>
      </Card>

      {/* 3. Readiness */}
      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Readiness</h2>
        <div className="mt-3 grid gap-6 md:grid-cols-2">
          {course.syllabus.units.map((u) => {
            const topics = topicMastery(course, p, u.id);
            const mocks = p.mocks.filter((m) => m.unit === u.id);
            const r = readiness({ topicMastery: topics, mocks });
            return (
              <div key={u.id}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">{u.name}</span>
                  {r.onTrack ? <Badge tone="good">On track (estimate)</Badge> : <Badge tone="muted">Not yet on track</Badge>}
                </div>
                <ul className="space-y-2">
                  {topics.map((t) => (
                    <li key={t.topic}>
                      <div className="flex justify-between text-sm">
                        <span>{t.name}</span>
                        <span className="text-muted">{t.attempted ? `${Math.round(t.score)}%` : "not started"}</span>
                      </div>
                      <ProgressBar value={t.score / 100} label={`${t.name} mastery`} tone={t.score >= 75 ? "good" : t.score >= 60 ? "warn" : "bad"} />
                    </li>
                  ))}
                </ul>
                {r.reasons.length > 0 && <p className="mt-2 text-xs text-muted">To be on track: {r.reasons.join("; ")}.</p>}
              </div>
            );
          })}
        </div>
        <div className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium">Weakest learning outcomes</h3>
            {weak.length ? (
              <ol className="mt-1 space-y-1 text-sm">
                {weak.map((w) => (
                  <li key={w.lo.id}><Link href={syllabusHref([w.lo.id])} className="font-mono text-accent underline">{w.lo.id}</Link> {w.lo.summary} <strong>({Math.round(w.score)}%)</strong></li>
                ))}
              </ol>
            ) : (
              <p className="mt-1 text-sm text-muted">Answer some questions to see these.</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium">Review queue</h3>
            <p className="mt-1 text-sm">
              <strong className="text-2xl">{due}</strong> due today{p.review.length > due ? `, ${p.review.length - due} scheduled later` : ""}
            </p>
            {due > 0 && <ButtonLink href="/review/" variant="secondary" className="mt-2">Start review</ButtonLink>}
          </div>
        </div>
      </Card>

      {/* 4. Pass papers */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Pass papers</h2>
          <Link href="/papers/" className="text-sm underline">All papers and schedule</Link>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {course.syllabus.units.map((u) => {
            const official = p.mocks.filter((m) => m.unit === u.id && m.kind === "official");
            const ai = p.mocks.filter((m) => m.unit === u.id && m.kind === "ai");
            return (
              <div key={u.id} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium">{u.name}</p>
                <p className="mt-1"><Badge tone="accent">Official</Badge> {official.length} of 2 taken{official.length ? ` · last ${official.at(-1)!.percent}%` : ""}</p>
                <p className="mt-1"><Badge tone="warn">AI-generated, unofficial</Badge> {ai.length} taken{ai.length ? ` · last ${ai.at(-1)!.percent}%` : ""}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 5. What you pay for */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">What&rsquo;s free and what costs money</h2>
          <Link href="/costs/" className="text-sm underline">Full details</Link>
        </div>
        <div className="mt-3">{pay}</div>
      </Card>
    </div>
  );
}
