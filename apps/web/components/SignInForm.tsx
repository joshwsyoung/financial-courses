"use client";

import { useEffect, useState } from "react";
import { sendMagicLink } from "@/lib/sync";
import { buttonClass } from "./ui";

const RESEND_SECONDS = 60;

/** Email-link sign in: enter email, get a link, click it. No passwords. */
export function SignInForm({ linkError }: { linkError?: string }) {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const send = async (address: string) => {
    setError("");
    setSending(true);
    try {
      await sendMagicLink(address);
      setSentTo(address);
      setWait(RESEND_SECONDS);
    } catch (e) {
      const msg = (e as Error).message;
      setError(/rate limit|too many/i.test(msg) ? "Too many sign-in emails were requested. Please wait a few minutes and try again." : msg);
    } finally {
      setSending(false);
    }
  };

  if (sentTo) {
    return (
      <div className="space-y-4" role="status">
        <div className="rounded-lg bg-good-soft p-4 text-good">
          <p className="font-semibold">Check your inbox</p>
          <p className="mt-1 text-sm">We sent a sign-in link to <strong>{sentTo}</strong>. Open it on any device to sign in. It works once and expires after an hour.</p>
        </div>
        <p className="text-sm text-muted">Nothing there? Check your spam folder.</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <button className="underline disabled:no-underline disabled:opacity-60" disabled={wait > 0 || sending} onClick={() => void send(sentTo)}>
            {wait > 0 ? `Resend link in ${wait}s` : sending ? "Sending…" : "Resend link"}
          </button>
          <button className="underline" onClick={() => { setSentTo(null); setWait(0); }}>Use a different email</button>
        </div>
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void send(email.trim()); }}>
      {linkError && (
        <p role="alert" className="rounded-lg bg-warn-soft p-3 text-sm text-warn">
          That sign-in link didn&rsquo;t work ({linkError.toLowerCase()}). Links work once and expire after an hour. Send yourself a new one below.
        </p>
      )}
      <label className="block text-sm font-medium">
        Email address
        <input type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com" className="mt-1 block w-full rounded-lg border border-border bg-bg px-3 py-2.5 font-normal" />
      </label>
      <button type="submit" disabled={sending} className={`${buttonClass.primary} w-full`}>
        {sending ? "Sending…" : "Email me a sign-in link"}
      </button>
      <p className="text-xs text-muted">No password needed. New here? The same link creates your account.</p>
      {error && <p role="alert" className="text-sm text-bad">{error}</p>}
    </form>
  );
}
