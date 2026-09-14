"use client";

import type { GameManifest } from "@gamesweb/game-sdk";
import { analytics } from "@gamesweb/analytics";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/player";

export function Search({ games, onClose }: { games: GameManifest[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const store = useStore();
  const router = useRouter();
  const results = useMemo(() => store.search(q), [q, store]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/55 p-4 backdrop-blur-sm" onClick={onClose} role="presentation">
      <div
        className="mx-auto mt-[12vh] max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[var(--shadow)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Search"
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            if (e.target.value) analytics.track("search_used", { q: e.target.value });
          }}
          placeholder="Search games, genres, tags"
          className="h-12 w-full bg-transparent px-3 text-[16px] outline-none"
        />
        <ul className="mt-1">
          {(q ? results : games).map((g) => (
            <li key={g.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-white/5"
                onClick={() => {
                  onClose();
                  router.push(`/play/${g.slug}`);
                }}
              >
                <span>
                  <span className="block">{g.title}</span>
                  <span className="text-[12px] text-[var(--text-dim)]">{g.genre}</span>
                </span>
                <span className="text-[12px] text-[var(--text-faint)]">Play</span>
              </button>
            </li>
          ))}
          {q && results.length === 0 ? (
            <li className="px-3 py-6 text-[13px] text-[var(--text-dim)]">No titles match yet.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
