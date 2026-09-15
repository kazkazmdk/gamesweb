export function pulseHaptic(pattern: number | number[] = 18) {
  if (typeof navigator === "undefined") return;
  if (typeof localStorage !== "undefined" && localStorage.getItem("gw:haptics") === "0") return;
  if (typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* unsupported or denied */
  }
}
