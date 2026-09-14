import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
