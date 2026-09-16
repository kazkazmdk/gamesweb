type Kind = "score" | "speed" | "combo" | "boss" | "explore" | "streak" | "social" | "run";

function kindFor(id: string, key: string): Kind {
  if (key.includes("social") || id.includes("social")) return "social";
  if (key.includes("streak") || key.includes("weekender") || key.includes("return") || key.includes("daily")) return "streak";
  if (key.includes("boss") || key.includes("elite") || key.includes("kills") || key.includes("blood")) return "boss";
  if (key.includes("combo") || key.includes("chain") || key.includes("heat")) return "combo";
  if (key.includes("score") || key.includes("apex") || key.includes("pink")) return "score";
  if (key.includes("sub") || key.includes("gold") || key.includes("platinum") || key.includes("bronze") || key.includes("fast")) return "speed";
  if (key.includes("explorer") || key.includes("worlds") || key.includes("gate") || key.includes("course")) return "explore";
  return "run";
}

function accentFor(gameId: string) {
  if (gameId === "neon-drift") return "#e35aa0";
  if (gameId === "velocity-run") return "#3ec6e8";
  if (gameId === "swarm-protocol") return "#f07a3a";
  return "#d7c4a3";
}

export function AchievementIcon({
  id,
  gameId,
  unlocked,
}: {
  id: string;
  key?: string;
  gameId: string;
  unlocked: boolean;
}) {
  const key = id.split(":")[1] ?? id;
  const kind = kindFor(id, key);
  const accent = accentFor(gameId);
  const fill = unlocked ? accent : "currentColor";
  return (
    <svg viewBox="0 0 48 48" className={`h-11 w-11 shrink-0 ${unlocked ? "" : "opacity-35"}`} aria-hidden>
      <rect x="3" y="3" width="42" height="42" rx="10" fill={unlocked ? `${accent}22` : "transparent"} stroke={fill} strokeWidth="1.4" />
      {kind === "score" ? (
        <path d="M14 30 L24 12 L34 30 Z" fill="none" stroke={fill} strokeWidth="2.2" />
      ) : null}
      {kind === "speed" ? (
        <path d="M12 30 L28 12 M18 32 L36 16" fill="none" stroke={fill} strokeWidth="2.4" strokeLinecap="round" />
      ) : null}
      {kind === "combo" ? (
        <>
          <circle cx="18" cy="24" r="6" fill="none" stroke={fill} strokeWidth="2" />
          <circle cx="30" cy="24" r="6" fill="none" stroke={fill} strokeWidth="2" />
        </>
      ) : null}
      {kind === "boss" ? (
        <path d="M14 30 V18 L24 12 L34 18 V30 L24 24 Z" fill="none" stroke={fill} strokeWidth="2" />
      ) : null}
      {kind === "explore" ? (
        <path d="M14 24 H34 M24 14 V34 M16 16 L32 32 M32 16 L16 32" stroke={fill} strokeWidth="1.8" />
      ) : null}
      {kind === "streak" ? (
        <path d="M16 28c0-8 16-8 16 0 0 6-8 10-8 10s-8-4-8-10z" fill="none" stroke={fill} strokeWidth="2" />
      ) : null}
      {kind === "social" ? (
        <>
          <circle cx="20" cy="20" r="5" fill="none" stroke={fill} strokeWidth="2" />
          <circle cx="30" cy="22" r="4" fill="none" stroke={fill} strokeWidth="2" />
          <path d="M12 34c2-6 16-6 18 0 M24 34c2-5 14-4 14 0" fill="none" stroke={fill} strokeWidth="2" />
        </>
      ) : null}
      {kind === "run" ? (
        <circle cx="24" cy="24" r="8" fill="none" stroke={fill} strokeWidth="2.2" />
      ) : null}
    </svg>
  );
}
