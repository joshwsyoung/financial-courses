import { expect, test, type Page } from "@playwright/test";

async function dismissWelcome(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /what.s free and what isn.t/i })).toBeVisible();
  await expect(page.getByText("Paid to CFA UK").first()).toBeVisible();
  await page.getByRole("button", { name: "Got it, start learning" }).click();
}

test("first visit shows the costs panel, then the dashboard", async ({ page }) => {
  await dismissWelcome(page);
  await expect(page.getByRole("link", { name: "Continue" })).toBeVisible();
  await expect(page.getByText("Next: Ethics is not the same as law")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: "Continue" })).toBeVisible();
});

test("task player: read, then answer a question with feedback", async ({ page }) => {
  await dismissWelcome(page);
  await page.getByRole("link", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Ethics is not the same as law" })).toBeVisible();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByRole("heading", { name: "Trust is the product" })).toBeVisible();
  await page.getByRole("button", { name: /Continue/ }).click();

  await expect(page.getByRole("heading", { name: "Check: legal but wrong?" })).toBeVisible();
  await page.getByText("Legal but unethical").click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByRole("status")).toContainText("Correct");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByRole("heading", { name: "Who relies on you" })).toBeVisible();

  await page.goto("/learn/ethics/ethics-foundations/");
  await expect(page.getByText("3 of 15 tasks done")).toBeVisible();
});

test("module test runs, scores and shows a per-LO breakdown", async ({ page }) => {
  await dismissWelcome(page);
  await page.goto("/learn/ethics/ethics-foundations/test/");
  await page.getByRole("button", { name: "Start" }).click();
  for (let i = 0; i < 8; i++) {
    const radios = page.getByRole("radio");
    if (await radios.count()) await radios.first().check();
    else await page.getByLabel("Your answer").fill("fairly");
    if (i === 2) await page.getByLabel("Flag for review").check();
    await page.getByRole("button", { name: i < 7 ? "Next" : "Submit" }).click();
  }
  await expect(page.getByRole("heading", { name: /module test: results/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "By learning outcome" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retake with fresh questions" })).toBeVisible();
});

test("practice mock is labelled AI-generated and timed", async ({ page }) => {
  await dismissWelcome(page);
  await page.goto("/papers/");
  await expect(page.getByText("Official · CFA UK").first()).toBeVisible();
  await page.goto("/papers/practice/unit1/");
  await expect(page.getByText("AI-generated, unofficial")).toBeVisible();
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByRole("timer")).toBeVisible();
});

test("calc drill generates numbers and checks answers", async ({ page }) => {
  await dismissWelcome(page);
  await page.goto("/learn/uk-tax/income-tax-basics/tax-drill-basic/");
  const prompt = await page.locator("p.text-lg").first().innerText();
  const salary = Number(prompt.match(/£([\d,]+)/)![1]!.replace(/,/g, ""));
  await page.getByLabel("Your answer").fill(String((salary - 12570) * 0.2));
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("status")).toContainText("Correct");
});

test("theme setting switches to dark mode", async ({ page }) => {
  await dismissWelcome(page);
  await page.goto("/settings/");
  await page.getByLabel("dark").check();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("memory aid: learn the phrase, then tap the items back in order", async ({ page }) => {
  await dismissWelcome(page);
  await page.goto("/learn/ethics/ethics-foundations/eth-memory-conduct-rules/");
  await expect(page.getByText("Overlook").first()).toBeVisible();
  await page.getByRole("button", { name: /test me/ }).click();
  await page.getByRole("button", { name: "Due skill, care and diligence" }).click();
  await expect(page.getByText("Not that one yet")).toBeVisible();
  for (const label of ["Integrity", "Due skill, care and diligence", "Open and cooperative with regulators", "Customers' interests, treated fairly", "Market conduct standards", "Outcomes for retail customers"]) {
    await page.getByRole("button", { name: label }).click();
  }
  await expect(page.getByText(/Done, with 1 slip/)).toBeVisible();
});

test("feedback on a question carries the question and answer", async ({ page, context }) => {
  await dismissWelcome(page);
  await page.goto("/learn/ethics/ethics-foundations/eth-q-legal-unethical/");
  await page.getByText("Illegal but ethical").click();
  await page.getByRole("button", { name: "Feedback on this question" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByLabel("Tell us more").fill("Option C wording is confusing");
  let issueLink = "";
  await context.route("https://github.com/**", (route) => {
    issueLink ||= route.request().url();
    return route.fulfill({ body: "ok" });
  });
  await page.getByRole("dialog").getByRole("button", { name: "Send feedback" }).click();
  await expect.poll(() => issueLink).not.toBe("");
  const url = new URL(issueLink);
  expect(url.pathname).toContain("/issues/new");
  expect(url.searchParams.get("context")).toContain("Question: q-u1-eth-0001");
  expect(url.searchParams.get("context")).toContain("Learner's answer: Illegal but ethical");
  await expect(page.getByRole("status")).toContainText("Thanks");
});
