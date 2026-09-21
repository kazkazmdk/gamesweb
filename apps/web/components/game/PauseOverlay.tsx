"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { GameManifest } from "@gamesweb/game-sdk";

const ITEMS = ["resume", "restart", "controls", "settings", "exit"] as const;

export function PauseOverlay({
  game,
  onResume,
  onRestart,
}: {
  game: GameManifest;
  onResume: () => void;
  onRestart: () => void;
}) {
  const [sel, setSel] = useState(0);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setSel((n) => (n + 1) % ITEMS.length);
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setSel((n) => (n - 1 + ITEMS.length) % ITEMS.length);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = ITEMS[sel];
        if (item === "resume") onResume();
        else if (item === "restart") onRestart();
        else if (item === "controls") setHelp((v) => !v);
        else if (item === "settings") window.location.assign("/settings");
        else window.location.assign(`/games/${game.slug}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game.slug, onRestart, onResume, sel]);

  return (
    <div
      className="absolute inset-0 z-40 bg-black/45"
      onClick={(e) => {
        if (e.target === e.currentTarget) onResume();
      }}
    >
      <div className="absolute inset-y-0 left-0 flex w-[min(380px,92vw)] flex-col justify-center bg-black/35 px-5 py-8 md:px-8">
        <p className="meta text-white/45">{game.title}</p>
        <p className="display mt-2 text-[44px] text-white">Paused</p>
        <div className="mt-8 flex flex-col gap-2" role="group" aria-label="Pause">
          <button type="button" data-selected={sel === 0} className="gw-pause-item" onMouseEnter={() => setSel(0)} onClick={onResume}>
            Resume
          </button>
          <button type="button" data-selected={sel === 1} className="gw-pause-item" onMouseEnter={() => setSel(1)} onClick={onRestart}>
            Restart
          </button>
          <button type="button" data-selected={sel === 2} className="gw-pause-item" onMouseEnter={() => setSel(2)} onClick={() => setHelp((v) => !v)}>
            Controls
          </button>
          <Link href="/settings" data-selected={sel === 3} data-priority="low" className="gw-pause-item" onMouseEnter={() => setSel(3)}>
            Settings
          </Link>
          <Link href={`/games/${game.slug}`} data-selected={sel === 4} data-priority="low" className="gw-pause-item" onMouseEnter={() => setSel(4)}>
            Exit to hub
          </Link>
        </div>
        {help ? (
          <ul className="mt-5 space-y-1 text-[12px] text-white/60">
            {game.controls.map((c) => (
              <li key={c.input}>
                {c.input} — {c.action}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
