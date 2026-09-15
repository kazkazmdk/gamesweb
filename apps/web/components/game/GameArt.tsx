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

function NeonArt({ className, id, variant }: { className?: string; id: string; variant: string }) {
  const tight = variant === "tile";
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#2a101c" />
          <stop offset="0.4" stopColor="#140c12" />
          <stop offset="1" stopColor="#070608" />
        </linearGradient>
        <radialGradient id={`${id}-moon`} cx="78%" cy="18%" r="38%">
          <stop offset="0" stopColor="#e35aa0" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#e35aa0" stopOpacity="0.16" />
          <stop offset="1" stopColor="#e35aa0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-road`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1a1218" />
          <stop offset="0.5" stopColor="#241820" />
          <stop offset="1" stopColor="#120e12" />
        </linearGradient>
        <filter id={`${id}-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={tight ? 2 : 6} />
        </filter>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}-sky)`} />
      <rect width="1600" height="900" fill={`url(#${id}-moon)`} />
      <circle cx="1280" cy="140" r="18" fill="#f6e7c8" opacity="0.7" />
      <g opacity="0.45">
        {Array.from({ length: 28 }).map((_, i) => (
          <circle key={i} cx={(i * 197) % 1600} cy={40 + ((i * 73) % 220)} r={i % 4 === 0 ? 1.8 : 1} fill="#f3f1ec" />
        ))}
      </g>
      <path d="M-40 820 L 220 470 L 390 470 L 180 820 Z" fill="#1a1016" />
      <path d="M1180 820 L 1420 390 L 1600 390 L 1600 820 Z" fill="#161018" />
      <rect x="1288" y="210" width="8" height="180" fill="#e35aa0" opacity="0.35" />
      <rect x="1336" y="250" width="6" height="140" fill="#f6e7a8" opacity="0.25" />
      <path d="M-80 760 C 240 520, 420 840, 720 590 S 1180 330, 1720 560 L 1720 900 L -80 900 Z" fill={`url(#${id}-road)`} />
      <path d="M-80 742 C 250 510, 430 820, 740 575 S 1200 318, 1720 542" fill="none" stroke="#e35aa0" strokeWidth="5" opacity="0.85" />
      <path d="M-80 768 C 260 545, 450 850, 760 605 S 1220 360, 1720 575" fill="none" stroke="#f3f1ec" strokeWidth="1.4" opacity="0.22" strokeDasharray="18 16" />
      <g filter={`url(#${id}-blur)`} opacity="0.45">
        <ellipse cx="980" cy="610" rx="90" ry="18" fill="#f3f1ec" />
        <ellipse cx="1040" cy="628" rx="70" ry="12" fill="#e35aa0" />
      </g>
      <g transform="translate(1020 560) rotate(-16)">
        <ellipse cx="8" cy="28" rx="48" ry="12" fill="#000" opacity="0.4" />
        <path d="M-56 -6 C -48 -22, -20 -28, 8 -24 L 62 -10 C 78 -6, 86 8, 78 18 L 54 28 L -44 22 C -62 18, -66 6, -56 -6 Z" fill="#1c1418" />
        <path d="M-48 -4 C -40 -16, -16 -20, 8 -16 L 54 -4 C 66 0, 70 10, 62 16 L 48 22 L -36 16 C -50 12, -54 4, -48 -4 Z" fill="#f3f1ec" />
        <path d="M8 -16 L 40 -6 L 36 10 L 4 2 Z" fill="#241820" />
        <rect x="58" y="-2" width="10" height="8" rx="1" fill="#f6e7a8" />
        <rect x="58" y="10" width="10" height="8" rx="1" fill="#f6e7a8" />
        <rect x="-52" y="0" width="8" height="7" fill="#e35aa0" />
        <rect x="-52" y="12" width="8" height="7" fill="#e35aa0" />
        <rect x="-18" y="-22" width="16" height="7" rx="2" fill="#0c0a0c" />
        <rect x="18" y="-16" width="16" height="7" rx="2" fill="#0c0a0c" />
        <rect x="-18" y="18" width="16" height="8" rx="3" fill="#0c0a0c" />
        <rect x="20" y="20" width="16" height="8" rx="3" fill="#0c0a0c" />
        <path d="M-30 8 L 48 16" stroke="#e35aa0" strokeWidth="2" opacity="0.55" />
      </g>
      {!tight ? (
        <g opacity="0.35">
          <path d="M860 600 C 900 580, 940 600, 980 586" fill="none" stroke="#f3f1ec" strokeWidth="3" />
          <path d="M870 618 C 920 598, 970 622, 1020 604" fill="none" stroke="#e35aa0" strokeWidth="2" />
        </g>
      ) : null}
    </svg>
  );
}

function VelocityArt({ className, id, variant }: { className?: string; id: string; variant: string }) {
  const tight = variant === "tile";
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#082028" />
          <stop offset="1" stopColor="#050c12" />
        </linearGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ff3ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#3ec6e8" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="28%" cy="16%" r="48%">
          <stop offset="0" stopColor="#3ec6e8" stopOpacity="0.38" />
          <stop offset="1" stopColor="#3ec6e8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}-sky)`} />
      <rect width="1600" height="900" fill={`url(#${id}-glow)`} />
      <g opacity="0.2">
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} x={80 + i * 150} y="0" width="1" height="900" fill="#8ff3ff" />
        ))}
      </g>
      <rect x="0" y="780" width="640" height="120" fill="#0e2a34" />
      <rect x="0" y="776" width="640" height="5" fill="#3ec6e8" opacity="0.7" />
      <rect x="520" y="640" width="310" height="28" fill="#143844" />
      <rect x="520" y="636" width="310" height="5" fill="#8ff3ff" opacity="0.7" />
      <rect x="900" y="500" width="260" height="26" fill="#143844" />
      <rect x="900" y="496" width="260" height="5" fill="#3ec6e8" opacity="0.65" />
      <rect x="1220" y="680" width="380" height="36" fill="#143844" />
      <rect x="1488" y="420" width="28" height="260" fill={`url(#${id}-beam)`} />
      <polygon points="560,636 604,548 648,636" fill="#d96b6b" />
      <rect x="980" y="360" width="10" height="140" fill="#3ec6e8" opacity="0.28" />
      <rect x="1188" y="280" width="10" height="220" fill="#8ff3ff" opacity="0.18" />
      <g transform="translate(628 568)">
        <ellipse cx="14" cy="46" rx="16" ry="5" fill="#000" opacity="0.35" />
        <path d="M8 8 L 22 8 L 26 28 L 20 46 L 8 46 L 4 28 Z" fill="#3ec6e8" />
        <rect x="10" y="12" width="8" height="8" fill="#071018" />
        <path d="M4 20 L -10 8" stroke="#8ff3ff" strokeWidth="3" />
        <path d="M26 20 L 44 4" stroke="#8ff3ff" strokeWidth="3" />
      </g>
      {!tight ? (
        <g opacity="0.55">
          <path d="M648 590 L 860 430" stroke="#8ff3ff" strokeWidth="2" strokeDasharray="6 10" />
          <circle cx="860" cy="430" r="4" fill="#8ff3ff" />
        </g>
      ) : null}
    </svg>
  );
}

function SwarmArt({ className, id, variant }: { className?: string; id: string; variant: string }) {
  const tight = variant === "tile";
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <radialGradient id={`${id}-core`} cx="62%" cy="48%" r="55%">
          <stop offset="0" stopColor="#f07a3a" stopOpacity="0.42" />
          <stop offset="0.55" stopColor="#f07a3a" stopOpacity="0.1" />
          <stop offset="1" stopColor="#f07a3a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="#120c0a" />
      <rect width="1600" height="900" fill={`url(#${id}-core)`} />
      <circle cx="980" cy="430" r="320" fill="none" stroke="#f07a3a" strokeOpacity="0.18" strokeWidth="2" />
      <circle cx="980" cy="430" r="210" fill="none" stroke="#f07a3a" strokeOpacity="0.12" />
      <circle cx="980" cy="430" r="18" fill="#f07a3a" />
      <circle cx="980" cy="430" r="7" fill="#120c0a" />
      {[
        [760, 560, 34, "#c45c3a"],
        [1220, 300, 24, "#e8b089"],
        [1340, 520, 14, "#d98a4a"],
        [680, 320, 11, "#ffc58a"],
        [860, 240, 9, "#ffc58a"],
        [1180, 640, 10, "#ffc58a"],
        [1088, 580, 16, "#f0d27a"],
        [540, 480, 13, "#e07a48"],
        [1460, 380, 18, "#ffb07a"],
      ].map(([x, y, r, c], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={String(c)} />
      ))}
      <polygon points="1108,548 1148,628 1070,628" fill="#f0d27a" />
      <circle cx="980" cy="168" r="52" fill="#ffc18a" />
      <circle cx="980" cy="168" r="20" fill="#120c0a" />
      <circle cx="964" cy="156" r="4" fill="#f07a3a" />
      <circle cx="996" cy="156" r="4" fill="#f07a3a" />
      {!tight ? (
        <g opacity="0.7">
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const x2 = 980 + Math.cos(a) * 180;
            const y2 = 430 + Math.sin(a) * 140;
            return <line key={i} x1="980" y1="430" x2={x2} y2={y2} stroke="#ffc18a" strokeWidth="1.2" opacity="0.35" />;
          })}
        </g>
      ) : null}
    </svg>
  );
}
