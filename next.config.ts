import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep puppeteer (and its Chromium launcher) out of the webpack bundle — it is
  // a server-only dependency used by the /api/pdf route handler.
  serverExternalPackages: ["puppeteer", "puppeteer-core"],
};

export default nextConfig;
