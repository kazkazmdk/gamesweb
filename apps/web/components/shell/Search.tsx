"use client";

import type { GameManifest } from "@gamesweb/game-sdk";
import { analytics } from "@gamesweb/analytics";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GameArt } from "@/components/game/GameArt";
import { Avatar } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { playerApi } from "@/lib/player-api";

export function Search({ games, onClose }: { games: GameManifest[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [players, setPlayers] = useState<Array<{ username: string; displayName: string; avatar: string }>>([]);
  const store = useStore();
  const player = usePlayer();
  const router = useRouter();
  const results = useMemo(() => store.search(q), [q, store]);
  const recent = store.continuePlaying().slice(0, 3);
  const list = q ? results : games;

  useEffect(() => {
    setActive(0);
  }, [q]);

  useEffect(() => {
    if (q.trim().length < 3) {
      setPlayers([]);
      return;
    }
    const t = window.setTimeout(() => {
      void playerApi.searchPlayers(q.trim()).then((res) => {
        if (res.ok) {
          setPlayers(res.data.rows.filter((p) => p.username.toLowerCase() !== player.username.toLowerCase()));
        }
      });
    }, 280);
    return () => window.clearTimeout(t);
  }, [q, player.username]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(list.length - 1, i + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      }
      if (e.key === "Enter") {
        const g = list[active];
        if (g) {
          e.preventDefault();
          onClose();
          router.push(`/play/${g.slug}`);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, list, active, router]);

  function open(g: GameManifest) {
    onClose();
    router.push(`/play/${g.slug}`);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/55 p-4 backdrop-blur-sm" onClick={onClose} role="presentation">
      <div
        className="mx-auto mt-[12vh] max-w-lg border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[var(--shadow)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
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
          aria-activedescendant={list[active] ? `search-${list[active].id}` : undefined}
        />
        {!q && recent.length ? (
          <div className="mt-1 px-3 py-2">
            <p className="meta">Recent</p>
            <ul className="mt-1">
              {recent.map((g) => (
                <li key={`recent-${g.id}`}>
                  <button type="button" className="flex w-full items-center gap-3 py-2 text-left" onClick={() => open(g)}>
                    <span className="h-8 w-12 overflow-hidden">
                      <GameArt slug={g.slug} variant="tile" className="h-full w-full object-cover" />
                    </span>
                    <span>{g.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <ul className="mt-1" role="listbox">
          {list.map((g, i) => (
            <li key={g.id} id={`search-${g.id}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={`flex w-full items-center justify-between px-3 py-3 text-left ${i === active ? "bg-white/5" : "hover:bg-white/5"}`}
                onClick={() => open(g)}
                onMouseEnter={() => setActive(i)}
              >
                <span className="flex items-center gap-3">
                  <span className="h-8 w-12 overflow-hidden">
                    <GameArt slug={g.slug} variant="tile" className="h-full w-full object-cover" />
                  </span>
                  <span>
                    <span className="block">{g.title}</span>
                    <span className="text-[12px] text-[var(--text-dim)]">{g.genre}</span>
                  </span>
                </span>
                <span className="text-[12px] text-[var(--text-faint)]">Play</span>
              </button>
            </li>
          ))}
          {q && results.length === 0 ? (
            <li className="px-3 py-6 text-[13px] text-[var(--text-dim)]">No titles match yet.</li>
          ) : null}
        </ul>
        {players.length ? (
          <div className="mt-2 border-t border-[var(--line)] px-3 py-2">
            <p className="meta">Players</p>
            <ul>
              {players.map((p) => (
                <li key={p.username}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 py-2 text-left"
                    onClick={() => {
                      onClose();
                      router.push(`/profile/${p.username}`);
                    }}
                  >
                    <Avatar id={p.avatar} size={28} />
                    <span>
                      <span className="block">{p.displayName}</span>
                      <span className="text-[12px] text-[var(--text-dim)]">@{p.username}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
