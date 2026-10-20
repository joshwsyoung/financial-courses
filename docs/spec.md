# Open Finance Course: Product and Technical Spec (v0.1 draft)

Working name: TBC. First syllabus: CFA UK Level 4 Certificate in Investment Management (IMC). Design must allow other syllabuses later.

---

## 1. Purpose and principles

**Goal:** a free, open source, self-paced course that takes someone from zero to exam-ready for the IMC, and is honest about the small part that cannot be free.

**Principles**
1. **Free to learn, honest about the exam.** Learning, practice and AI mock papers are free. Certification is not, and the app says so on day one.
2. **Original content only.** No copying of the CFA UK Official Training Manual, official mocks or live exam questions. We teach the same learning outcomes in our own words.
3. **Syllabus is the spine.** Every task and question maps to an official learning outcome (LO) ID.
4. **Small units, visible progress.** Tasks of 1 to 3 minutes, modules of 10 to 30 minutes.
5. **Zero-friction hosting.** Works as a static site. Three ways to run it (section 9).
6. **Versioned.** Syllabus version and tax year are first-class data, because the IMC syllabus changes every 1 December.

---

## 2. Hierarchy

```
Syllabus (e.g. IMC v24)
  Stage (a course-sized block, e.g. "UK Taxation")
    Module (10 to 15 tasks, about 10 to 30 min)
      Task (1 to 3 min)
      End-of-module test (about 8 to 12 questions)
    Stage test (cumulative)
  Pass papers (official links, AI-generated mocks)
```

| Level | Size | Contains | Completion rule |
|---|---|---|---|
| Syllabus | whole qualification | stages, pass papers, exam info | all stages passed + mock readiness |
| Stage | roughly 4 to 8 modules | modules, stage test | all modules complete + stage test at or above 70% |
| Module | 10 to 15 tasks | tasks, module test | all tasks done + module test at or above 80% (retakes allowed, fresh questions each time) |
| Task | 1 to 3 min | one learning action | marked done, or answered |

Provisional topic list (to be locked after reading the current syllabus):
- **Unit 1 stages:** ethics and professionalism; UK taxation; markets and regulation; client objectives and advice.
- **Unit 2 stages:** investment maths; products (equities, fixed income, pooled funds, derivatives, property, alternatives); theories and models; portfolio management; performance measurement.

---

## 3. Task types

Each task has exactly one `type`. Pick the format that demonstrates the idea best.

| Type | Use | Notes |
|---|---|---|
| `read` | short explainer (about 150 to 300 words) | plain English first, then precise definition |
| `eli5` | analogy-based intuition | for hard concepts |
| `diagram` | SVG, Mermaid or image | source stored in repo |
| `video` | embed or link to openly licensed video | only if licence allows; otherwise link out |
| `audio` | optional TTS of a `read` task | generated at build time, not stored in Git |
| `worked_example` | step-by-step calculation | every Unit 2 formula gets at least one |
| `question` | scored practice question | MCQ, item set or gap-fill |
| `flashcard` | recall prompt | feeds spaced repetition |
| `calc_drill` | repeated numeric practice with generated numbers | prevents memorising answers |
| `teach_back` | user explains a concept, optional AI audit | AI feature, optional |

Rule of thumb per module: about 40% teach, 40% practise, 20% test.

---

## 4. Source material policy

### 4.1 Allowed sources (with licence caveat)

| Source | Use for | Licence note |
|---|---|---|
| CFA UK IMC syllabus (learning outcomes) | LO IDs, topic weights, exam format | Facts and structure only. Do not paste LO text wholesale; paraphrase and reference by ID. Check CFA UK terms. |
| gov.uk and HMRC | tax rates, allowances, ISA, pensions, CGT, IHT | Open Government Licence. Attribute. |
| legislation.gov.uk | statute references | Open Government Licence. |
| FCA Handbook and website | regulation, principles, COBS, MAR | Check FCA reuse terms before copying; paraphrase by default. |
| Bank of England, ONS, DMO | gilts, inflation, base rate, data | Open Government Licence or equivalent. Check each. |
| OpenStax Principles of Finance (verify current title) | TVM, bonds, equities, portfolio theory | CC BY. Compatible with CC BY-SA. |
| Wikipedia | background facts | CC BY-SA. Paraphrase and link. |
| MIT OpenCourseWare, Khan Academy | link-out only | CC BY-NC-SA: not compatible with commercial reuse; do not copy into the repo. |
| Contributor-written original text | everything else | Contributor licence agreement (section 11). |

### 4.2 Forbidden
- Text, tables or figures from the CFA UK Official Training Manual.
- Official mock exam questions, or close paraphrases of them.
- Real exam questions from memory ("brain dumps").
- Third-party prep provider content (Kaplan, 300hours and so on).

### 4.3 Provenance
Every content file carries front matter: `sources`, `licence`, `last_verified` date, `author`, `reviewer`. CI fails if any of these is missing.

---

## 5. Content model (files in the repo)

Content lives in Git as Markdown/MDX plus YAML. No database needed to read content.

```
/content
  /imc
    syllabus.yml                # version, validity dates, exam facts, LO index
    /v24
      /stage-01-ethics
        stage.yml
        /module-01-code-of-ethics
          module.yml
          tasks.yml
          /tasks/*.mdx
          /questions/*.yml
          module-test.yml       # selects questions by tag, pulls from bank
    /tax-tables
      2026-27.yml
    /passpapers
      official.yml              # links only
      /ai-generated/*.yml
```

### 5.1 `syllabus.yml` (sketch)
```yaml
id: imc
name: CFA UK Level 4 Certificate in Investment Management
version: "24"
valid_from: 2026-12-01
valid_to: 2027-11-30
units:
  - id: unit1
    name: The Investment Environment
    questions: 85
    duration_min: 100
    pass_mark_range: [65, 75]
    recommended_hours: 100
  - id: unit2
    name: Investment Practice
    questions: 105
    duration_min: 140
    pass_mark_range: [60, 70]
    recommended_hours: 140
```
(Figures from the CFA UK site as of Oct 2026 for v23; verify for v24.)

### 5.2 Question schema (sketch)
```yaml
id: q-u2-bond-ytm-0007
type: mcq            # mcq | itemset | gapfill
unit: unit2
lo: ["2.3.4"]        # official LO IDs, mandatory
difficulty: 2        # 1 to 5
tax_year: null       # set if answer depends on tax tables
syllabus_versions: ["23", "24"]
stem: "A bond with a 5% annual coupon ... What is the approximate current yield?"
options:
  - { id: a, text: "4.2%" }
  - { id: b, text: "5.0%" }
correct: a
explanation: "Current yield = annual coupon / price ..."
distractor_notes: { b: "Confuses coupon rate with current yield" }
calc: { formula: "coupon/price", tolerance: 0.05 }   # gapfill only
source_refs: ["openstax:bonds"]
origin: human         # human | ai_generated | ai_assisted
reviewed_by: [handle]
status: published     # draft | review | published | retired
```

### 5.3 Question design rules
- One LO minimum per question; the tag is mandatory.
- Test one idea; no trick wording; plausible distractors based on real misconceptions.
- Gap-fill answers: numeric with tolerance and units, or short text with accepted variants.
- Item sets: one scenario, 3 to 4 linked questions.
- Calculations use IMC-permitted calculator methods only; note the calculator policy.
- Anything tax-dependent is tied to a `tax_year` and regenerated each year.
- Each question has an explanation of why the right answer is right and why each wrong answer is wrong.

---

## 6. Question and pass-paper pipeline

### 6.1 Official papers
- CFA UK publishes two free mocks per unit. They are copyrighted, so the app **links to them, never hosts them**.
- The app records the user's score by manual entry (date, unit, mark, optional topic breakdown) and tracks it on the dashboard.
- Older mocks (v14 to v17 at time of writing) exist online but are out of date; show a warning, recommend only the current ones.

### 6.2 AI-generated mocks
Labelled clearly as **"AI-generated, unofficial"** everywhere they appear.

Pipeline:
1. **Blueprint:** a YAML file per unit copying the *published* topic weighting bands (facts), producing a balanced paper of the right length and mix of MCQ, item set and gap-fill.
2. **Generate** questions against LO IDs from our own content (not from the official manual).
3. **Automated checks:** schema validation, answer recomputation for maths, duplicate detection, tax-table consistency, reading level.
4. **Human review:** at least one reviewer with relevant knowledge signs off before `published`.
5. **Calibration:** difficulty updated from anonymous aggregate accuracy once data exists (opt-in telemetry only).
6. **Versioning:** papers are tagged with syllabus version and retired or regenerated at each 1 December.

Target: 5 or more full AI mocks per unit at launch, each unique, drawing on a bank with at least 3x the questions needed.

### 6.3 When to take papers (recommended schedule, per unit)

| Step | Paper | When | Purpose |
|---|---|---|---|
| 1 | Diagnostic (30 AI questions, untimed) | Before Stage 1 | Baseline per topic, set study emphasis |
| 2 | Stage tests | End of each stage | Cumulative check, spaced review |
| 3 | AI mock A (timed) | About 50% through | Practise pacing and formats |
| 4 | **Official mock 1** | About 75% through | First calibration against the real thing |
| 5 | Gap review | After each mock | Auto-generated list of weak LOs, targeted drills |
| 6 | AI mocks B and C (timed) | Final 2 to 3 weeks | Build stamina and fix gaps |
| 7 | **Official mock 2** | About 5 to 7 days before exam | Final readiness check; do not use earlier |
| 8 | Light review only | Last 2 days | No new topics |

Rationale for saving the official mocks: only two exist per unit and they are the best calibration; spending them early wastes them. CFA UK's own mock guidance suggests candidates aim for roughly 75 to 80% on its mocks before the live exam (verify wording on the current mock PDFs).

**Readiness rule (shown on dashboard):** "On track" when the last two timed mocks are at or above 75% and no topic is below 60%.

---

## 7. Progress tracking and learning logic

### 7.1 Data tracked per user
- Task completion (done / skipped).
- Per question: attempts, correctness, time taken, timestamp.
- Per LO: mastery score (0 to 100).
- Mock results (official manual entry, AI automatic).
- Study time (active minutes) and streak (optional).
- Exam date (user sets it, optional).

### 7.2 Mastery model
- Each answered question updates its LOs' mastery (simple weighted moving average to start; upgrade path to Bayesian or Elo-style later).
- Missed questions and weak LOs feed a **review queue** with spaced repetition (simple intervals: 1, 3, 7, 14, 30 days).
- Module test selects questions across the module's LOs, preferring weak LOs and unseen questions.

### 7.3 Progress numbers
- **Course progress:** completed tasks / total tasks (weighted by estimated minutes).
- **Time remaining:** sum of remaining task minutes, compared with the user's weekly hours and exam date.
- **Readiness:** blend of LO mastery weighted by exam topic weighting plus latest mock scores.
- Always show "estimated, not a guarantee".

---

## 8. Front page and screens

### 8.1 Home dashboard (top to bottom)
1. **Where you are:** current stage and module, big "Continue" button, next task preview.
2. **How far to go:** overall progress bar per unit, estimated hours left, projected finish vs exam date.
3. **Readiness:** per-topic mastery bars, weakest three LOs, review queue count.
4. **Pass papers:** cards for official mocks (link out, enter score) and AI mocks (start, resume, past scores). Clear labels: Official vs AI-generated.
5. **What's free and what costs money:** see 8.2.

### 8.2 "What you pay for" panel (also the very first screen on first visit)
Plain-language, no dark patterns.

| | Free here | Not free (and not us) |
|---|---|---|
| Learning content for all syllabus topics | Yes | |
| Practice questions, module and stage tests | Yes | |
| AI-generated mock papers | Yes | |
| Links to official free CFA UK mocks | Yes | |
| **Exam registration and fee** | | **Paid to CFA UK** (IMC Unit 1: £350, Unit 2: £375 per CFA UK site, Oct 2026; verify) |
| Exam delivery at a test centre | | Booked through CFA UK; delivered via Pearson VUE |
| Official Training Manual | | Paid to CFA UK (price TBC); recommended but optional |
| Calculator (approved model) | | Buy from any retailer; check CFA UK calculator policy |
| ID for exam day | | Free if you already hold valid photo ID |
| Optional CFA UK membership or tuition providers | | Optional, not required to sit the exam |

Notes in the panel:
- "Only CFA UK can award the IMC. Passing our course does not give you a qualification; passing the CFA UK exams does."
- Exemptions may exist (see CFA UK).
- Last verified date shown; fees are fetched from a single `exam-info.yml` that maintainers update.
- No affiliate links. No sponsored placements.

### 8.3 Other screens
- Syllabus map (tree view, completion colours).
- Stage page, module page, task player (keyboard friendly, mobile first).
- Module test and mock exam runner (timer, flag-for-review, results with per-LO breakdown).
- Review queue.
- Settings (exam date, weekly hours, data export/import, theme).
- About and licences (full source attribution page).

---

## 9. Technical architecture

### 9.1 Stack (proposed)
- **Next.js (App Router) + TypeScript + Tailwind**, content from MDX/YAML in repo.
- Static generation of all content pages; client-side logic for quizzes and progress.
- **Progress stored locally by default** (IndexedDB/localStorage). No account needed. Export/import as JSON.
- **Optional sync** via Supabase (auth + a small progress table) for the hosted instance only; entirely disabled in self-host unless env vars are set.
- Question runner and mastery engine in a standalone TypeScript package so it can be tested and reused.

### 9.2 Three ways to run it
1. **Use the hosted app** (free, maintained by project, Vercel).
2. **One-click Vercel deploy**: "Deploy" button in README; no env vars required for local-progress mode.
3. **Self-host / offline:** `pnpm build && pnpm export` produces a static folder for any host (Netlify, GitHub Pages, S3, a Raspberry Pi); or a Docker image with nginx.

Local dev: `pnpm install && pnpm dev`.

### 9.3 Privacy
- No tracking by default. Optional anonymous analytics (self-hostable, for example Plausible or Umami), off in self-host.
- Hosted sync stores only progress data and an email for login; export and delete at any time.
- No personal data in content repo.

### 9.4 AI features (optional layer)
- Core course works with **zero AI calls**.
- Optional: "explain this differently", teach-back audit, AI mock generation for maintainers. Uses a user-supplied API key stored client-side, or a maintainer-run script for content generation. Never required to complete the course.
- Generated content always goes through the review pipeline (6.2) before publishing.

### 9.5 Quality and CI
- Schema validation of all YAML/MDX.
- Checks: LO tag present, provenance present, links alive, maths answers recomputed, tax-year tags valid, reading-level and length limits per task, no banned phrases from forbidden sources.
- Playwright smoke tests for the task player and mock runner.
- Accessibility: WCAG 2.2 AA target, captions or transcripts for any video or audio.

---

## 10. Annual syllabus update process
1. When CFA UK publishes the next version (new version applies each 1 December), run a diff of LO list vs the previous version.
2. Auto-open issues for every changed, added or removed LO.
3. Update `tax-tables/<year>.yml` and tag-dependent questions.
4. Tag content with `syllabus_versions`; retire or fork where it differs.
5. Regenerate AI mocks against the new blueprint; human review.
6. Show a banner: "This course matches IMC v24, valid 1 Dec 2026 to 30 Nov 2027."
7. Keep the previous version selectable until its exam window ends.

---

## 11. Open source governance

- **Code licence:** MIT.
- **Content licence:** CC BY-SA 4.0 (so OpenStax CC BY and Wikipedia CC BY-SA content is compatible).
- **Contributor agreement:** DCO sign-off plus a statement that contributions are original and not copied from the official manual or exam.
- **Disclaimer:** unaffiliated with CFA UK, CFA Institute or Pearson VUE; "IMC" and "CFA" used descriptively only; no logos.
- **Roles:** maintainers, content reviewers (domain expertise), contributors.
- **Review rule:** no content merges without one reviewer; maths and tax content needs a reviewer who checks the numbers.
- **Issue templates:** wrong answer, outdated tax, unclear explanation, new question, syllabus change.
- **Takedown process:** documented; any rights-holder complaint is actioned fast.
- **Legal check:** get a quick read from someone qualified on use of the IMC name and syllabus structure before public launch.

---

## 12. Roadmap

| Phase | Scope | Exit criteria |
|---|---|---|
| 0 | Spec, licence check, repo scaffold, CI, schemas | Repo builds; one dummy stage renders |
| 1 | Unit 1 MVP: 2 stages fully written, task player, module tests, local progress | A learner can finish a stage end to end |
| 2 | Unit 1 complete, dashboard, stage tests, "what you pay for" panel, diagnostic | Whole Unit 1 + 1 AI mock |
| 3 | Unit 2 complete, calc drills, mastery engine, review queue, official mock score tracking | Both units covered, 3 AI mocks each |
| 4 | Hosted sync, accessibility pass, contributor docs, public launch | External contributors can add a module |
| 5 | Annual update tooling, optional AI features, other syllabuses | Smooth v24 to v25 upgrade |

---

## 13. Risks

| Risk | Mitigation |
|---|---|
| Copyright complaint over syllabus or exam similarity | Original content only, no official text, LO IDs plus paraphrase, legal read, fast takedown |
| Content goes stale (tax, FCA) | `last_verified` dates, tax-year tags, CI warning when over 12 months old |
| AI-generated errors | Recompute maths, human review, "report an error" on every question |
| Over-claiming readiness | Language like "estimated"; never promise a pass |
| Content volume is huge (roughly 240 hours of learning) | Start with Unit 1; use templates; recruit reviewers early |
| Maintainer burnout | Clear governance, small modules, good docs |

---

## 14. Open questions

1. Name and branding of the project and repo?
2. Scope: IMC only for v1, or a general "learn finance" platform from the start?
3. Does a "Stage" equal a syllabus topic (my assumption), or one whole unit?
4. Is user sign-in needed at launch, or is local-only progress enough?
5. Which AI features, if any, are in v1?
6. Who reviews finance content? Do you have access to qualified reviewers?
7. Target exam date and your own weekly hours (to dogfood the course)?

---

## Implementation notes (added during Phase 0 build)

- Task bodies are plain Markdown (`.md`) rendered at build time, with inline SVG for diagrams. MDX can be added later if interactive components are needed inside task bodies.
- Stages map to syllabus topics (answer to open question 3, as assumed).
- Progress is local-only for now (open question 4); Supabase sync is deferred to Phase 4.
- Until full AI mocks exist, the pass papers page offers a timed "practice mock" drawn from the current question bank, labelled AI-generated and unofficial.
