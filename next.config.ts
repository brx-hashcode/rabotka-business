import { execSync } from "node:child_process";
import type { NextConfig } from "next";

/**
 * The commit this build is of, shown in the space's sidebar: the deploy
 * passes it in (APP_VERSION, the Docker build has no .git), a local build
 * reads it from git.
 */
function buildCommit(): string {
  if (process.env.APP_VERSION) return process.env.APP_VERSION.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "dev";
  }
}

const nextConfig: NextConfig = {
  // Self-contained server for the Docker image: .next/standalone/server.js
  // plus only the traced node_modules it needs.
  output: "standalone",
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_APP_VERSION: buildCommit(),
    NEXT_PUBLIC_APP_BUILT_AT: new Date().toISOString(),
  },
  // Dev only: lets a phone on the local network load the dev server
  // (http://192.168.x.x:3000) with hot reload.
  allowedDevOrigins: ["192.168.*.*"],
  experimental: {
    // src/proxy.ts sees every /api call, and Next cuts a body it proxies at
    // 10MB by default: an « Analyse de CV » sends all its files in one request.
    proxyClientMaxBodySize: "50mb",
    // …and gives up on it after 30 s by default: an AI draft (two model calls
    // across the fallback chain), a report or a slow upload took longer.
    proxyTimeout: 120_000,
    // The /espace pages are thin server shells around client screens that
    // load through React Query: going back to one reuses its shell for 5 min
    // instead of a server round trip. Sign-out and session expiry call
    // router.refresh(), which clears this cache.
    staleTimes: { dynamic: 300 },
  },
  // « Tri des CV » became « Analyse de CV »: links already sent (in-app
  // notifications, bookmarks) keep working.
  async redirects() {
    return [
      { source: "/espace/tri-cv/nouveau", destination: "/espace/analyse-cv/nouvelle", permanent: true },
      { source: "/espace/tri-cv/:path*", destination: "/espace/analyse-cv/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
