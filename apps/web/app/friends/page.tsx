"use client";

import { InviteWidget, FriendPresence, SectionHeader } from "@/components/platform";
import { EmptyStateStage, PlayerVersus } from "@/components/visual";
import { ChamferButton } from "@/components/visual/ChamferButton";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { useArcade } from "@/lib/social/use-arcade";
import { formatPlayScore } from "@/lib/platform/format";
import { getManifest } from "@gamesweb/game-sdk";

export default function FriendsPage() {
  useAccent();
  const player = usePlayer();
  const store = useStore();
  const accepted = player.friends.filter((f) => f.status === "accepted");
  const playing = accepted.filter((f) => f.presence === "playing");
  const online = accepted.filter((f) => f.presence === "online");
  const offline = accepted.filter((f) => f.presence === "offline");
  const requests = player.friends.filter((f) => f.status === "pending-in" || f.status === "pending-out");
  const arcade = useArcade();
  const openChallenges = arcade.challenges.filter((c) => c.status === "open" || c.status === "accepted");
  const rivals = arcade.rivals;

  return (
    <div className="pb-16">
      {playing[0] && playing[0].gameId ? (
        <section className="relative min-h-[42vh] overflow-hidden">
          <FriendPresence friend={playing[0]} />
        </section>
      ) : null}

      {player.friends.length === 0 ? (
        <div>
          <EmptyStateStage
            heading="h1"
            slug="neon-drift"
            kicker="Social"
            title="Friends"
            body="No friends yet. Invite someone to chase a score. Presence only appears when they are actually here."
            action={<InviteWidget />}
          />
          <div className="px-5 py-8 md:px-10">
            <p className="meta text-white/40">Meanwhile</p>
            <p className="mt-2 max-w-md text-[14px] text-[var(--text-dim)]">
              Set a public record, then send the invite. The board is the reason to add someone.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-[14px]">
              <ChamferButton href="/games" tone="ghost">
                Browse games
              </ChamferButton>
              <ChamferButton href="/leaderboards" tone="quiet">
                Leaderboards
              </ChamferButton>
            </div>
          </div>
        </div>
      ) : (
      <div className="px-5 pt-8 md:px-10">
        <p className="meta text-white/45">Social</p>
        <h1 className="display mt-2 text-[44px] md:text-[64px]">Friends</h1>
      </div>
      )}

      {player.friends.length === 0 ? null : playing.length ? (
        <section className="mt-8 px-5 md:px-10">
          <SectionHeader title="Playing now" />
          <div className="mt-4 grid gap-3">
            {playing.map((f) => (
              <FriendPresence key={f.id} friend={f} />
            ))}
          </div>
        </section>
      ) : null}

      {openChallenges.length ? (
        <section className="mt-10 px-5 md:px-10">
          <SectionHeader title="Challenges" />
          <div className="mt-4 grid gap-4">
            {openChallenges.slice(0, 4).map((c) => {
              const game = getManifest(c.gameId);
              return (
                <PlayerVersus
                  key={c.id}
                  left={{ name: c.challengerName, score: formatPlayScore(c.gameId, c.challengerScore) ?? undefined }}
                  right={{ name: c.targetName ?? "Open", score: c.targetScore != null ? formatPlayScore(c.gameId, c.targetScore) ?? undefined : undefined }}
                  gameId={c.gameId}
                  stake={game?.title}
                  expires={c.status}
                  href={`/c/${c.publicCode}`}
                  cta={c.challengerId === player.id ? "Open" : "Answer"}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      {rivals.length ? (
        <section className="mt-10 px-5 md:px-10">
          <SectionHeader title="Rivals" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {rivals.map((r) => (
              <PlayerVersus
                key={r.otherId}
                left={{ name: player.displayName, score: String(r.winsA) }}
                right={{ name: r.otherName, score: String(r.winsB) }}
                stake={`${r.totalMatches} matches`}
                href="/inbox"
                cta="Rematch"
              />
            ))}
          </div>
        </section>
      ) : null}

      {player.pendingInvite && !player.friends.some((f) => f.username === player.pendingInvite) ? (
        <section className="mt-10 px-5 md:px-10">
          <p className="text-[15px]">{player.pendingInvite} invited you.</p>
          {player.isGuest ? (
            <p className="mt-1 text-[13px] text-[var(--text-dim)]">Save progress to add them as a friend.</p>
          ) : (
            <ChamferButton className="mt-3" onClick={() => void store.addPendingFriend()}>
              Add friend
            </ChamferButton>
          )}
        </section>
      ) : null}

      {player.friends.length === 0 ? null : (
        <div className="mt-12 space-y-10 px-5 md:px-10">
          <Group title="Online" empty="No one idle-online." friends={online} store={store} />
          <Group title="Requests" empty="No pending invites." friends={requests} store={store} />
          <Group title="Everyone" empty="Offline friends stay quiet until they return." friends={offline} store={store} />
          <div className="max-w-xl">
            <InviteWidget />
          </div>
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
  if (!friends.length && title !== "Everyone") {
    return (
      <section>
        <SectionHeader title={title} />
        <p className="mt-3 text-[13px] text-[var(--text-faint)]">{empty}</p>
      </section>
    );
  }
  if (!friends.length) return null;
  return (
    <section>
      <SectionHeader title={title} />
      <div className="mt-3 space-y-2">
        {friends.map((f) => (
          <FriendPresence
            key={f.id}
            friend={f}
            onRemove={f.status === "accepted" ? () => store.removeFriend(f.id) : undefined}
            onAccept={f.status === "pending-in" ? () => store.acceptFriend(f.id) : undefined}
            onDecline={f.status === "pending-in" ? () => store.declineFriend(f.id) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
