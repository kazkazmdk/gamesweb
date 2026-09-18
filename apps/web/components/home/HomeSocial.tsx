"use client";

import Link from "next/link";
import { getManifest } from "@gamesweb/game-sdk";
import { analytics } from "@gamesweb/analytics";
import { Avatar } from "@/components/shell/AppShell";
import type { Friend } from "@/lib/player-store";
import type { ChallengeRecord } from "@gamesweb/game-sdk";
import type { RivalRow } from "@/lib/social/arcade-store";

export function HomeSocial({
  friends,
  rivals,
  challenges,
}: {
  friends: Friend[];
  rivals: RivalRow[];
  challenges: ChallengeRecord[];
}) {
  const live = friends.filter((f) => f.status === "accepted" && f.presence !== "offline");
  if (!live.length && !rivals.length && !challenges.length) return null;

  return (
    <section className="relative px-5 pb-16 md:px-10" aria-label="Friends and rivals">
      <p className="meta text-white/40">People</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-4">
        {live.slice(0, 6).map((f) => (
          <Link
            key={f.id}
            href="/friends"
            className="flex min-h-11 items-center gap-2.5"
            onClick={() => analytics.track("home_social_action", { kind: "friend" })}
          >
            <Avatar id={f.avatar} size={32} />
            <span>
              <span className="block text-[14px] text-white">{f.displayName}</span>
              <span className="block text-[12px] text-white/50">
                {f.presence === "playing" && f.gameId ? getManifest(f.gameId)?.title ?? "Playing" : "Online"}
              </span>
            </span>
          </Link>
        ))}
        {rivals.slice(0, 3).map((r) => (
          <Link
            key={r.otherId}
            href="/friends"
            className="flex min-h-11 items-center gap-2.5"
            onClick={() => analytics.track("home_social_action", { kind: "rival" })}
          >
            <Avatar id={r.otherId} size={32} />
            <span>
              <span className="block text-[14px] text-white">{r.otherName}</span>
              <span className="stat block text-[13px] text-white/60">
                {r.winsA}–{r.winsB}
              </span>
            </span>
          </Link>
        ))}
        {challenges.slice(0, 2).map((c) => {
          const g = getManifest(c.gameId);
          return (
            <Link
              key={c.id}
              href={`/c/${c.publicCode}`}
              className="flex min-h-11 items-center gap-3"
              onClick={() => analytics.track("home_social_action", { kind: "challenge" })}
            >
              <span className="h-8 w-1 bg-[var(--accent)]" aria-hidden />
              <span>
                <span className="block text-[14px] text-white">{c.challengerName}</span>
                <span className="block text-[12px] text-white/50">{g?.title ?? c.gameId}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
