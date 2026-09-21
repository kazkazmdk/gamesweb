"use client";

import { getManifest, PARTY_REACTIONS } from "@gamesweb/game-sdk";
import { arcadeStore, type PartyState } from "@/lib/social/arcade-store";
import { usePlayer } from "@/lib/player";
import { SSR_PLAYER } from "@/lib/player-store";
import { Avatar, useAccent } from "@/components/shell/AppShell";
import { EmptyStateStage, EventRoute, GameBackdrop } from "@/components/visual";
import { ChamferButton } from "@/components/visual/ChamferButton";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PartyPage() {
  const params = useParams<{ code: string }>();
  const player = usePlayer();
  const code = (params.code ?? "").toUpperCase();
  const [reaction, setReaction] = useState("");
  const [party, setParty] = useState<PartyState | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (player.id === SSR_PLAYER.id) return;
    let live = true;
    async function sync() {
      const joined = await arcadeStore.joinParty(code, player.id, player.displayName || "Player");
      if (!live) return;
      if (joined.ok) setParty(joined.party);
      else {
        const pulled = await arcadeStore.pullParty(code);
        if (live) setParty(pulled);
      }
    }
    void sync();
    const timer = window.setInterval(() => {
      void arcadeStore.pullParty(code).then((next) => {
        if (live && next) setParty(next);
      });
    }, 2000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, [code, player.displayName, player.id]);

  const round = party?.playlist[Math.min(party.round, party.playlist.length - 1)];
  const game = round ? getManifest(round.gameId) : undefined;
  useAccent(game?.accent);

  if (party === undefined) {
    return (
      <div className="grid min-h-[50vh] place-items-center px-6">
        <p className="meta text-white/45">Party {code}</p>
      </div>
    );
  }

  if (!party) {
    return (
      <div data-testid="party">
        <EmptyStateStage
          slug="sky-stack"
          kicker={`Party ${code}`}
          title="Party not on this instance"
          body="This code is not on the current server process. Create a lobby here, or ask the host to share a code from the same environment."
          action={
            <ChamferButton
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void arcadeStore.createParty(player.id, player.displayName || "Host").then((created) => {
                  window.location.assign(`/party/${created.code}`);
                });
              }}
            >
              Create party
            </ChamferButton>
          }
        />
      </div>
    );
  }

  const slots = Array.from({ length: 6 }, (_, i) => party.members[i] ?? null);
  const hostId = party.host;
  const me = party.members.find((m) => m.id === player.id);

  return (
    <div data-testid="party">
      <GameBackdrop slug={game?.slug ?? "sky-stack"} className="min-h-[58vh]" dim={0.24} priority>
        <div className="flex min-h-[58vh] flex-col justify-end px-5 pb-10 pt-20 md:px-10">
          <p className="meta text-white/50">
            Party <span data-testid="party-code">{party.code}</span>
            {party.persistence === "local" ? " · this device only" : " · shared lobby"}
          </p>
          <h1 className="display mt-2 text-[44px] text-white md:text-[68px]">{game?.title ?? "Lobby"}</h1>
          <p className="mt-3 text-[14px] text-white/65">
            Round {Math.min(party.round + 1, party.playlist.length)}/{party.playlist.length} · async playlist
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {game ? <ChamferButton href={`/play/${game.slug}?party=${party.code}`}>Play this round</ChamferButton> : null}
            {me ? (
              <ChamferButton
                tone="ghost"
                cue={false}
                onClick={() => {
                  void arcadeStore.setReady(party.code, !me.ready).then((next) => {
                    if (next) setParty(next);
                  });
                }}
              >
                {me.ready ? "Unready" : "Ready"}
              </ChamferButton>
            ) : null}
          </div>
        </div>
      </GameBackdrop>

      <section className="px-5 py-10 md:px-10">
        <p className="meta text-white/40">Slots</p>
        <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {slots.map((m, i) => (
            <li key={m?.id ?? `empty-${i}`} className={`gw-stage gw-sheet min-h-[88px] p-3 ${m ? "" : "opacity-40"}`}>
              {m ? (
                <div className="flex items-center gap-3">
                  <Avatar id={m.name} size={40} />
                  <div>
                    <p className="text-[15px] text-white">
                      {m.name}
                      {m.id === hostId ? " · host" : ""}
                    </p>
                    <p className="meta mt-1">{m.ready ? "Ready" : "Joined"}</p>
                  </div>
                </div>
              ) : (
                <p className="meta pt-4 text-white/35">Open slot</p>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <p className="meta text-white/40">Playlist</p>
          <div className="mt-4">
            <EventRoute
              steps={party.playlist.map((r, i) => {
                const g = getManifest(r.gameId);
                return {
                  key: `${r.gameId}-${i}`,
                  index: i,
                  slug: g?.slug ?? r.gameId,
                  title: g?.title ?? r.gameId,
                  kicker: i < party.round ? "Done" : i === party.round ? "Now" : `R${i + 1}`,
                  status: i < party.round ? "done" : i === party.round ? "current" : "locked",
                  href: g ? `/play/${g.slug}?party=${party.code}` : undefined,
                };
              })}
            />
          </div>
        </div>

        {party.standings.length ? (
          <div className="mt-10">
            <p className="meta text-white/40">Standings</p>
            <ol className="mt-3 max-w-md space-y-2">
              {party.standings.map((s, i) => (
                <li key={s.id} className="flex justify-between text-[15px]">
                  <span>
                    {i + 1} {s.name}
                  </span>
                  <span className="stat">{s.points}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-2">
          {PARTY_REACTIONS.map((r) => (
            <button key={r} type="button" className="gw-cta-ghost min-h-10 px-3" onClick={() => setReaction(r)}>
              {r}
            </button>
          ))}
        </div>
        {reaction ? (
          <p className="mt-2 text-white/50">
            {player.displayName}: {reaction}
          </p>
        ) : null}
      </section>
    </div>
  );
}
