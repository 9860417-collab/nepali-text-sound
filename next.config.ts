import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // msedge-tts opens a WebSocket from Node; keep it out of the server bundle
  serverExternalPackages: ["msedge-tts"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
