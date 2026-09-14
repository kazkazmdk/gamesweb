"use client";

import { getManifest } from "@gamesweb/game-sdk";
import Link from "next/link";
import { usePlayer, useStore } from "@/lib/player";

export default function FriendsPage() {
  const player = usePlayer();
  const store = useStore();
  return (
    <div className="px-5 py-8 md:px-10">
      <h1 className="display text-[44px] md:text-[64px]">Friends</h1>
      <p className="mt-2 max-w-lg text-[15px] text-[var(--text-dim)]">
        Presence is real when someone is actually here. Join opens the same game — rooms come later.
      </p>
      <button
        type="button"
        className="mt-6 h-11 rounded-full bg-[var(--text)] px-5 text-[13px] text-[var(--bg)]"
        onClick={async () => {
          await navigator.clipboard.writeText(store.inviteLink());
          store.markInvite();
          store.toast({ kind: "info", title: "Invite link copied" });
        }}
      >
        Copy invite
      </button>
      <ul className="mt-8 max-w-xl space-y-2">
        {player.friends.length === 0 ? (
          <li className="text-[14px] text-[var(--text-dim)]">Games are better with rivals.</li>
        ) : (
          player.friends.map((f) => (
            <li key={f.id} className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-4 py-3">
              <span>
                <span className="block">{f.displayName}</span>
                <span className="text-[12px] text-[var(--text-dim)]">
                  {f.status === "accepted"
                    ? f.presence === "playing" && f.gameId
                      ? `Playing ${getManifest(f.gameId)?.title}`
                      : f.presence
                    : f.status === "pending-in"
                      ? "Wants to play"
                      : "Invite sent"}
                </span>
              </span>
              <span className="flex gap-2 text-[12px]">
                {f.status === "pending-in" ? (
                  <button type="button" onClick={() => store.acceptFriend(f.id)}>
                    Accept
                  </button>
                ) : null}
                {f.status === "accepted" && f.gameId ? (
                  <Link href={`/play/${getManifest(f.gameId)?.slug}`}>Join</Link>
                ) : null}
                <button type="button" className="text-[var(--text-faint)]" onClick={() => store.removeFriend(f.id)}>
                  Remove
                </button>
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
