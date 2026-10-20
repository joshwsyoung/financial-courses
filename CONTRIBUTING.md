# Contributing

Thanks for helping. This project lives or dies on accurate, original content, so please read this first.

## The golden rules

1. **Original words only.** Never copy or closely paraphrase the CFA UK Official Training Manual, official mock papers, real exam questions (including from memory), or any prep provider's material. Teach the same learning outcome in your own words.
2. **Tag everything.** Every task and question needs at least one learning outcome id (`lo`) from `content/imc/syllabus.yml`.
3. **Say where facts came from.** Every content file needs `sources`, `licence`, `last_verified`, `author` and `reviewer`. CI fails without them.
4. **Tax figures are tied to a tax year.** Set `tax_year` on any question whose answer depends on rates or allowances, and use the matching `content/imc/tax-tables/<year>.yml`.
5. **Explain every answer.** Say why the right answer is right, and write a `distractor_notes` entry for every wrong option, based on a real misconception.

## Sign-off (DCO)

Sign off every commit with `git commit -s`. By signing off you confirm the
[Developer Certificate of Origin](https://developercertificate.org/) and that:

> My contribution is my own original work. It is not copied or closely paraphrased from the CFA UK Official Training Manual, official CFA UK mock papers, live exam questions, or any third-party exam prep provider.

## Review rule

- No content merges without one approving reviewer.
- Maths and tax content needs a reviewer who has **checked the numbers**.
- AI-drafted content (`origin: ai_generated` or `ai_assisted`) cannot be `status: published` until a named reviewer has signed it off in `reviewed_by`.

## Roles

- **Maintainers** look after code, releases and governance.
- **Content reviewers** have relevant domain expertise (for example an IMC or CFA holder, or an industry professional) and sign off content.
- **Contributors**: everyone else. Welcome!

## Adding a module

```
content/imc/v24/stage-XX-name/module-YY-name/
  module.yml        # id, title, order, summary, los, status, provenance
  tasks.yml         # ordered task list (10 to 15 tasks, 1 to 3 min each)
  tasks/*.md        # Markdown bodies for read / eli5 / diagram / worked_example tasks
  questions/*.yml   # one question per file; file name = question id
  module-test.yml   # count, pass_mark, optional LO/tag filter
```

Copy `content/imc/v24/stage-01-ethics/module-01-ethics-foundations` as a template. Aim for about 40% teach, 40% practise, 20% test. Give the module test a bank at least 1.5 times its size so retakes get fresh questions.

Before opening a PR, run:

```
pnpm validate   # schemas, LO tags, provenance, recomputed maths, banned phrases
pnpm test       # unit tests
```

## Reporting problems

Use the issue templates: wrong answer, outdated tax, unclear explanation, new question, syllabus change, or takedown.
