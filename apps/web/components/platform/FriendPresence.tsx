"use client";

import Link from "next/link";
import { getManifest } from "@gamesweb/game-sdk";
import { GameArt } from "@/components/game/GameArt";
import type { Friend } from "@/lib/player-store";
import { Avatar } from "@/components/shell/AppShell";
import { QuickAction } from "./QuickAction";
import { StatusPill } from "./StatusPill";

export function FriendPresence({
  friend,
  pbLabel,
  compact,
  onRemove,
  onAccept,
  onDecline,
}: {
  friend: Friend;
  pbLabel?: string | null;
  compact?: boolean;
  onRemove?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  const game = friend.gameId ? getManifest(friend.gameId) : null;
  const playing = friend.status === "accepted" && friend.presence === "playing" && game;
  const status = friend.status === "pending-in" || friend.status === "pending-out"
    ? null
    : friend.presence === "playing"
      ? "playing"
      : friend.presence === "online"
        ? "online"
        : "offline";
  const line =
    friend.status === "pending-in"
      ? "Wants to play"
      : friend.status === "pending-out"
        ? "Invite sent"
        : playing
          ? `Playing ${game.title}`
          : friend.presence === "online"
            ? "Online"
            : "Offline";

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative shrink-0">
        <Avatar id={friend.avatar} size={compact ? 32 : 40} />
        {playing ? (
          <span className="absolute -bottom-1 -right-1 h-4 w-6 overflow-hidden">
            <GameArt slug={game.slug} className="h-full w-full object-cover" />
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/profile/${friend.username}`} className="truncate text-[15px] hover:text-[var(--text)]">
          {friend.displayName}
        </Link>
        <p className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-dim)]">
          {status ? <StatusPill kind={status} /> : null}
          <span>{line}</span>
          {pbLabel ? <span>PB {pbLabel}</span> : null}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {friend.status === "pending-in" && onAccept ? (
          <QuickAction tone="primary" onClick={onAccept}>
            Accept
          </QuickAction>
        ) : null}
        {friend.status === "pending-in" && onDecline ? (
          <QuickAction tone="quiet" onClick={onDecline}>
            Decline
          </QuickAction>
        ) : null}
        {playing ? (
          <QuickAction href={`/play/${game.slug}`} tone="primary">
            Join
          </QuickAction>
        ) : null}
        {onRemove ? (
          <details className="relative">
            <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center text-[12px] text-[var(--text-faint)]">
              More
            </summary>
            <div className="absolute right-0 z-10 mt-1 min-w-[140px] border border-[var(--line)] bg-[var(--elevated)] p-2">
              <button type="button" className="block w-full px-2 py-2 text-left text-[13px] text-[var(--text-dim)]" onClick={onRemove}>
                Remove
              </button>
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}
