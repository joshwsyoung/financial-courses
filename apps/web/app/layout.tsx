import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { ThemeSync, themeInitScript } from "@/components/ThemeSync";
import { formatDate, getCourse } from "@/lib/content";
import { SITE_NAME } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: "A free, open source, self-paced course for the CFA UK IMC. Unofficial and unaffiliated.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  const { syllabus } = getCourse();
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-card focus:p-2">
          Skip to content
        </a>
        <ThemeSync />
        <Nav />
        <div className="border-b border-border bg-accent-soft px-4 py-1.5 text-center text-xs text-accent">
          This course matches {syllabus.short_name} v{syllabus.version}, valid {formatDate(syllabus.valid_from)} to {formatDate(syllabus.valid_to)}.
        </div>
        <main id="main" className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted">
          <p>
            Unofficial and unaffiliated with CFA UK, CFA Institute or Pearson VUE. &ldquo;IMC&rdquo; and &ldquo;CFA&rdquo; are used descriptively only.
          </p>
          <p className="mt-1">
            Code MIT · Content CC BY-SA 4.0 · <Link className="underline" href="/about/">About and licences</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
