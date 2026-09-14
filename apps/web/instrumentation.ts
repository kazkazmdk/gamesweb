export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { assertProductionSecrets } = await import("./lib/env");
  const missing = assertProductionSecrets();
  if (missing.length) {
    console.error(JSON.stringify({ event: "env_missing", missing }));
  }
}
