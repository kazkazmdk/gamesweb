"use client";

import { useEffect, useState } from "react";
import { GameArt } from "@/components/game/GameArt";
import { homeStage } from "./home-stage";

export function HomeStage({ slug, reduced }: { slug: string; reduced: boolean }) {
  const dir = homeStage(slug);
  const [prev, setPrev] = useState(slug);
  const [incoming, setIncoming] = useState(slug);

  useEffect(() => {
    if (slug === incoming) return;
    setPrev(incoming);
    setIncoming(slug);
  }, [slug, incoming]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <Layer slug={prev} reduced={reduced} active={prev === incoming} />
      {prev !== incoming ? <Layer slug={incoming} reduced={reduced} active /> : null}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(58% 48% at ${dir.glowX} ${dir.glowY}, color-mix(in srgb, ${dir.glow} 28%, transparent), transparent 68%)`,
        }}
      />
      <div className="absolute inset-0" style={{ background: dir.wash }} />
      <div className="absolute inset-y-0 left-0 w-[min(64%,46rem)] bg-gradient-to-r from-black/72 via-black/28 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/80 via-black/28 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />
    </div>
  );
}

function Layer({ slug, reduced, active }: { slug: string; reduced: boolean; active: boolean }) {
  const dir = homeStage(slug);
  return (
    <div
      className={`absolute inset-0 ${reduced ? "" : "transition-[opacity,transform] duration-[380ms] ease-[var(--ease-out)]"}`}
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "scale(1)" : "scale(1.035)",
      }}
    >
      <GameArt
        slug={slug}
        variant="backdrop"
        priority={active}
        className="h-full w-full max-md:min-h-[120%] max-md:object-[var(--home-crop-mobile)]"
        position={dir.crop.desktop}
        style={{
          objectPosition: dir.crop.desktop,
          transform: `scale(${dir.scale})`,
          filter: dir.contrast,
          ["--home-crop-mobile" as string]: dir.crop.mobile,
        }}
      />
    </div>
  );
}
