/**
 * Checks that external links in /content still resolve (spec 9.5).
 * Network-dependent, so it runs on a schedule in CI rather than on every PR.
 */
import fs from "node:fs";
import path from "node:path";

const contentDir = path.resolve(import.meta.dirname, "..", "content");
const urls = new Map<string, string>();

function walk(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(ya?ml|mdx?)$/.test(entry.name)) {
      for (const m of fs.readFileSync(p, "utf8").matchAll(/https?:\/\/[^\s)"'<>\]]+/g)) {
        if (!urls.has(m[0])) urls.set(m[0], path.relative(contentDir, p));
      }
    }
  }
}
walk(contentDir);

let failed = 0;
await Promise.all(
  [...urls].map(async ([url, file]) => {
    try {
      let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(15000) });
      if (res.status === 405 || res.status === 403) res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
      if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      failed++;
      console.log(`BROKEN  ${url}  (${file}): ${(e as Error).message}`);
    }
  }),
);
console.log(`${urls.size} link(s) checked, ${failed} broken`);
if (failed) process.exit(1);
