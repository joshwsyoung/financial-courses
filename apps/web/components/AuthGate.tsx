"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { loginRequired, PUBLIC_PATHS } from "@/lib/supabase";
import { useSync } from "@/lib/sync";
import { LoginScreen } from "./LoginScreen";

/**
 * On the hosted site, course pages need a signed-in learner. Self-hosted copies without
 * Supabase have loginRequired = false, so this renders the page untouched.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const path = usePathname();
  const sync = useSync();
  if (!loginRequired || PUBLIC_PATHS.some((p) => path.startsWith(p))) return <>{children}</>;
  if (!sync.ready) return <div className="min-h-[50vh]" aria-busy="true" aria-label="Checking sign-in" />;
  if (!sync.email) return <LoginScreen linkError={sync.linkError} />;
  return <>{children}</>;
}
