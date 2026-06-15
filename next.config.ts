import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a minimal, self-contained production server at .next/standalone/server.js.
  // Required for the lean Docker image used on Railway (see Dockerfile + railway.json).
  output: "standalone",
  // Pin the workspace/tracing root to this project so standalone file tracing stays
  // correct even when an unrelated lockfile exists in a parent directory.
  outputFileTracingRoot: import.meta.dirname,
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
