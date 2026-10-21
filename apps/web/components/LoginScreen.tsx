"use client";

import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { SignInForm } from "./SignInForm";

const POINTS = [
  "Every topic in the CFA UK IMC syllabus, in short lessons",
  "Practice questions, module tests and timed mock papers",
  "Your progress saved and synced across your devices",
];

/** Shown instead of course pages until the learner signs in (hosted site only). */
export function LoginScreen({ linkError }: { linkError?: string }) {
  return (
    <div className="mx-auto grid max-w-4xl items-center gap-10 py-6 md:grid-cols-2 md:py-12">
      <div className="space-y-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">{SITE_NAME}</p>
        <h1 className="text-3xl font-bold leading-tight md:text-4xl">Get exam-ready for the IMC, free.</h1>
        <ul className="space-y-2">
          {POINTS.map((p) => (
            <li key={p} className="flex gap-2"><span aria-hidden className="text-good">✓</span>{p}</li>
          ))}
        </ul>
        <p className="text-sm text-muted">
          Learning here is free. The exam itself is booked and paid for with CFA UK.{" "}
          <Link href="/costs/" className="underline">See what you pay for</Link> or{" "}
          <Link href="/syllabus/" className="underline">browse the syllabus</Link> first.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Sign in to start learning</h2>
        <p className="mt-1 text-sm text-muted">We&rsquo;ll email you a link. Click it and you&rsquo;re in.</p>
        <div className="mt-5">
          <SignInForm linkError={linkError} />
        </div>
      </div>
    </div>
  );
}
