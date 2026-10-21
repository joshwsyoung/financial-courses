"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FEEDBACK_KINDS, feedbackChannel, githubIssueUrl, saveToDatabase, type FeedbackContext, type FeedbackKind } from "@/lib/feedback";
import { actions } from "@/lib/progress";
import { buttonClass } from "./ui";

/**
 * A small "Feedback" button that opens a dialog. Context (page, task, question,
 * the learner's answer) is attached automatically so reports are actionable.
 */
export function FeedbackButton({ context, label = "Feedback", defaultKind = "unclear", className = "" }: {
  context?: Omit<FeedbackContext, "page">;
  label?: string;
  defaultKind?: FeedbackKind;
  className?: string;
}) {
  const path = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [kind, setKind] = useState<FeedbackKind>(defaultKind);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const d = dialog.current;
    const onClose = () => { if (state === "sent") { setState("idle"); setMessage(""); } };
    d?.addEventListener("close", onClose);
    return () => d?.removeEventListener("close", onClose);
  }, [state]);

  const open = () => {
    setKind(defaultKind);
    setState("idle");
    dialog.current?.showModal();
  };

  const submit = async () => {
    const payload = { ...context, page: path, kind, message: message.trim() };
    if (!payload.message) return;
    actions.logFeedback(payload);
    if (feedbackChannel === "github") {
      window.open(githubIssueUrl(payload), "_blank", "noopener,noreferrer");
      setState("sent");
      return;
    }
    setState("sending");
    try {
      await saveToDatabase(payload);
      setState("sent");
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  };

  return (
    <>
      <button type="button" onClick={open} className={className || "text-xs text-muted underline"}>
        {label}
      </button>
      {mounted && createPortal(
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-0 text-fg backdrop:bg-black/50"
        onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}
      >
        {/* Portalled to <body> so it never nests inside a question's own <form>. */}
        <form className="space-y-4 p-5" onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); void submit(); }}>
          <div className="flex items-start justify-between gap-3">
            <h2 id={titleId} className="text-lg font-semibold">Send feedback</h2>
            <button type="button" aria-label="Close" className="text-muted" onClick={() => dialog.current?.close()}>✕</button>
          </div>

          {state === "sent" ? (
            <div role="status" className="space-y-3">
              <p className="rounded-lg bg-good-soft p-3 text-good">
                {feedbackChannel === "github" ? "Thanks! Finish sending it on the GitHub page that just opened." : "Thanks, your feedback has been saved."}
              </p>
              <button type="button" className={buttonClass.secondary} onClick={() => dialog.current?.close()}>Close</button>
            </div>
          ) : (
            <>
              <fieldset className="flex flex-wrap gap-2">
                <legend className="mb-2 text-sm font-medium">What kind of feedback?</legend>
                {FEEDBACK_KINDS.map((k) => (
                  <label key={k.id} className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${kind === k.id ? "border-accent bg-accent-soft text-accent" : "border-border"}`}>
                    <input type="radio" name="kind" value={k.id} className="sr-only" checked={kind === k.id} onChange={() => setKind(k.id)} />
                    {k.label}
                  </label>
                ))}
              </fieldset>
              <label className="block text-sm font-medium">
                Tell us more
                <textarea
                  required
                  rows={4}
                  maxLength={4000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-bg p-3 font-normal"
                  placeholder="What's wrong, or what would make this better?"
                />
              </label>
              <p className="text-xs text-muted">
                We attach the page{context?.questionId ? ", question" : context?.taskId ? " and task" : ""}{context?.answer ? " and your answer" : ""} automatically. No personal details.
                {feedbackChannel === "github" && " Sending opens a GitHub page to submit it."}
              </p>
              {state === "error" && <p role="alert" className="text-sm text-bad">{error}. Please try again.</p>}
              <div className="flex justify-end gap-2">
                <button type="button" className={buttonClass.secondary} onClick={() => dialog.current?.close()}>Cancel</button>
                <button type="submit" className={buttonClass.primary} disabled={!message.trim() || state === "sending"}>
                  {state === "sending" ? "Sending…" : "Send feedback"}
                </button>
              </div>
            </>
          )}
        </form>
      </dialog>,
      document.body)}
    </>
  );
}
