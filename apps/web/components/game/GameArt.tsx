export function GameArt({ slug, className = "" }: { slug: string; className?: string }) {
  if (slug === "neon-drift") return <NeonArt className={className} />;
  if (slug === "velocity-run") return <VelocityArt className={className} />;
  return <SwarmArt className={className} />;
}

function NeonArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1600 900" className={className} aria-hidden>
      <defs>
        <linearGradient id="nd-sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a0f16" />
          <stop offset="1" stopColor="#0b0a0c" />
        </linearGradient>
        <linearGradient id="nd-road" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a2428" />
          <stop offset="1" stopColor="#171417" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#nd-sky)" />
      <ellipse cx="1180" cy="220" rx="420" ry="180" fill="#e35aa0" opacity="0.18" />
      <path d="M-40 640 C 240 520, 420 780, 720 640 S 1180 420, 1640 560 L 1640 900 L -40 900 Z" fill="url(#nd-road)" />
      <path d="M-20 670 C 260 560, 430 800, 740 660 S 1200 450, 1620 580" fill="none" stroke="#e35aa0" strokeWidth="3" opacity="0.55" />
      <g transform="translate(980 560) rotate(-18)">
        <rect x="-42" y="-18" width="84" height="36" rx="8" fill="#1c1a1d" />
        <rect x="10" y="-14" width="28" height="28" rx="6" fill="#e35aa0" />
      </g>
      <circle cx="240" cy="180" r="2" fill="#f3f1ec" opacity="0.7" />
      <circle cx="400" cy="120" r="1.5" fill="#f3f1ec" opacity="0.5" />
      <circle cx="1320" cy="90" r="2" fill="#f3f1ec" opacity="0.6" />
    </svg>
  );
}

function VelocityArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1600 900" className={className} aria-hidden>
      <rect width="1600" height="900" fill="#071018" />
      <ellipse cx="420" cy="160" rx="380" ry="160" fill="#3ec6e8" opacity="0.14" />
      <rect x="120" y="640" width="420" height="36" fill="#1b3a48" />
      <rect x="620" y="520" width="260" height="28" fill="#1b3a48" />
      <rect x="980" y="430" width="220" height="28" fill="#1b3a48" />
      <rect x="1280" y="620" width="260" height="36" fill="#1b3a48" />
      <rect x="620" y="500" width="40" height="20" fill="#d96b6b" />
      <rect x="1410" y="540" width="22" height="80" fill="#8ff3ff" />
      <rect x="708" y="478" width="18" height="32" rx="4" fill="#3ec6e8" />
      <path d="M120 200 H 1480" stroke="#3ec6e8" strokeOpacity="0.08" />
    </svg>
  );
}

function SwarmArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1600 900" className={className} aria-hidden>
      <rect width="1600" height="900" fill="#140e0c" />
      <ellipse cx="1100" cy="420" rx="460" ry="260" fill="#f07a3a" opacity="0.14" />
      <circle cx="800" cy="460" r="240" fill="none" stroke="#f07a3a" strokeOpacity="0.25" />
      <circle cx="800" cy="460" r="14" fill="#f07a3a" />
      <circle cx="1040" cy="340" r="18" fill="#e8b089" />
      <circle cx="620" cy="560" r="26" fill="#c45c3a" />
      <polygon points="920,560 940,600 900,600" fill="#f0d27a" />
      <circle cx="1180" cy="520" r="10" fill="#d98a4a" />
      <circle cx="540" cy="360" r="8" fill="#ffc58a" />
    </svg>
  );
}
