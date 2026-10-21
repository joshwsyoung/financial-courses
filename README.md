# Open Finance Course (working name)

A free, open source, self-paced course that takes someone from zero to exam-ready for the
**CFA UK Level 4 Certificate in Investment Management (IMC)**, and is honest about the part that
can't be free: the exam itself is paid to CFA UK.

> Unofficial. Not affiliated with CFA UK, CFA Institute or Pearson VUE. Only CFA UK can award the IMC.

The full product and technical spec is in [`docs/spec.md`](docs/spec.md).

## Status: Phase 0 done, Phase 1 underway

| | |
|---|---|
| Repo scaffold, schemas, CI | Done |
| Task player (read, ELI5, diagram, worked example, question, flashcard, calc drill, video) | Done |
| Module tests and stage tests (fresh questions on retake, per-LO results) | Done |
| Local progress, mastery model, spaced-repetition review queue | Done |
| Dashboard, syllabus map, "What you pay for" panel (first screen on first visit) | Done |
| Pass papers: official links and score entry, timed AI practice mock | Done |
| Content | 2 sample stages: **Ethics** (1 full module, 14 tasks, 16 questions) and **UK tax** (1 short module). All AI-drafted and **awaiting expert review**. |

**Before anything goes public**, see [Open items](#open-items).

## Run it

Three ways (spec 9.2):

1. **Hosted:** coming soon.
2. **One-click Vercel deploy:** [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/joshwsyoung/financial-courses). No environment variables needed.
3. **Self-host or offline:**
   ```
   pnpm install
   pnpm export            # static site in apps/web/out; put it on any host
   ```
   Or with Docker: `docker build -t financial-courses . && docker run -p 8080:80 financial-courses`.
   For a sub-path such as GitHub Pages, build with `NEXT_PUBLIC_BASE_PATH=/financial-courses`.

Local development: `pnpm install && pnpm dev`, then open http://localhost:3000.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Run the app locally |
| `pnpm validate` | Check all content: schemas, LO tags, provenance, recomputed maths, tax years, banned phrases, word counts, staleness |
| `pnpm test` | Unit tests (engine, calc evaluator, content checks) |
| `pnpm typecheck` | TypeScript across all packages |
| `pnpm build` | Validate, then build the static site |
| `pnpm e2e` | Playwright smoke tests against the built site |

## How it's organised

```
apps/web            Next.js (App Router) + Tailwind; static export; progress in localStorage
packages/engine     Grading, mastery, spaced repetition, question selection, readiness, calc evaluator (pure TS, no I/O)
packages/content    Zod schemas, content loader and CI checks for /content
content/imc         The IMC syllabus: syllabus.yml, exam-info.yml, tax-tables/, passpapers/, v24/<stage>/<module>/
scripts             validate-content, check-links, format-yaml
```

Content is plain Markdown and YAML in Git. No database is needed to read it.

## Accounts, sync and feedback (optional)

Without configuration the app is fully offline: progress lives in the browser and feedback opens a
pre-filled GitHub issue. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see
`.env.example`) to switch on email sign-in, progress sync and database feedback with screenshots.
Run `supabase/setup.sql` once in the Supabase SQL Editor first. All objects are prefixed `fc_`, so the
project can be shared with other apps.

With Supabase configured, learners must sign in before using course pages (the syllabus, costs and
about pages stay public). Set `NEXT_PUBLIC_REQUIRE_LOGIN=false` to make sign-in optional instead.
Copies without Supabase never ask anyone to sign in. Add your site's URL (e.g.
`https://your-site.example/**`) to Supabase → Authentication → URL Configuration → Redirect URLs.

## Privacy

No tracking. Progress stays in your browser unless you sign in; export and import it as JSON from Settings.

## Open items

These come from the spec's open questions and from building Phase 0:

- **Learning outcome ids are provisional** (`u1.eth.1` style). Map them to the official ids once the v24 syllabus is read.
- **Topic weight bands are placeholders**, and the unit figures (questions, duration, pass marks) are copied from the spec. Verify them for v24.
- **Exam fees and official mock links** in `content/imc/exam-info.yml` and `passpapers/official.yml` need checking against the CFA UK site. The mock links currently point at the CFA UK homepage.
- **2026-27 tax table** needs a reviewer to check it against gov.uk.
- **All sample content is AI-drafted** and needs sign-off from a qualified reviewer before it can be marked `published`.
- **Legal check** on use of the IMC name and syllabus structure before public launch.
- Project name and branding.

## Contributing and licences

See [CONTRIBUTING.md](CONTRIBUTING.md). Code is [MIT](LICENSE). Content is [CC BY-SA 4.0](content/LICENSE.md).
Rights holders: see [TAKEDOWN.md](TAKEDOWN.md).
