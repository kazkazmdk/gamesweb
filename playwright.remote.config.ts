import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL;
if (!baseURL) {
  throw new Error("BASE_URL is required for remote e2e (example: https://<preview>.vercel.app)");
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: /remote-keyboard\.spec\.ts/,
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
