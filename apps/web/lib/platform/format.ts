export function formatPlayScore(gameId: string, score: number) {
  if (!Number.isFinite(score) || score <= 0 || score >= 1e12) return null;
  if (gameId === "velocity-run" || gameId === "knockout-circuit") return `${(score / 1000).toFixed(3)}s`;
  if (gameId === "pocket-striker") return `${Math.round(score)} strokes`;
  return Math.round(score).toLocaleString();
}

export function formatScoreOrDash(gameId: string, score: number) {
  return formatPlayScore(gameId, score) ?? "—";
}

export function formatRank(rank: number | null) {
  if (rank === null || rank < 1) return "—";
  return `#${rank}`;
}

export function formatLevel(level: number) {
  return `Lv ${level}`;
}

export function formatFraction(current: number, total: number) {
  return `${current}/${total}`;
}

export function formatRelativeTime(at: number, now = Date.now()) {
  if (!Number.isFinite(at) || at <= 0) return null;
  const delta = Math.max(0, now - at);
  const sec = Math.round(delta / 1000);
  if (sec < 45) return "just now";
  if (sec < 90) return "1 min ago";
  if (sec < 3600) return `${Math.round(sec / 60)} min ago`;
  const hours = Math.round(sec / 3600);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.round(sec / 86400);
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  return null;
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${h}:${pad(m)}:${pad(s)}`;
}

export function msUntilUtcMidnight(now = Date.now()) {
  const d = new Date(now);
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  return Math.max(0, next - now);
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function hasRecord(score: number) {
  return Number.isFinite(score) && score > 0 && score < 1e12;
}
