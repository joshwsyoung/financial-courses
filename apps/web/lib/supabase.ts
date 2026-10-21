"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when this build has Supabase configured. Self-hosted builds without it run fully offline. */
export const supabaseEnabled = !!(url && key);

/**
 * Sign-in is required whenever Supabase is configured (the hosted site), and switches off
 * automatically for self-hosted copies without it. Set NEXT_PUBLIC_REQUIRE_LOGIN=false to make
 * accounts optional even with Supabase configured.
 */
export const loginRequired = supabaseEnabled && process.env.NEXT_PUBLIC_REQUIRE_LOGIN !== "false";

/** Pages anyone can see without signing in, so visitors can judge the course first. */
export const PUBLIC_PATHS = ["/costs/", "/about/", "/syllabus/", "/account/"];

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!supabaseEnabled || typeof window === "undefined") return null;
  client ??= createClient(url!, key!, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit", storageKey: "ofc:auth" },
  });
  return client;
}
