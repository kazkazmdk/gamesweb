export const ANALYTICS_EVENTS = [
  "platform_loaded",
  "game_impression",
  "game_selected",
  "game_load_started",
  "game_loaded",
  "gameplay_started",
  "gameplay_ended",
  "game_retry",
  "score_submitted",
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
  "guest_merged",
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
        properties: { ...props, $lib: "gamesweb" },
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

export function bootAnalytics() {
  if (typeof window === "undefined") return;
  const key = readEnv("NEXT_PUBLIC_POSTHOG_KEY");
  initAnalytics(key ? createPostHogAdapter() : createConsoleAdapter());
}
