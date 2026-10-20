"use client";

import type { ReactNode } from "react";
import { actions, useHydrated, useProgress } from "@/lib/progress";
import { buttonClass } from "./ui";

/** First visit shows the "What you pay for" panel before anything else (spec 8.2). */
export function HomeGate({ pay, children }: { pay: ReactNode; children: ReactNode }) {
  const hydrated = useHydrated();
  const { seenWelcome } = useProgress();
  if (!hydrated) return <div className="min-h-[50vh]" aria-busy="true" />;
  if (seenWelcome) return <>{children}</>;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Before you start: what&rsquo;s free and what isn&rsquo;t</h1>
      {pay}
      <button className={buttonClass.primary} onClick={() => actions.dismissWelcome()}>
        Got it, start learning
      </button>
    </div>
  );
}
