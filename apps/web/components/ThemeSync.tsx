"use client";

import { useEffect } from "react";
import { useProgress } from "@/lib/progress";

/** Applies the theme setting to <html>. The inline script in layout avoids a flash on first paint. */
export function ThemeSync() {
  const { settings } = useProgress();
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = settings.theme === "dark" || (settings.theme === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [settings.theme]);
  return null;
}

export const themeInitScript = `(function(){try{var s=JSON.parse(localStorage.getItem("ofc:progress:v1")||"{}");var t=(s.settings&&s.settings.theme)||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})()`;
