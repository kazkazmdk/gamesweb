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
      <div className="absolute -inset-[18%] hidden md:block" style={{ opacity: 0.55 }}>
        <GameArt
          slug={incoming}
          variant="backdrop"
          className="home-art home-art-bloom h-full w-full"
          style={{
            objectPosition: undefined,
            filter: `blur(36px) saturate(${dir.bloom})`,
            ["--home-crop-desktop" as string]: dir.crop.desktop,
            ["--home-crop-laptop" as string]: dir.crop.laptop,
            ["--home-crop-mobile" as string]: dir.crop.mobile,
          }}
        />
      </div>
      <Layer slug={prev} reduced={reduced} active={prev === incoming} />
      {prev !== incoming ? <Layer slug={incoming} reduced={reduced} active /> : null}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(${dir.glowSize} at ${dir.glowX} ${dir.glowY}, color-mix(in srgb, ${dir.glow} 34%, transparent), transparent 70%)`,
        }}
      />
      <div className="absolute inset-0" style={{ background: dir.wash }} />
      <div className="absolute inset-y-0 left-0 w-[min(58%,38rem)] bg-gradient-to-r from-black/58 via-black/18 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/88 via-black/36 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
    </div>
  );
}

function Layer({ slug, reduced, active }: { slug: string; reduced: boolean; active: boolean }) {
  const dir = homeStage(slug);
  return (
    <div
      className={`absolute inset-0 ${reduced ? "" : "transition-[opacity,transform] duration-[360ms] ease-[var(--ease-out)]"}`}
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "scale(1)" : "scale(1.04)",
      }}
    >
      <GameArt
        slug={slug}
        variant="backdrop"
        priority={active}
        className="home-art h-full w-full max-md:min-h-[118%]"
        style={{
          objectPosition: undefined,
          filter: dir.contrast,
          ["--home-crop-desktop" as string]: dir.crop.desktop,
          ["--home-crop-laptop" as string]: dir.crop.laptop,
          ["--home-crop-mobile" as string]: dir.crop.mobile,
          ["--home-scale" as string]: String(dir.scale.desktop),
          ["--home-scale-mobile" as string]: String(dir.scale.mobile),
        }}
      />
    </div>
  );
}
