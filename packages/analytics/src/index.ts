export const ANALYTICS_EVENTS = [
  "platform_loaded",
  "game_impression",
  "game_selected",
  "game_load_started",
  "game_loaded",
  "game_boot_failed",
  "gameplay_started",
  "gameplay_ended",
  "game_retry",
  "score_submitted",
  "score_rejected",
  "score_flagged",
  "personal_best",
  "achievement_unlocked",
  "quest_progressed",
  "quest_completed",
  "xp_earned",
  "level_up",
  "friend_invited",
  "friend_added",
  "game_shared",
  "signup_started",
  "signup_completed",
  "auth_failed",
  "auth_completed",
  "guest_merged",
  "guest_merge_started",
  "guest_merge_completed",
  "guest_merge_failed",
  "sync_failed",
  "api_error",
  "fps_degraded",
  "web_vital",
  "search_used",
  "recommendation_clicked",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

export type AnalyticsAdapter = {
  track: (event: AnalyticsEventName, props?: AnalyticsProps) => void;
  identify: (id: string, traits?: AnalyticsProps) => void;
  reset: () => void;
  page: (name: string, props?: AnalyticsProps) => void;
};

function readEnv(name: string): string | undefined {
  try {
    return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[
      name
    ];
  } catch {
    return undefined;
  }
}

const queue: Array<() => void> = [];
let adapter: AnalyticsAdapter | null = null;
let context: AnalyticsProps = {};

function emit(run: () => void) {
  if (typeof window === "undefined") return;
  if (!adapter) {
    queue.push(run);
    return;
  }
  run();
}

export function setAnalyticsContext(props: AnalyticsProps) {
  context = { ...context, ...props };
}

export function initAnalytics(next: AnalyticsAdapter) {
  adapter = next;
  const pending = queue.splice(0, queue.length);
  pending.forEach((fn) => fn());
}

export const analytics: AnalyticsAdapter = {
  track(event, props) {
    emit(() => adapter?.track(event, { ...context, ...props }));
  },
  identify(id, traits) {
    emit(() => adapter?.identify(id, traits));
  },
  reset() {
    emit(() => adapter?.reset());
  },
  page(name, props) {
    emit(() => adapter?.page(name, { ...context, ...props }));
  },
};

export function createConsoleAdapter(): AnalyticsAdapter {
  return {
    track: (event, props) => {
      if (readEnv("NODE_ENV") === "development") {
        console.info(`[analytics] ${event}`, props ?? {});
      }
    },
    identify: () => undefined,
    reset: () => undefined,
    page: () => undefined,
  };
}

export function createPostHogAdapter(): AnalyticsAdapter {
  const key = readEnv("NEXT_PUBLIC_POSTHOG_KEY");
  if (!key || typeof window === "undefined") {
    return createConsoleAdapter();
  }

  const host = (readEnv("NEXT_PUBLIC_POSTHOG_HOST") ?? "https://us.i.posthog.com").replace(/\/$/, "");
  let distinctId = localStorage.getItem("gamesweb.analytics.id") ?? crypto.randomUUID();
  localStorage.setItem("gamesweb.analytics.id", distinctId);

  function capture(event: string, props?: AnalyticsProps) {
    void fetch(`${host}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event,
        distinct_id: distinctId,
        properties: sanitize(props),
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    }).catch(() => undefined);
  }

  return {
    track: (event, props) => capture(event, props),
    identify: (id, traits) => {
      distinctId = id;
      localStorage.setItem("gamesweb.analytics.id", id);
      capture("$identify", traits);
    },
    reset: () => {
      distinctId = crypto.randomUUID();
      localStorage.setItem("gamesweb.analytics.id", distinctId);
    },
    page: (name, props) => capture("$pageview", { name, ...props }),
  };
}

const BLOCKED_KEYS = /email|token|password|cookie|authorization|secret|save|payload/i;

function sanitize(props?: AnalyticsProps): AnalyticsProps {
  const out: AnalyticsProps = { $lib: "gamesweb" };
  if (!props) return out;
  for (const [key, value] of Object.entries(props)) {
    if (BLOCKED_KEYS.test(key)) continue;
    if (typeof value === "string" && value.includes("@") && value.includes(".")) continue;
    out[key] = value;
  }
  return out;
}

export function bootAnalytics() {
  if (typeof window === "undefined") return;
  const key = readEnv("NEXT_PUBLIC_POSTHOG_KEY");
  const production = readEnv("NODE_ENV") === "production" || readEnv("VERCEL_ENV") === "production";
  if (!key && production) {
    initAnalytics({
      track: () => undefined,
      identify: () => undefined,
      reset: () => undefined,
      page: () => undefined,
    });
    return;
  }
  initAnalytics(key ? createPostHogAdapter() : createConsoleAdapter());
}
