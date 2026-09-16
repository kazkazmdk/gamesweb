export function GameArt({
  slug,
  className = "",
  variant = "hero",
}: {
  slug: string;
  className?: string;
  variant?: "hero" | "tile" | "backdrop";
}) {
  const id = `${slug}-${variant}`;
  if (slug === "neon-drift") return <NeonArt className={className} id={id} variant={variant} />;
  if (slug === "velocity-run") return <VelocityArt className={className} id={id} variant={variant} />;
  return <SwarmArt className={className} id={id} variant={variant} />;
}

function box(variant: string, game: "neon" | "velocity" | "swarm") {
  if (variant === "tile") {
    if (game === "neon") return "900 380 620 360";
    if (game === "velocity") return "520 260 560 380";
    return "760 250 620 430";
  }
  if (variant === "hero") {
    if (game === "neon") return "180 40 1420 860";
    if (game === "velocity") return "80 0 1520 900";
    return "120 0 1480 900";
  }
  return "0 0 1600 900";
}

function NeonArt({ className, id, variant }: { className?: string; id: string; variant: string }) {
  const tight = variant === "tile";
  return (
    <svg viewBox={box(variant, "neon")} preserveAspectRatio="xMaxYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#3a1224" />
          <stop offset="0.45" stopColor="#140810" />
          <stop offset="1" stopColor="#070407" />
        </linearGradient>
        <radialGradient id={`${id}-lamp`} cx="72%" cy="28%" r="42%">
          <stop offset="0" stopColor="#ff7ab8" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#e35aa0" stopOpacity="0.16" />
          <stop offset="1" stopColor="#e35aa0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-asphalt`} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor="#151015" />
          <stop offset="0.55" stopColor="#241820" />
          <stop offset="1" stopColor="#0d0a0c" />
        </linearGradient>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7f1ea" />
          <stop offset="0.55" stopColor="#c9b8b0" />
          <stop offset="1" stopColor="#2a161c" />
        </linearGradient>
        <filter id={`${id}-smoke`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={tight ? 4 : 10} />
        </filter>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}-sky)`} />
      <rect width="1600" height="900" fill={`url(#${id}-lamp)`} />
      <path d="M1180 0 L1260 0 L1230 520 L1140 520 Z" fill="#1a0c14" />
      <path d="M1320 0 L1420 0 L1400 540 L1288 540 Z" fill="#12080e" />
      <rect x="1210" y="90" width="14" height="90" fill="#e35aa0" opacity="0.55" />
      <rect x="1358" y="140" width="10" height="70" fill="#f6e7a8" opacity="0.4" />
      <path d="M-40 900 L 80 430 L 280 430 L 220 900 Z" fill="#12080e" />
      <path d="M40 900 L 160 470 L 250 470 L 180 900 Z" fill="#1c1016" />
      <path d="M-120 780 C 260 430, 520 820, 880 500 S 1280 220, 1760 470 L 1760 900 L -120 900 Z" fill={`url(#${id}-asphalt)`} />
      <path d="M-120 750 C 280 410, 540 790, 900 478 S 1300 210, 1760 448" fill="none" stroke="#e35aa0" strokeWidth="7" opacity="0.9" />
      <path d="M-120 792 C 300 460, 560 830, 920 518 S 1320 248, 1760 500" fill="none" stroke="#f3f1ec" strokeWidth="2" opacity="0.28" strokeDasharray="28 22" />
      <g filter={`url(#${id}-smoke)`} opacity="0.55">
        <ellipse cx="780" cy="640" rx="160" ry="36" fill="#f3f1ec" />
        <ellipse cx="920" cy="670" rx="120" ry="28" fill="#e35aa0" />
        <ellipse cx="1040" cy="690" rx="90" ry="18" fill="#f3f1ec" />
      </g>
      <g transform="translate(1080 430) rotate(-24) scale(2.15)">
        <ellipse cx="10" cy="52" rx="92" ry="16" fill="#000" opacity="0.45" />
        <path d="M-108 4 C -96 -28, -40 -42, 8 -36 L 118 -12 C 146 -6, 156 18, 140 34 L 92 50 L -86 38 C -118 32, -124 14, -108 4 Z" fill="#161014" />
        <path d="M-96 6 C -84 -18, -36 -28, 10 -22 L 100 -2 C 122 4, 128 20, 112 30 L 82 40 L -74 30 C -96 24, -104 14, -96 6 Z" fill={`url(#${id}-body)`} />
        <path d="M8 -22 L 64 -8 L 58 16 L 2 4 Z" fill="#2a1820" />
        <rect x="112" y="2" width="18" height="12" rx="1" fill="#f6e7a8" />
        <rect x="112" y="18" width="18" height="12" rx="1" fill="#f6e7a8" />
        <rect x="-102" y="8" width="14" height="10" fill="#e35aa0" />
        <rect x="-102" y="22" width="14" height="10" fill="#e35aa0" />
        <rect x="-28" y="-34" width="26" height="10" rx="2" fill="#0a080a" />
        <rect x="28" y="-24" width="26" height="10" rx="2" fill="#0a080a" />
        <rect x="-32" y="32" width="28" height="12" rx="4" fill="#0a080a" />
        <rect x="36" y="36" width="28" height="12" rx="4" fill="#0a080a" />
        <path d="M-50 16 L 88 28" stroke="#e35aa0" strokeWidth="3" opacity="0.7" />
      </g>
      {!tight ? (
        <g opacity="0.55">
          <path d="M760 620 C 860 560, 960 600, 1080 540" fill="none" stroke="#f3f1ec" strokeWidth="4" />
          <path d="M790 650 C 900 590, 1020 640, 1140 570" fill="none" stroke="#e35aa0" strokeWidth="3" />
        </g>
      ) : null}
    </svg>
  );
}

function VelocityArt({ className, id, variant }: { className?: string; id: string; variant: string }) {
  const tight = variant === "tile";
  return (
    <svg viewBox={box(variant, "velocity")} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0.2" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0a2830" />
          <stop offset="1" stopColor="#04080c" />
        </linearGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ff3ff" stopOpacity="0.7" />
          <stop offset="1" stopColor="#3ec6e8" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="38%" cy="22%" r="50%">
          <stop offset="0" stopColor="#3ec6e8" stopOpacity="0.42" />
          <stop offset="1" stopColor="#3ec6e8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}-sky)`} />
      <rect width="1600" height="900" fill={`url(#${id}-glow)`} />
      <rect x="0" y="760" width="720" height="140" fill="#0c2430" />
      <rect x="0" y="754" width="720" height="8" fill="#3ec6e8" opacity="0.85" />
      <rect x="620" y="560" width="360" height="36" fill="#123440" />
      <rect x="620" y="554" width="360" height="8" fill="#8ff3ff" opacity="0.8" />
      <rect x="980" y="390" width="280" height="32" fill="#123440" />
      <rect x="980" y="384" width="280" height="8" fill="#3ec6e8" opacity="0.75" />
      <rect x="1280" y="640" width="320" height="40" fill="#123440" />
      <polygon points="860,554 910,430 960,554" fill="#d96b6b" />
      <rect x="1480" y="240" width="36" height="420" fill={`url(#${id}-beam)`} />
      <path d="M640 760 C 700 620, 760 500, 860 430" fill="none" stroke="#8ff3ff" strokeWidth="3" strokeDasharray="8 14" opacity="0.7" />
      <g transform="translate(780 430) scale(2.1)">
        <ellipse cx="16" cy="58" rx="22" ry="7" fill="#000" opacity="0.4" />
        <path d="M10 6 L 30 6 L 36 34 L 28 58 L 8 58 L 2 34 Z" fill="#3ec6e8" />
        <rect x="14" y="12" width="12" height="10" fill="#071018" />
        <path d="M2 24 L -18 6" stroke="#8ff3ff" strokeWidth="4" strokeLinecap="round" />
        <path d="M36 24 L 58 2" stroke="#8ff3ff" strokeWidth="4" strokeLinecap="round" />
        <path d="M8 58 L 0 74" stroke="#3ec6e8" strokeWidth="3" />
        <path d="M28 58 L 40 76" stroke="#3ec6e8" strokeWidth="3" />
      </g>
      {!tight ? (
        <g opacity="0.5">
          <rect x="240" y="200" width="18" height="280" fill="#8ff3ff" opacity="0.12" />
          <rect x="400" y="120" width="12" height="220" fill="#3ec6e8" opacity="0.16" />
        </g>
      ) : null}
    </svg>
  );
}

function SwarmArt({ className, id, variant }: { className?: string; id: string; variant: string }) {
  const tight = variant === "tile";
  return (
    <svg viewBox={box(variant, "swarm")} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <radialGradient id={`${id}-core`} cx="56%" cy="48%" r="58%">
          <stop offset="0" stopColor="#f07a3a" stopOpacity="0.5" />
          <stop offset="0.55" stopColor="#f07a3a" stopOpacity="0.12" />
          <stop offset="1" stopColor="#f07a3a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="#120c0a" />
      <rect width="1600" height="900" fill={`url(#${id}-core)`} />
      <ellipse cx="980" cy="160" rx="210" ry="70" fill="#2a1410" />
      <path d="M820 150 Q 980 40 1140 150 L 1100 210 Q 980 120 860 210 Z" fill="#ffc18a" opacity="0.85" />
      <circle cx="940" cy="130" r="10" fill="#120c0a" />
      <circle cx="1020" cy="130" r="10" fill="#120c0a" />
      <g transform="translate(880 390) scale(1.35)">
        <circle cx="80" cy="40" r="22" fill="#f07a3a" />
        <circle cx="80" cy="40" r="8" fill="#120c0a" />
        <path d="M80 18 L 74 4 M80 18 L 86 4" stroke="#ffc18a" strokeWidth="3" />
      </g>
      <path d="M520 620 L 560 540 L 610 640 Z" fill="#c45c3a" />
      <path d="M1240 280 L 1300 220 L 1330 310 Z" fill="#e8b089" />
      <rect x="1380" y="480" width="36" height="36" transform="rotate(28 1398 498)" fill="#d98a4a" />
      <circle cx="640" cy="300" r="16" fill="#ffc58a" />
      <circle cx="1180" cy="640" r="14" fill="#ffc58a" />
      <path d="M700 480 Q 760 420 820 470" fill="none" stroke="#ffc18a" strokeWidth="3" opacity="0.7" />
      <path d="M1080 360 Q 1160 300 1240 350" fill="none" stroke="#f07a3a" strokeWidth="2.4" opacity="0.7" />
      <path d="M1080 520 Q 1180 560 1280 500" fill="none" stroke="#ffc18a" strokeWidth="2" opacity="0.5" />
      {!tight ? (
        <g opacity="0.35">
          <circle cx="430" cy="200" r="8" fill="#e07a48" />
          <circle cx="1500" cy="260" r="11" fill="#ffb07a" />
          <circle cx="1460" cy="700" r="9" fill="#f0d27a" />
        </g>
      ) : null}
    </svg>
  );
}
