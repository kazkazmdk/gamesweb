const SCENES: Record<string, { glow: string; fog: string; motif: string }> = {
  "neon-drift": {
    glow: "radial-gradient(ellipse 70% 42% at 68% 36%, rgba(227,90,160,.22), transparent 62%)",
    fog: "linear-gradient(180deg, transparent 20%, rgba(12,8,14,.18) 70%, rgba(8,6,10,.42) 100%)",
    motif: "drift",
  },
  "velocity-run": {
    glow: "radial-gradient(ellipse 58% 40% at 48% 28%, rgba(62,198,232,.18), transparent 64%)",
    fog: "linear-gradient(90deg, rgba(4,12,20,.28), transparent 40%, rgba(4,12,20,.2) 100%)",
    motif: "shaft",
  },
  "swarm-protocol": {
    glow: "radial-gradient(ellipse 62% 48% at 58% 46%, rgba(240,122,58,.2), transparent 66%)",
    fog: "radial-gradient(ellipse 80% 70% at 56% 48%, transparent 20%, rgba(10,6,4,.35) 100%)",
    motif: "arena",
  },
  "sky-stack": {
    glow: "radial-gradient(ellipse 50% 36% at 50% 18%, rgba(255,210,150,.16), transparent 70%)",
    fog: "linear-gradient(180deg, rgba(80,140,190,.12), transparent 42%)",
    motif: "sky",
  },
  "knockout-circuit": {
    glow: "radial-gradient(ellipse 46% 30% at 78% 22%, rgba(255,176,70,.16), transparent 60%)",
    fog: "linear-gradient(180deg, transparent 40%, rgba(16,10,4,.38) 100%)",
    motif: "factory",
  },
  "pocket-striker": {
    glow: "radial-gradient(ellipse 54% 40% at 32% 62%, rgba(196,180,130,.14), transparent 68%)",
    fog: "radial-gradient(ellipse 70% 60% at 50% 80%, rgba(10,16,12,.3), transparent 70%)",
    motif: "table",
  },
  "territory-rush": {
    glow: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,77,109,.12), transparent 70%)",
    fog: "linear-gradient(180deg, rgba(10,8,14,.2), transparent 40%, rgba(10,8,14,.35) 100%)",
    motif: "grid",
  },
  "crowd-control": {
    glow: "radial-gradient(ellipse 64% 36% at 32% 70%, rgba(255,122,89,.16), transparent 68%)",
    fog: "linear-gradient(180deg, transparent 30%, rgba(18,8,6,.4) 100%)",
    motif: "crowd",
  },
};

export function SceneEnrichment({ slug }: { slug: string }) {
  const scene = SCENES[slug] ?? SCENES["neon-drift"];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute inset-0" style={{ background: scene.glow }} />
      <div className="absolute inset-0" style={{ background: scene.fog }} />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        {scene.motif === "drift" ? (
          <>
            <path d="M-40 820 C 220 640, 420 860, 720 700 S 1200 480, 1680 620" fill="none" stroke="rgba(243,241,236,.08)" strokeWidth="18" />
            <path d="M-40 820 C 220 640, 420 860, 720 700 S 1200 480, 1680 620" fill="none" stroke="rgba(227,90,160,.22)" strokeWidth="3" />
            <rect x="1180" y="210" width="18" height="220" fill="rgba(227,90,160,.12)" />
            <rect x="1280" y="160" width="14" height="280" fill="rgba(255,255,255,.04)" />
            <polygon points="80,900 260,640 420,900" fill="rgba(0,0,0,.28)" />
          </>
        ) : null}
        {scene.motif === "shaft" ? (
          <>
            <rect x="180" y="0" width="28" height="900" fill="rgba(143,243,255,.06)" />
            <rect x="1380" y="0" width="22" height="900" fill="rgba(143,243,255,.05)" />
            <rect x="420" y="80" width="760" height="16" fill="rgba(20,40,52,.45)" />
            <rect x="520" y="200" width="560" height="10" fill="rgba(62,198,232,.12)" />
            <polygon points="0,900 220,620 380,900" fill="rgba(0,0,0,.3)" />
            <polygon points="1600,900 1380,580 1220,900" fill="rgba(0,0,0,.26)" />
          </>
        ) : null}
        {scene.motif === "arena" ? (
          <>
            <ellipse cx="980" cy="430" rx="340" ry="220" fill="none" stroke="rgba(240,122,58,.16)" strokeWidth="2" />
            <ellipse cx="980" cy="430" rx="210" ry="130" fill="none" stroke="rgba(255,193,138,.1)" strokeWidth="1.5" />
            <rect x="220" y="120" width="70" height="260" fill="rgba(42,22,16,.55)" />
            <rect x="1320" y="80" width="90" height="320" fill="rgba(36,18,14,.5)" />
            <rect x="240" y="150" width="18" height="18" fill="rgba(240,122,58,.28)" />
            <polygon points="0,900 180,700 340,900" fill="rgba(0,0,0,.32)" />
            <polygon points="1600,900 1420,680 1260,900" fill="rgba(0,0,0,.3)" />
          </>
        ) : null}
        {scene.motif === "sky" ? (
          <>
            <circle cx="260" cy="140" r="70" fill="rgba(255,210,150,.1)" />
            <rect x="1180" y="420" width="70" height="280" fill="rgba(255,255,255,.05)" />
            <rect x="1270" y="360" width="54" height="340" fill="rgba(255,255,255,.04)" />
            <rect x="1340" y="300" width="40" height="400" fill="rgba(255,255,255,.03)" />
          </>
        ) : null}
        {scene.motif === "factory" ? (
          <>
            <rect x="80" y="200" width="36" height="700" fill="rgba(42,34,24,.55)" />
            <rect x="140" y="280" width="22" height="620" fill="rgba(42,34,24,.4)" />
            <rect x="200" y="120" width="240" height="14" fill="rgba(255,176,70,.16)" />
            <rect x="1280" y="80" width="28" height="820" fill="rgba(255,224,138,.08)" />
            <path d="M80 260 C 180 240, 240 300, 320 280" fill="none" stroke="rgba(196,138,32,.28)" strokeWidth="10" />
            <polygon points="0,900 200,640 360,900" fill="rgba(0,0,0,.34)" />
          </>
        ) : null}
        {scene.motif === "table" ? (
          <>
            <rect x="180" y="220" width="1240" height="520" fill="none" stroke="rgba(196,180,130,.12)" strokeWidth="18" />
            <rect x="220" y="260" width="1160" height="440" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="4" />
            <circle cx="240" cy="280" r="18" fill="rgba(0,0,0,.35)" />
            <circle cx="1360" cy="280" r="18" fill="rgba(0,0,0,.35)" />
            <circle cx="240" cy="680" r="18" fill="rgba(0,0,0,.35)" />
            <circle cx="1360" cy="680" r="18" fill="rgba(0,0,0,.35)" />
          </>
        ) : null}
        {scene.motif === "grid" ? (
          <>
            <rect x="280" y="160" width="1040" height="620" fill="none" stroke="rgba(255,77,109,.1)" strokeWidth="2" />
            <path d="M280 470 H1320 M780 160 V780" stroke="rgba(255,255,255,.04)" strokeWidth="1" />
            <rect x="780" y="470" width="220" height="160" fill="rgba(255,77,109,.08)" />
            <rect x="520" y="320" width="160" height="120" fill="rgba(77,171,255,.06)" />
          </>
        ) : null}
        {scene.motif === "crowd" ? (
          <>
            <ellipse cx="520" cy="760" rx="280" ry="70" fill="rgba(255,122,89,.1)" />
            <ellipse cx="520" cy="740" rx="200" ry="46" fill="rgba(255,106,66,.08)" />
            <rect x="220" y="80" width="40" height="820" fill="rgba(58,34,24,.35)" />
            <rect x="1340" y="80" width="40" height="820" fill="rgba(58,34,24,.35)" />
          </>
        ) : null}
      </svg>
    </div>
  );
}
