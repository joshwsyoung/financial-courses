export const SITE_NAME = "Open Finance Course";
export const REPO_URL = "https://github.com/joshwsyoung/financial-courses";

export function issueUrl(template: string, title: string, body = ""): string {
  const p = new URLSearchParams({ template, title, body });
  return `${REPO_URL}/issues/new?${p.toString()}`;
}
