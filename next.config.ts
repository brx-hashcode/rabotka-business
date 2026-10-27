import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server for the Docker image: .next/standalone/server.js
  // plus only the traced node_modules it needs.
  output: "standalone",
  poweredByHeader: false,
  // Dev only: lets a phone on the local network load the dev server
  // (http://192.168.x.x:3000) with hot reload.
  allowedDevOrigins: ["192.168.*.*"],
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
