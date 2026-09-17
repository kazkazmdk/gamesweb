import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const configDir = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = existsSync(path.join(configDir, "pnpm-workspace.yaml"))
  ? configDir
  : path.join(configDir, "../..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  reactStrictMode: true,
  transpilePackages: [
    "@gamesweb/analytics",
    "@gamesweb/config",
    "@gamesweb/database",
    "@gamesweb/game-core",
    "@gamesweb/game-sdk",
    "@gamesweb/crowd-control",
    "@gamesweb/knockout-circuit",
    "@gamesweb/neon-drift",
    "@gamesweb/pocket-striker",
    "@gamesweb/sky-stack",
    "@gamesweb/swarm-protocol",
    "@gamesweb/territory-rush",
    "@gamesweb/ui",
    "@gamesweb/velocity-run",
  ],
  typedRoutes: false,
  images: { unoptimized: true },
  serverExternalPackages: ["phaser"],
};

export default nextConfig;
