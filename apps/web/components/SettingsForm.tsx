"use client";

import { useRef, useState } from "react";
import { actions, useHydrated, useProgress, type Settings } from "@/lib/progress";
import { buttonClass, Card } from "./ui";

export function SettingsForm() {
  const hydrated = useHydrated();
  const p = useProgress();
  const file = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  if (!hydrated) return null;

  const download = () => {
    const blob = new Blob([actions.exportState()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ofc-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const upload = async (f: File) => {
    try {
      actions.importState(await f.text());
      setMessage("Progress imported.");
    } catch (e) {
      setMessage(`Could not import: ${(e as Error).message}`);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <h2 className="font-semibold">Your plan</h2>
        <label className="block text-sm">
          Exam date (optional)
          <input type="date" className="mt-1 block rounded-lg border border-border bg-bg px-3 py-2" value={p.settings.examDate ?? ""} onChange={(e) => actions.updateSettings({ examDate: e.target.value || undefined })} />
        </label>
        <label className="block text-sm">
          Study hours per week
          <input type="number" min={0} max={80} step={0.5} className="mt-1 block w-32 rounded-lg border border-border bg-bg px-3 py-2" value={p.settings.weeklyHours ?? ""} onChange={(e) => actions.updateSettings({ weeklyHours: e.target.value ? Number(e.target.value) : undefined })} />
        </label>
      </Card>
      <Card className="space-y-3">
        <h2 className="font-semibold">Theme</h2>
        <div className="flex gap-4" role="radiogroup" aria-label="Theme">
          {(["system", "light", "dark"] as Settings["theme"][]).map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm capitalize">
              <input type="radio" name="theme" checked={p.settings.theme === t} onChange={() => actions.updateSettings({ theme: t })} /> {t}
            </label>
          ))}
        </div>
      </Card>
      <Card className="space-y-3">
        <h2 className="font-semibold">Your data</h2>
        <p className="text-sm text-muted">Progress is stored only in this browser. Nothing is sent anywhere. Export it to back it up or move it to another device.</p>
        <div className="flex flex-wrap gap-3">
          <button className={buttonClass.secondary} onClick={download}>Export progress (JSON)</button>
          <button className={buttonClass.secondary} onClick={() => file.current?.click()}>Import progress</button>
          <input ref={file} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <button className={`${buttonClass.secondary} text-bad`} onClick={() => { if (confirm("Delete all progress in this browser? This cannot be undone.")) { actions.reset(); setMessage("Progress deleted."); } }}>Delete all progress</button>
        </div>
        {message && <p role="status" className="text-sm">{message}</p>}
      </Card>
    </div>
  );
}
