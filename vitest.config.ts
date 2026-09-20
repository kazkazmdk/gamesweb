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
      "@gamesweb/analytics": path.resolve(__dirname, "packages/analytics/src/index.ts"),
    },
  },
});
