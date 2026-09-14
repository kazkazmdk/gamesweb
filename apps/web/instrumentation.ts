export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { assertProductionSecrets, isVercelProduction } = await import("./lib/env");
  const missing = assertProductionSecrets();
  if (!missing.length) return;
  const payload = JSON.stringify({ event: "env_missing", missing });
  if (isVercelProduction()) {
    throw new Error(`Production environment is incomplete: ${missing.join(", ")}`);
  }
  console.error(payload);
}
