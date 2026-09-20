export type RuntimeEnv = "development" | "preview" | "production";

function read(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export function runtimeEnv(): RuntimeEnv {
  const vercel = read("VERCEL_ENV");
  if (vercel === "production" || vercel === "preview") return vercel;
  return "development";
}

export function isVercelProduction(): boolean {
  return read("VERCEL_ENV") === "production";
}

const LOCAL_HOST = /localhost|127\.0\.0\.1|::1/;

function asOrigin(raw: string) {
  const trimmed = raw.replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

export function appUrl(): string {
  const explicit = read("NEXT_PUBLIC_APP_URL");
  const vercelEnv = read("VERCEL_ENV");
  const onVercel = vercelEnv === "production" || vercelEnv === "preview" || read("VERCEL") === "1";

  if (onVercel) {
    if (explicit && !LOCAL_HOST.test(explicit)) return asOrigin(explicit);
    const host =
      (vercelEnv === "production" ? read("VERCEL_PROJECT_PRODUCTION_URL") : undefined) ??
      read("VERCEL_URL");
    if (host) return asOrigin(host);
  }

  return (explicit ?? "http://localhost:3000").replace(/\/$/, "");
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

export function hasUpstash(): boolean {
  return Boolean(read("UPSTASH_REDIS_REST_URL") && read("UPSTASH_REDIS_REST_TOKEN"));
}

export function showSeedData(): boolean {
  if (isVercelProduction()) return false;
  return read("NEXT_PUBLIC_SHOW_SEED_DATA") === "true";
}

export type BackendKind = "memory" | "supabase" | "none";

function hasAnyBackendSecrets(): boolean {
  return Boolean(supabaseUrl() || supabasePublishableKey() || supabaseSecretKey() || hasUpstash());
}

export function resolveBackend(): BackendKind {
  const forced = read("GAMESWEB_BACKEND");
  if (forced === "memory") return "memory";
  if (forced === "supabase") return hasSupabaseAdmin() ? "supabase" : "none";
  if (hasSupabaseAdmin()) return "supabase";
  // Empty Vercel project (no Supabase/Upstash): playable in-process demo.
  if (!hasAnyBackendSecrets()) return "memory";
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
  // Explicit demo, or a fresh Vercel project with no backend secrets yet.
  if (read("GAMESWEB_BACKEND") === "memory") return [];
  if (!hasAnyBackendSecrets()) return [];
  const missing: string[] = [];
  if (!supabaseUrl()) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabasePublishableKey()) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!supabaseSecretKey()) missing.push("SUPABASE_SECRET_KEY");
  if (!hasUpstash()) {
    missing.push("UPSTASH_REDIS_REST_URL");
    missing.push("UPSTASH_REDIS_REST_TOKEN");
  }
  const url = appUrl();
  if (!url.startsWith("https://")) missing.push("NEXT_PUBLIC_APP_URL (must be https in production)");
  if (read("NEXT_PUBLIC_SHOW_SEED_DATA") === "true") missing.push("NEXT_PUBLIC_SHOW_SEED_DATA must be false");
  const pub = supabasePublishableKey();
  const secret = supabaseSecretKey();
  if (pub && secret && pub === secret) missing.push("SUPABASE_SECRET_KEY must not equal the publishable key");
  return missing;
}
