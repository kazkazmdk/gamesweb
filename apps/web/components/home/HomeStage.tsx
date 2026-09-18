"use client";

import { useEffect, useState } from "react";
import { GameArt } from "@/components/game/GameArt";
import { homeStage, type HomeStageDir } from "./home-stage";

export function HomeStage({
  slug,
  reduced,
  step = 1,
}: {
  slug: string;
  reduced: boolean;
  step?: number;
}) {
  const dir = homeStage(slug);
  const [prev, setPrev] = useState(slug);
  const [incoming, setIncoming] = useState(slug);

  useEffect(() => {
    if (slug === incoming) return;
    setPrev(incoming);
    setIncoming(slug);
  }, [slug, incoming]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden data-stage-family={dir.family}>
      {dir.bloom > 0 ? (
        <div className="absolute -inset-[16%] hidden md:block" style={{ opacity: 0.42 }}>
          <GameArt
            slug={incoming}
            variant="backdrop"
            className="home-art home-art-bloom h-full w-full"
            style={{
              objectPosition: undefined,
              filter: `blur(28px) saturate(${dir.bloom})`,
              ["--home-crop-desktop" as string]: dir.crop.desktop,
              ["--home-crop-laptop" as string]: dir.crop.laptop,
              ["--home-crop-mobile" as string]: dir.crop.mobile,
            }}
          />
        </div>
      ) : null}
      <Layer slug={prev} reduced={reduced} active={prev === incoming} step={step} />
      {prev !== incoming ? <Layer slug={incoming} reduced={reduced} active step={step} /> : null}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(${dir.glowSize} at ${dir.glowX} ${dir.glowY}, color-mix(in srgb, ${dir.glow} 28%, transparent), transparent 72%)`,
        }}
      />
      <FamilyWash dir={dir} />
      <div className="absolute inset-0" style={{ background: dir.wash }} />
      <div className="absolute inset-0" style={{ background: dir.leftWash }} />
      <div className="absolute inset-0" style={{ background: dir.bottomWash }} />
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/28 to-transparent" />
      <div
        className="absolute inset-0"
        style={{ boxShadow: `inset 0 0 ${dir.family === "arena" ? "22rem" : "14rem"} rgba(0,0,0,${dir.vignette})` }}
      />
    </div>
  );
}

function FamilyWash({ dir }: { dir: HomeStageDir }) {
  if (dir.family === "speed") {
    return (
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(108deg, transparent 18%, color-mix(in srgb, ${dir.glow} 12%, transparent) 46%, transparent 76%)`,
        }}
      />
    );
  }
  if (dir.family === "vertical") {
    return <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-transparent" />;
  }
  if (dir.family === "graphic") {
    return <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-black/08" />;
  }
  if (dir.family === "runner") {
    return <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/22" />;
  }
  return null;
}

function Layer({
  slug,
  reduced,
  active,
  step,
}: {
  slug: string;
  reduced: boolean;
  active: boolean;
  step: number;
}) {
  const dir = homeStage(slug);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!active) {
      setOn(false);
      return;
    }
    const id = window.requestAnimationFrame(() => setOn(true));
    return () => window.cancelAnimationFrame(id);
  }, [active, slug]);

  const live = active && on;
  const shift = dir.travel * step * 1.5;

  return (
    <div
      className={`absolute inset-0 ${reduced ? "" : "transition-[opacity,transform] duration-[300ms] ease-[var(--ease-out)]"}`}
      style={{
        opacity: live ? 1 : 0,
        transform: live
          ? "translate3d(0,0,0) scale(1)"
          : active
            ? `translate3d(${shift}%, 0, 0) scale(1.012)`
            : `translate3d(${-shift}%, 0, 0) scale(1.02)`,
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
          ["--home-lift" as string]: dir.lift,
        }}
      />
    </div>
  );
}
