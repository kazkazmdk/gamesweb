import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "apps/web"),
      "@gamesweb/game-sdk": path.resolve(__dirname, "packages/game-sdk/src/index.ts"),
      "@gamesweb/config": path.resolve(__dirname, "packages/config/src/index.ts"),
      "@gamesweb/neon-drift": path.resolve(__dirname, "games/neon-drift/src/index.ts"),
      "@gamesweb/velocity-run": path.resolve(__dirname, "games/velocity-run/src/index.ts"),
      "@gamesweb/knockout-circuit": path.resolve(__dirname, "games/knockout-circuit/src/index.ts"),
      "@gamesweb/pocket-striker": path.resolve(__dirname, "games/pocket-striker/src/index.ts"),
    },
  },
});
