"use client";

import Link from "next/link";
import { getManifest } from "@gamesweb/game-sdk";
import { analytics } from "@gamesweb/analytics";
import { Avatar } from "@/components/shell/AppShell";
import { GameArt } from "@/components/game/GameArt";
import type { Friend } from "@/lib/player-store";
import type { ChallengeRecord } from "@gamesweb/game-sdk";
import type { RivalRow } from "@/lib/social/arcade-store";
import { homeStage } from "./home-stage";

export function HomeSocial({
  friends,
  rivals,
  challenges,
  you,
}: {
  friends: Friend[];
  rivals: RivalRow[];
  challenges: ChallengeRecord[];
  you: { name: string; avatar: string };
}) {
  const playing = friends.find((f) => f.status === "accepted" && f.presence === "playing" && f.gameId);
  const rival = rivals[0];
  const challenge = challenges[0];
  if (!playing && !rival && !challenge) return null;

  return (
    <section className="relative px-5 pb-16 md:px-10" aria-label="Arcade live">
      <p className="meta text-white/40">Arcade live</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {challenge ? <ChallengeCard challenge={challenge} you={you} /> : null}
        {playing ? <PlayingCard friend={playing} /> : null}
        {rival ? <RivalCard rival={rival} you={you} /> : null}
      </div>
    </section>
  );
}

function ChallengeCard({
  challenge,
  you,
}: {
  challenge: ChallengeRecord;
  you: { name: string; avatar: string };
}) {
  const g = getManifest(challenge.gameId);
  return (
    <Link
      href={`/c/${challenge.publicCode}`}
      className="home-live-card relative min-h-[168px] overflow-hidden p-4 md:p-5"
      onClick={() => analytics.track("home_social_action", { kind: "challenge" })}
    >
      {g ? (
        <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden>
          <GameArt slug={g.slug} variant="tile" position={homeStage(g.slug).tile} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
        </div>
      ) : null}
      <div className="relative">
        <p className="meta text-white/50">Challenge</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <Avatar id={challenge.challengerId || challenge.challengerName} size={36} />
            <span className="text-[14px] text-white">{challenge.challengerName}</span>
          </span>
          <span className="home-versus" aria-hidden>
            VS
          </span>
          <span className="flex items-center gap-2">
            <span className="text-[14px] text-white/80">{you.name}</span>
            <Avatar id={you.avatar} size={36} />
          </span>
        </div>
        <p className="mt-4 text-[13px] text-white/70">{g?.title ?? challenge.gameId}</p>
        <p className="metric mt-1 text-[28px] text-white">{formatScore(challenge.challengerScore)}</p>
        <p className="home-secondary mt-4">Beat score ›</p>
      </div>
    </Link>
  );
}

function PlayingCard({ friend }: { friend: Friend }) {
  const g = friend.gameId ? getManifest(friend.gameId) : undefined;
  return (
    <Link
      href="/friends"
      className="home-live-card relative min-h-[168px] overflow-hidden p-4 md:p-5"
      onClick={() => analytics.track("home_social_action", { kind: "friend" })}
    >
      {g ? (
        <div className="pointer-events-none absolute inset-0 opacity-34" aria-hidden>
          <GameArt slug={g.slug} variant="tile" position={homeStage(g.slug).tile} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/15" />
        </div>
      ) : null}
      <div className="relative">
        <p className="meta text-white/50">Live</p>
        <div className="mt-4 flex items-center gap-3">
          <Avatar id={friend.avatar} size={40} />
          <span>
            <span className="block text-[15px] text-white">{friend.displayName} is playing</span>
            <span className="mt-1 block text-[13px] text-white/65">{g?.title ?? "In a run"}</span>
          </span>
        </div>
        <p className="home-secondary mt-8">Open friends ›</p>
      </div>
    </Link>
  );
}

function RivalCard({ rival, you }: { rival: RivalRow; you: { name: string; avatar: string } }) {
  const lead =
    rival.winsA === rival.winsB ? "Tied" : rival.winsB > rival.winsA ? `${rival.otherName} leads` : "You lead";
  return (
    <Link
      href="/friends"
      className="home-live-card relative min-h-[168px] p-4 md:p-5"
      onClick={() => analytics.track("home_social_action", { kind: "rival" })}
    >
      <p className="meta text-white/50">Rival</p>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div>
          <Avatar id={you.avatar} size={36} />
          <p className="mt-2 text-[13px] text-white/70">{you.name}</p>
          <p className="metric mt-1 text-[32px] text-white">{rival.winsA}</p>
        </div>
        <span className="home-versus mb-2" aria-hidden>
          VS
        </span>
        <div className="text-right">
          <span className="inline-flex justify-end">
            <Avatar id={rival.otherId} size={36} />
          </span>
          <p className="mt-2 text-[13px] text-white/70">{rival.otherName}</p>
          <p className="metric mt-1 text-[32px] text-white">{rival.winsB}</p>
        </div>
      </div>
      <p className="mt-4 text-[13px] text-white/60">{lead}</p>
    </Link>
  );
}

function formatScore(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}
