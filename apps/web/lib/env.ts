export type RuntimeEnv = "development" | "preview" | "production";

function read(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export function runtimeEnv(): RuntimeEnv {
  const vercel = read("VERCEL_ENV");
  if (vercel === "production" || vercel === "preview") return vercel;
  if (read("NODE_ENV") === "production" && vercel === "production") return "production";
  if (vercel === "preview") return "preview";
  return "development";
}

export function isVercelProduction(): boolean {
  return read("VERCEL_ENV") === "production";
}

export function appUrl(): string {
  return (read("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000").replace(/\/$/, "");
}

export function supabaseUrl(): string | undefined {
  return read("NEXT_PUBLIC_SUPABASE_URL");
}

export function supabasePublishableKey(): string | undefined {
  return read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ?? read("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function supabaseSecretKey(): string | undefined {
  return read("SUPABASE_SECRET_KEY") ?? read("SUPABASE_SERVICE_ROLE_KEY");
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabasePublishableKey());
}

export function hasSupabaseAdmin(): boolean {
  return Boolean(supabaseUrl() && supabaseSecretKey());
}

export function showSeedData(): boolean {
  if (isVercelProduction()) return false;
  return read("NEXT_PUBLIC_SHOW_SEED_DATA") === "true";
}

export type BackendKind = "memory" | "supabase" | "none";

export function resolveBackend(): BackendKind {
  const forced = read("GAMESWEB_BACKEND");
  if (forced === "memory") return "memory";
  if (forced === "supabase") return hasSupabaseAdmin() ? "supabase" : "none";
  if (hasSupabaseAdmin()) return "supabase";
  if (isVercelProduction()) return "none";
  return "memory";
}

export function publicEnvFlags() {
  return {
    env: runtimeEnv(),
    backend: resolveBackend(),
    supabase: isSupabaseConfigured(),
    posthog: Boolean(read("NEXT_PUBLIC_POSTHOG_KEY")),
    turnstile: Boolean(read("NEXT_PUBLIC_TURNSTILE_SITE_KEY")),
    seed: showSeedData(),
  };
}

export function assertProductionSecrets(): string[] {
  if (!isVercelProduction()) return [];
  const missing: string[] = [];
  if (!supabaseUrl()) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabasePublishableKey()) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!supabaseSecretKey()) missing.push("SUPABASE_SECRET_KEY");
  return missing;
}
