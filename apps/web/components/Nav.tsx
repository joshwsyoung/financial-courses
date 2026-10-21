"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SITE_NAME } from "@/lib/site";
import { supabaseEnabled } from "@/lib/supabase";
import { useSync } from "@/lib/sync";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/syllabus/", label: "Syllabus" },
  { href: "/review/", label: "Review" },
  { href: "/papers/", label: "Pass papers" },
  { href: "/costs/", label: "What you pay for" },
  { href: "/settings/", label: "Settings" },
];

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const sync = useSync();
  const links = supabaseEnabled ? [...LINKS, { href: "/account/", label: sync.email ? "Account" : "Sign in" }] : LINKS;
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <header className="border-b border-border bg-card">
      <nav aria-label="Main" className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-semibold">{SITE_NAME}</Link>
        <button className="rounded-md border border-border px-3 py-1.5 text-sm md:hidden" aria-expanded={open} aria-controls="nav-links" onClick={() => setOpen(!open)}>
          Menu
        </button>
        <ul id="nav-links" className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-14 z-10 flex-col gap-1 border-b border-border bg-card px-4 pb-3 md:static md:flex md:flex-row md:border-0 md:p-0`}>
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={active(l.href) ? "page" : undefined}
                className={`block rounded-md px-3 py-1.5 text-sm ${active(l.href) ? "bg-accent-soft font-medium text-accent" : "text-muted hover:text-fg"}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
