import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Gives `next dev` the same D1/R2 bindings the deployed Worker uses.
initOpenNextCloudflareForDev({ configPath: "./freebuff.wrangler.jsonc" });

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
