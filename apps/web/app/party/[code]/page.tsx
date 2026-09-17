"use client";

import { getManifest, PARTY_REACTIONS } from "@gamesweb/game-sdk";
import { arcadeStore } from "@/lib/social/arcade-store";
import { usePlayer } from "@/lib/player";
import { SSR_PLAYER } from "@/lib/player-store";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type PartyState = ReturnType<typeof arcadeStore.createParty>;

export default function PartyPage() {
  const params = useParams<{ code: string }>();
  const player = usePlayer();
  const code = (params.code ?? "").toUpperCase();
  const [reaction, setReaction] = useState("");
  const [created, setCreated] = useState(code);
  // Parties live in localStorage, so resolve them after hydration only.
  const [party, setParty] = useState<PartyState | null | undefined>(undefined);

  useEffect(() => {
    if (player.id === SSR_PLAYER.id) return;
    const target = created || code;
    const joined = arcadeStore.joinParty(target, player.id, player.displayName || "Player");
    if (joined.ok) setParty(joined.party);
    else setParty(arcadeStore.view().parties.find((p) => p.code === target) ?? null);
  }, [code, created, player.displayName, player.id]);

  if (party === undefined) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <p className="meta text-white/45">Party {code}</p>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-md text-center">
          <h1 className="display text-4xl">Party not on this device</h1>
          <p className="mt-3 text-white/60">Parties are stored in this browser until Gamesweb Supabase is provisioned.</p>
          <button
            type="button"
            className="mt-6 rounded-full bg-[var(--accent)] px-5 py-3 text-[#140d12]"
            onClick={() => setCreated(arcadeStore.createParty(player.id, player.displayName || "Host").code)}
          >
            Create party
          </button>
        </div>
      </div>
    );
  }

  const round = party.playlist[Math.min(party.round, party.playlist.length - 1)];
  const game = round ? getManifest(round.gameId) : undefined;

  return (
    <div className="mx-auto max-w-2xl px-5 py-10" data-testid="party">
      <p className="meta text-white/45">Party {party.code}</p>
      <h1 className="display mt-2 text-4xl">Quick party</h1>
      <p className="mt-2 text-white/55">
        {party.members.length} members · round {Math.min(party.round + 1, party.playlist.length)}/{party.playlist.length}
      </p>
      <ul className="mt-6 space-y-2">
        {party.members.map((m) => (
          <li key={m.id} className="flex justify-between text-white/80">
            <span>{m.name}</span>
            <span>{m.ready ? "READY" : "JOINED"}</span>
          </li>
        ))}
      </ul>
      {game ? (
        <Link href={`/play/${game.slug}?party=${party.code}`} className="mt-8 inline-block rounded-full bg-[var(--accent)] px-5 py-3 text-[#140d12]">
          Play {game.title}
        </Link>
      ) : null}
      <div className="mt-8">
        <p className="text-[13px] text-white/45">Standings</p>
        <ul className="mt-2">
          {party.standings.map((s) => (
            <li key={s.id}>
              {s.name} · {s.points} pts
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {PARTY_REACTIONS.map((r) => (
          <button key={r} type="button" className="rounded-full border border-white/15 px-3 py-1" onClick={() => setReaction(r)}>
            {r}
          </button>
        ))}
      </div>
      {reaction ? (
        <p className="mt-2 text-white/50">
          {player.displayName}: {reaction}
        </p>
      ) : null}
    </div>
  );
}
