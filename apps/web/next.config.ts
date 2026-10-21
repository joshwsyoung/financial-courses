import type { NextConfig } from "next";

// Static export so the site runs on any host (spec 9.2). Set NEXT_PUBLIC_BASE_PATH
// when serving from a sub-path, e.g. "/financial-courses" on GitHub Pages.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  env: {
    // Vercel provides the commit at build time; it's attached to feedback so reports map to a version.
    NEXT_PUBLIC_COMMIT: process.env.VERCEL_GIT_COMMIT_SHA ?? "",
    NEXT_PUBLIC_SYLLABUS_VERSION: "IMC v24",
  },
  transpilePackages: ["@ofc/engine", "@ofc/content"],
  outputFileTracingRoot: new URL("../..", import.meta.url).pathname,
};

export default config;
