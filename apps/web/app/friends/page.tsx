"use client";

import { InviteWidget, FriendPresence, SectionHeader } from "@/components/platform";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";

export default function FriendsPage() {
  useAccent();
  const player = usePlayer();
  const store = useStore();
  const accepted = player.friends.filter((f) => f.status === "accepted");
  const playing = accepted.filter((f) => f.presence === "playing");
  const online = accepted.filter((f) => f.presence === "online");
  const offline = accepted.filter((f) => f.presence === "offline");
  const requests = player.friends.filter((f) => f.status === "pending-in" || f.status === "pending-out");

  return (
    <div className="px-5 py-8 md:px-10">
      <h1 className="display text-[44px] md:text-[64px]">Friends</h1>
      <p className="mt-2 max-w-lg text-[15px] text-[var(--text-dim)]">
        Presence is real when someone is actually here. Join opens the same game — rooms come later.
      </p>
      <div className="mt-8 max-w-xl">
        <InviteWidget />
      </div>

      {player.pendingInvite && !player.friends.some((f) => f.username === player.pendingInvite) ? (
        <div className="mt-8 max-w-xl border-t border-[var(--line)] pt-4">
          <p className="text-[15px]">{player.pendingInvite} invited you.</p>
          {player.isGuest ? (
            <p className="mt-1 text-[13px] text-[var(--text-dim)]">Save progress to add them as a friend.</p>
          ) : (
            <button type="button" className="mt-3 min-h-11 text-[13px] underline" onClick={() => void store.addPendingFriend()}>
              Add friend
            </button>
          )}
        </div>
      ) : null}

      {player.friends.length === 0 ? (
        <p className="mt-8 text-[14px] text-[var(--text-dim)]">No friends yet</p>
      ) : (
        <div className="mt-10 max-w-xl space-y-10">
          <Group title="Playing now" empty="Nobody in a run right now." friends={playing} store={store} />
          <Group title="Online" empty="No one idle-online." friends={online} store={store} />
          <Group title="Requests" empty="No pending invites." friends={requests} store={store} />
          <Group title="Offline" empty="No offline friends." friends={offline} store={store} />
        </div>
      )}
    </div>
  );
}

function Group({
  title,
  empty,
  friends,
  store,
}: {
  title: string;
  empty: string;
  friends: ReturnType<typeof usePlayer>["friends"];
  store: ReturnType<typeof useStore>;
}) {
  return (
    <section>
      <SectionHeader title={title} />
      {friends.length ? (
        <div className="mt-2 divide-y divide-[var(--line)]">
          {friends.map((f) => (
            <FriendPresence
              key={f.id}
              friend={f}
              onRemove={() => store.removeFriend(f.id)}
              onAccept={f.status === "pending-in" ? () => store.acceptFriend(f.id) : undefined}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[13px] text-[var(--text-faint)]">{empty}</p>
      )}
    </section>
  );
}
