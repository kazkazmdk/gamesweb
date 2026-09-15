import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(fileURLToPath(new URL(".", import.meta.url)), "../.."),
  reactStrictMode: true,
  transpilePackages: [
    "@gamesweb/analytics",
    "@gamesweb/config",
    "@gamesweb/database",
    "@gamesweb/game-core",
    "@gamesweb/game-sdk",
    "@gamesweb/neon-drift",
    "@gamesweb/swarm-protocol",
    "@gamesweb/ui",
    "@gamesweb/velocity-run",
  ],
  typedRoutes: false,
  images: { unoptimized: true },
  serverExternalPackages: ["phaser"],
};

export default nextConfig;
