export function GameArt({ slug, className = "" }: { slug: string; className?: string }) {
  if (slug === "neon-drift") return <NeonArt className={className} />;
  if (slug === "velocity-run") return <VelocityArt className={className} />;
  return <SwarmArt className={className} />;
}

function NeonArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id="nd-sky" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#241018" />
          <stop offset="0.45" stopColor="#140c10" />
          <stop offset="1" stopColor="#0b0a0c" />
        </linearGradient>
        <radialGradient id="nd-glow" cx="72%" cy="28%" r="45%">
          <stop offset="0" stopColor="#e35aa0" stopOpacity="0.42" />
          <stop offset="1" stopColor="#e35aa0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#nd-sky)" />
      <rect width="1600" height="900" fill="url(#nd-glow)" />
      <path d="M-80 720 C 180 480, 360 820, 640 600 S 1080 360, 1680 540 L 1680 900 L -80 900 Z" fill="#161218" />
      <path d="M-80 700 C 200 470, 380 800, 660 590 S 1100 350, 1680 520" fill="none" stroke="#e35aa0" strokeWidth="4" opacity="0.7" />
      <path d="M-80 730 C 220 510, 400 830, 680 620 S 1120 390, 1680 560" fill="none" stroke="#f3f1ec" strokeWidth="1.2" opacity="0.18" />
      <g transform="translate(1040 530) rotate(-18)">
        <ellipse cx="6" cy="18" rx="34" ry="10" fill="#000" opacity="0.35" />
        <rect x="-40" y="-16" width="78" height="30" rx="8" fill="#1a1418" />
        <rect x="-36" y="-13" width="70" height="24" rx="6" fill="#f3f1ec" />
        <rect x="-2" y="-10" width="28" height="18" rx="4" fill="#241820" />
        <rect x="28" y="-9" width="8" height="8" rx="1" fill="#f6e7a8" />
        <rect x="28" y="2" width="8" height="8" rx="1" fill="#f6e7a8" />
        <rect x="-38" y="-8" width="6" height="6" fill="#e35aa0" />
        <rect x="-38" y="4" width="6" height="6" fill="#e35aa0" />
        <rect x="-18" y="-18" width="14" height="6" rx="1" fill="#111" />
        <rect x="-18" y="12" width="14" height="6" rx="2" fill="#111" />
        <rect x="10" y="-18" width="14" height="6" rx="2" fill="#111" />
        <rect x="10" y="12" width="14" height="6" rx="2" fill="#111" />
      </g>
      <circle cx="180" cy="120" r="2.2" fill="#f3f1ec" opacity="0.7" />
      <circle cx="320" cy="80" r="1.4" fill="#f3f1ec" opacity="0.45" />
      <circle cx="1280" cy="70" r="2" fill="#f3f1ec" opacity="0.55" />
      <circle cx="1460" cy="160" r="1.2" fill="#f3f1ec" opacity="0.4" />
    </svg>
  );
}

function VelocityArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id="vr-sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0b2430" />
          <stop offset="1" stopColor="#071018" />
        </linearGradient>
        <radialGradient id="vr-glow" cx="30%" cy="18%" r="50%">
          <stop offset="0" stopColor="#3ec6e8" stopOpacity="0.32" />
          <stop offset="1" stopColor="#3ec6e8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#vr-sky)" />
      <rect width="1600" height="900" fill="url(#vr-glow)" />
      <rect x="0" y="760" width="520" height="140" fill="#12303c" />
      <rect x="0" y="760" width="520" height="4" fill="#3ec6e8" opacity="0.5" />
      <rect x="620" y="620" width="280" height="32" fill="#1b3a48" />
      <rect x="620" y="620" width="280" height="4" fill="#3ec6e8" opacity="0.55" />
      <rect x="980" y="500" width="240" height="32" fill="#1b3a48" />
      <rect x="1280" y="680" width="320" height="40" fill="#1b3a48" />
      <rect x="1410" y="600" width="24" height="80" fill="#8ff3ff" />
      <polygon points="640,620 680,560 720,620" fill="#d96b6b" />
      <g transform="translate(708 576)">
        <rect x="0" y="8" width="22" height="36" rx="5" fill="#3ec6e8" />
        <rect x="4" y="14" width="6" height="7" fill="#071018" />
      </g>
      <rect x="980" y="430" width="8" height="70" fill="#3ec6e8" opacity="0.35" />
      <rect x="1180" y="360" width="8" height="140" fill="#8ff3ff" opacity="0.2" />
    </svg>
  );
}

function SwarmArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <radialGradient id="sp-glow" cx="68%" cy="48%" r="50%">
          <stop offset="0" stopColor="#f07a3a" stopOpacity="0.38" />
          <stop offset="1" stopColor="#f07a3a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="#140e0c" />
      <rect width="1600" height="900" fill="url(#sp-glow)" />
      <circle cx="980" cy="430" r="280" fill="none" stroke="#f07a3a" strokeOpacity="0.28" strokeWidth="2" />
      <circle cx="980" cy="430" r="160" fill="none" stroke="#f07a3a" strokeOpacity="0.12" />
      <circle cx="980" cy="430" r="16" fill="#f07a3a" />
      <circle cx="980" cy="430" r="6" fill="#140e0c" />
      <circle cx="1220" cy="300" r="22" fill="#e8b089" />
      <polygon points="1108,548 1142,612 1076,612" fill="#f0d27a" />
      <circle cx="760" cy="560" r="32" fill="#c45c3a" />
      <rect x="748" y="548" width="24" height="18" rx="3" fill="#140e0c" opacity="0.35" />
      <circle cx="1340" cy="520" r="12" fill="#d98a4a" />
      <circle cx="980" cy="180" r="46" fill="#ffc18a" opacity="0.9" />
      <circle cx="980" cy="180" r="18" fill="#140e0c" />
      <circle cx="680" cy="320" r="9" fill="#ffc58a" />
      <circle cx="860" cy="240" r="7" fill="#ffc58a" />
      <circle cx="1180" cy="640" r="8" fill="#ffc58a" />
    </svg>
  );
}
