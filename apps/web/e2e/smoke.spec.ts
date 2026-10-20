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
  await expect(page.getByText("3 of 14 tasks done")).toBeVisible();
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
