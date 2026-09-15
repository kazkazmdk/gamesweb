export type GameplayPrefs = {
  reducedMotion: boolean;
  ghost: boolean;
  haptics: boolean;
  shake: number;
};

export function readGhostPref() {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem("gw:neon-ghost-on") !== "0";
}

export function writeGameplayPrefs(prefs: GameplayPrefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem("gw:reduced-motion", prefs.reducedMotion ? "1" : "0");
  localStorage.setItem("gw:haptics", prefs.haptics ? "1" : "0");
  localStorage.setItem("gw:shake", String(Math.max(0, Math.min(1, prefs.shake))));
  localStorage.setItem("gw:neon-ghost-on", prefs.ghost ? "1" : "0");
  localStorage.setItem("gw:velocity-ghost-on", prefs.ghost ? "1" : "0");
  document.documentElement.classList.toggle("reduce-motion", prefs.reducedMotion);
}

export function accountSyncCopy(input: { isGuest: boolean; backend: "local" | "supabase" }) {
  if (input.isGuest || input.backend === "local") {
    return input.isGuest ? "Saved on this device." : "Sync unavailable.";
  }
  return "Synced to account.";
}
