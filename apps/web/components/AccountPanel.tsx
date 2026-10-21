"use client";

import { useState } from "react";
import { supabaseEnabled } from "@/lib/supabase";
import { deleteCloudCopy, signOut, useSync } from "@/lib/sync";
import { SignInForm } from "./SignInForm";
import { buttonClass, Card } from "./ui";

export function AccountPanel() {
  const sync = useSync();
  const [error, setError] = useState("");

  if (!supabaseEnabled) {
    return (
      <Card className="space-y-2">
        <p>Accounts aren&rsquo;t switched on for this copy of the site. Your progress is saved in this browser, and you can move it between devices with Export and Import in Settings.</p>
      </Card>
    );
  }

  if (sync.email) {
    return (
      <Card className="space-y-4">
        <p>Signed in as <strong>{sync.email}</strong>.</p>
        <p role="status" className="text-sm text-muted">
          {sync.status === "syncing" && "Syncing your progress…"}
          {sync.status === "synced" && `Progress synced${sync.lastSynced ? ` at ${new Date(sync.lastSynced).toLocaleTimeString("en-GB")}` : ""}. It will follow you to any device you sign in on.`}
          {sync.status === "error" && <span className="text-bad">Sync problem: {sync.error}. Your progress is still saved in this browser.</span>}
        </p>
        <div className="flex flex-wrap gap-3">
          <button className={buttonClass.secondary} onClick={() => void signOut()}>Sign out</button>
          <button className={`${buttonClass.secondary} text-bad`} onClick={async () => {
            if (!confirm("Delete the copy of your progress saved to your account? Progress in this browser stays.")) return;
            try { await deleteCloudCopy(); await signOut(); } catch (e) { setError((e as Error).message); }
          }}>Delete my saved progress</button>
        </div>
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <p>Sign in to save your progress and pick up where you left off on any device.</p>
      <SignInForm linkError={sync.linkError} />
      <p className="text-xs text-muted">We store your email (to sign you in) and your course progress. Nothing else. You can delete it at any time.</p>
    </Card>
  );
}
