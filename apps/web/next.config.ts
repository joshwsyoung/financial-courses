import type { NextConfig } from "next";

// Static export so the site runs on any host (spec 9.2). Set NEXT_PUBLIC_BASE_PATH
// when serving from a sub-path, e.g. "/financial-courses" on GitHub Pages.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  transpilePackages: ["@ofc/engine", "@ofc/content"],
  outputFileTracingRoot: new URL("../..", import.meta.url).pathname,
};

export default config;
