import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";
import { describe, expect, it } from "vitest";
import { checkCourse } from "./checks";
import { loadCourse } from "./loader";

const realContent = path.resolve(import.meta.dirname, "../../../content");

/** Copy /content to a temp dir, apply a mutation, and return all issues. */
function issuesAfter(mutate: (imc: string) => void) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ofc-"));
  fs.cpSync(realContent, tmp, { recursive: true });
  const imc = path.join(tmp, "imc");
  mutate(imc);
  const { course, issues } = loadCourse(imc);
  return [...issues, ...(course ? checkCourse(course, { now: new Date("2026-10-21") }) : [])];
}

const REG = "v24/stage-02-regulation/module-01-fca-conduct";
const ethicsQ = (imc: string, id: string) => {
  const inRegulation = ["0004", "0005", "0006", "0010", "0011", "0012", "0013", "0014", "0016"].some((n) => id.endsWith(n));
  return path.join(imc, inRegulation ? REG : "v24/stage-01-ethics/module-01-ethics-foundations", "questions", `${id}.yml`);
};
const taxQ = (imc: string, id: string) =>
  path.join(imc, "v24/stage-03-uk-tax/module-01-income-tax-basics/questions", `${id}.yml`);

function edit(file: string, fn: (doc: Record<string, unknown>) => void) {
  const doc = YAML.parse(fs.readFileSync(file, "utf8"));
  fn(doc);
  fs.writeFileSync(file, YAML.stringify(doc));
}

const errors = (issues: { level: string; message: string }[]) => issues.filter((i) => i.level === "error").map((i) => i.message);

describe("content checks", () => {
  it("the real content has no errors", () => {
    expect(errors(issuesAfter(() => {}))).toEqual([]);
  });

  it("fails when provenance is missing", () => {
    const e = errors(issuesAfter((imc) => edit(ethicsQ(imc, "q-u1-eth-0001"), (d) => {
      delete (d.provenance as Record<string, unknown>).reviewer;
    })));
    expect(e.some((m) => m.includes("provenance.reviewer"))).toBe(true);
  });

  it("fails on unknown LO tags", () => {
    const e = errors(issuesAfter((imc) => edit(ethicsQ(imc, "q-u1-eth-0002"), (d) => { d.lo = ["9.9.9"]; })));
    expect(e).toContain("unknown LO 9.9.9");
  });

  it("fails when a recomputed answer does not match", () => {
    const e = errors(issuesAfter((imc) => edit(taxQ(imc, "q-u1-tax-0001"), (d) => {
      (d.answer as Record<string, unknown>).value = 3500;
    })));
    expect(e.some((m) => m.startsWith("recomputed answer 3486"))).toBe(true);
  });

  it("fails when a tax year has no tax table", () => {
    const e = errors(issuesAfter((imc) => edit(taxQ(imc, "q-u1-tax-0004"), (d) => { d.tax_year = "2019-20"; })));
    expect(e).toContain("tax_year 2019-20 has no tax-tables file");
  });

  it("fails when a wrong option has no distractor note", () => {
    const e = errors(issuesAfter((imc) => edit(ethicsQ(imc, "q-u1-eth-0003"), (d) => {
      delete (d.distractor_notes as Record<string, unknown>).a;
    })));
    expect(e).toContain("option a needs a distractor note explaining why it is wrong");
  });

  it("fails when published without a reviewer", () => {
    const e = errors(issuesAfter((imc) => edit(ethicsQ(imc, "q-u1-eth-0004"), (d) => { d.status = "published"; })));
    expect(e).toContain("published questions need at least one reviewer");
  });

  it("fails on banned phrases", () => {
    const e = errors(issuesAfter((imc) => edit(ethicsQ(imc, "q-u1-eth-0005"), (d) => {
      d.explanation = "This is taken from the official mock.";
    })));
    expect(e.some((m) => m.startsWith("banned phrase"))).toBe(true);
  });
});

describe("countWords", () => {
  it("ignores markup and svg", async () => {
    const { countWords } = await import("./checks");
    expect(countWords("# Title\n\nSome **bold** words. <svg><text>no</text></svg>")).toBe(4);
  });
});

describe("memory aids", () => {
  it("fails when the device letters don't match the item initials", () => {
    const e = errors(issuesAfter((imc) => {
      const f = path.join(imc, REG, "tasks.yml");
      fs.writeFileSync(f, fs.readFileSync(f, "utf8").replace("letters: IDOCMO", "letters: IDOCMX"));
    }));
    expect(e).toContain("memory aid letters IDOCMX do not match item initials IDOCMO");
  });

  it("measures the longest Markdown list", async () => {
    const { longestList } = await import("./checks");
    expect(longestList("- a\n- b\n\ntext\n1. x\n2. y\n3. z")).toBe(3);
  });
});
