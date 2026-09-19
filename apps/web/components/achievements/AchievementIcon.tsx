type Glyph = { paths?: string[]; circles?: Array<{ cx: number; cy: number; r: number }>; lines?: string };

const GLYPHS: Record<string, Glyph> = {
  "first-run": { paths: ["M12 32 L24 12 L36 32 Z"] },
  "three-worlds": { circles: [{ cx: 16, cy: 24, r: 6 }, { cx: 24, cy: 18, r: 6 }, { cx: 32, cy: 24, r: 6 }] },
  "on-fire": { paths: ["M18 34c0-8 12-10 12-18 6 6 4 18-6 18z"] },
  "night-shift": { paths: ["M28 14a12 12 0 1 0 6 20 10 10 0 0 1-6-20z"] },
  explorer: { paths: ["M14 24 H34 M24 14 V34"], lines: "M16 16 L32 32" },
  "return-tomorrow": { paths: ["M16 18 A10 10 0 1 1 14 28", "M16 18 L12 22 L20 22"] },
  weekender: { paths: ["M14 30 V18 L24 12 L34 18 V30"] },
  "social-spark": { circles: [{ cx: 19, cy: 20, r: 5 }, { cx: 30, cy: 22, r: 4 }], paths: ["M12 34c2-6 16-6 18 0"] },
  "first-slide": { paths: ["M12 30 Q24 10 36 28", "M28 22 L36 28 L28 32"] },
  "combo-5": { circles: [{ cx: 18, cy: 24, r: 5 }, { cx: 30, cy: 24, r: 5 }], paths: ["M24 14 V34"] },
  "score-25k": { paths: ["M14 30 L24 12 L34 30", "M18 24 H30"] },
  "score-60k": { paths: ["M16 32 L24 10 L32 32", "M14 22 H34"] },
  "two-laps": { paths: ["M16 24 A8 8 0 1 1 32 24 A8 8 0 1 1 16 24"] },
  "near-miss": { paths: ["M12 28 L20 16 L28 28", "M26 20 L36 32"] },
  "grass-survive": { paths: ["M14 32 L18 18 L24 28 L30 16 L34 32"] },
  "boost-gate": { paths: ["M14 14 H34 V20 H14 Z", "M14 28 H34 V34 H14 Z"] },
  "no-crash-lap": { paths: ["M16 24 H32", "M24 16 V32", "M18 20 L30 28"] },
  "daily-drift": { paths: ["M14 30 Q24 8 34 30"] },
  "first-finish": { paths: ["M14 32 V16 L24 10 L34 16 V32"] },
  bronze: { circles: [{ cx: 24, cy: 24, r: 10 }], paths: ["M20 24 L23 27 L30 18"] },
  gold: { paths: ["M16 30 L24 12 L32 30 Z", "M18 24 H30"] },
  platinum: { paths: ["M24 12 L34 24 L24 36 L14 24 Z"] },
  "all-courses": { paths: ["M14 32 L18 16 H30 L34 32", "M18 24 H30"] },
  "no-death": { paths: ["M16 28c0-8 16-8 16 0 0 6-8 10-8 10s-8-4-8-10z"] },
  "sub-40": { paths: ["M14 30 L30 14", "M20 32 L36 18"] },
  "fast-fall": { paths: ["M24 12 V34", "M16 26 L24 34 L32 26"] },
  "retry-10": { paths: ["M16 18 A10 10 0 1 1 14 30", "M16 18 L22 14 L22 22"] },
  "pb-twice": { paths: ["M14 30 L24 14 L34 30", "M18 30 L24 22 L30 30"] },
  "first-blood": { paths: ["M24 12 L28 22 H36 L30 28 L32 36 L24 31 L16 36 L18 28 L12 22 H20 Z"] },
  "survive-2": { paths: ["M14 24 H34", "M24 14 V34"] },
  "survive-5": { paths: ["M16 16 H32 V32 H16 Z", "M16 24 H32"] },
  "level-8": { paths: ["M18 16 H30 V24 H18 Z", "M18 24 H30 V32 H18 Z"] },
  elite: { paths: ["M14 32 L24 10 L34 32 Z", "M18 26 H30"] },
  splitter: { paths: ["M24 12 V36", "M14 20 L24 28 L34 20"] },
  "dash-kill": { paths: ["M12 24 H36", "M28 16 L36 24 L28 32"] },
  "kills-200": { circles: [{ cx: 18, cy: 20, r: 4 }, { cx: 30, cy: 20, r: 4 }, { cx: 24, cy: 30, r: 4 }] },
  shield: { paths: ["M24 10 L34 16 V26 C34 32 24 36 24 36 C24 36 14 32 14 26 V16 Z"] },
  chain: { circles: [{ cx: 18, cy: 24, r: 6 }, { cx: 30, cy: 24, r: 6 }] },
  boss: { paths: ["M14 30 V16 L24 10 L34 16 V30 L24 24 Z"] },
  blood: { paths: ["M24 12 C32 20 32 28 24 36 C16 28 16 20 24 12"] },
};

function glyphFor(key: string): Glyph {
  if (GLYPHS[key]) return GLYPHS[key];
  const n = [...key].reduce((a, c) => a + c.charCodeAt(0), 0);
  const variants: Glyph[] = Object.values(GLYPHS);
  return variants[n % variants.length];
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
  const accent = accentFor(gameId);
  const glyph = glyphFor(key);
  const stroke = unlocked ? accent : "rgba(243,241,236,0.62)";
  const fill = unlocked ? `${accent}28` : "rgba(255,255,255,0.04)";
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0" aria-hidden>
      <polygon points="6,2 42,2 46,6 46,42 42,46 6,46 2,42 2,6" fill={fill} stroke={stroke} strokeWidth="1.4" />
      {glyph.paths?.map((d) => (
        <path key={d} d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {glyph.circles?.map((c) => (
        <circle key={`${c.cx}-${c.cy}`} cx={c.cx} cy={c.cy} r={c.r} fill="none" stroke={stroke} strokeWidth="2" />
      ))}
      {glyph.lines ? <path d={glyph.lines} fill="none" stroke={stroke} strokeWidth="1.8" /> : null}
    </svg>
  );
}
