"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { mergeProgress } from "./merge";
import { migrate, store, type ProgressState } from "./progress";
import { supabase } from "./supabase";

export type SyncStatus = "off" | "signed-out" | "syncing" | "synced" | "error";

interface SyncState {
  status: SyncStatus;
  email?: string;
  lastSynced?: string;
  error?: string;
}

let state: SyncState = { status: "off" };
const listeners = new Set<() => void>();
const setState = (patch: Partial<SyncState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

let started = false;
let pushTimer: ReturnType<typeof setTimeout> | undefined;
let applyingRemote = false;
let userId: string | undefined;

async function pull(session: Session) {
  const db = supabase()!;
  setState({ status: "syncing", email: session.user.email ?? undefined, error: undefined });
  const { data, error } = await db.from("fc_progress").select("state").eq("user_id", session.user.id).maybeSingle();
  if (error) return setState({ status: "error", error: error.message });
  if (data?.state) {
    let remote: ProgressState;
    try {
      remote = migrate(data.state);
    } catch {
      return setState({ status: "error", error: "Saved progress is in an unknown format" });
    }
    applyingRemote = true;
    store.replace(mergeProgress(store.get(), remote));
    applyingRemote = false;
  }
  await push();
}

async function push() {
  if (!userId) return;
  const { error } = await supabase()!.from("fc_progress").upsert({ user_id: userId, state: store.get(), updated_at: new Date().toISOString() });
  setState(error ? { status: "error", error: error.message } : { status: "synced", lastSynced: new Date().toISOString(), error: undefined });
}

/** Starts auth + sync once per page load. Safe to call from many components. */
export function startSync() {
  const db = supabase();
  if (started || !db) return;
  started = true;
  setState({ status: "signed-out" });
  db.auth.onAuthStateChange((event, session) => {
    if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
      if (userId === session.user.id) return;
      userId = session.user.id;
      void pull(session);
    } else if (!session) {
      userId = undefined;
      setState({ status: "signed-out", email: undefined, lastSynced: undefined });
    }
  });
  store.subscribe(() => {
    if (!userId || applyingRemote) return;
    clearTimeout(pushTimer);
    setState({ status: "syncing" });
    pushTimer = setTimeout(() => void push(), 2000);
  });
}

export function useSync(): SyncState {
  useEffect(startSync, []);
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}

export async function sendMagicLink(email: string) {
  const redirect = `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/account/`;
  const { error } = await supabase()!.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
  if (error) throw error;
}

export async function signOut() {
  await supabase()?.auth.signOut();
}

/** Deletes this learner's synced copy. Local progress in this browser is untouched. */
export async function deleteCloudCopy() {
  if (!userId) return;
  const { error } = await supabase()!.from("fc_progress").delete().eq("user_id", userId);
  if (error) throw error;
}
