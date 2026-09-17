"use client";

import { analytics } from "@gamesweb/analytics";
import { getManifest, decodeChallengePayload } from "@gamesweb/game-sdk";
import { formatScore } from "@/lib/player-store";
import { arcadeStore } from "@/lib/social/arcade-store";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function ChallengeMagicPage() {
  const params = useParams<{ code: string }>();
  const search = useSearchParams();
  const code = params.code?.toUpperCase() ?? "";
  const payload = search.get("p");
  const challenge = useMemo(() => arcadeStore.getChallenge(code, payload), [code, payload]);

  useEffect(() => {
    analytics.track("challenge_opened", { code });
    if (payload) {
      const share = decodeChallengePayload(payload);
      if (share) arcadeStore.hydrateFromShare(share);
    }
  }, [code, payload]);

  if (!challenge) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-md text-center">
          <p className="meta text-white/45">Challenge</p>
          <h1 className="display mt-3 text-4xl">Link expired</h1>
          <p className="mt-3 text-white/60">This magic link has no payload on this device. Ask your friend to share it again.</p>
          <Link href="/" className="mt-6 inline-block rounded-full bg-[var(--accent)] px-5 py-3 text-[#140d12]">
            Back to arcade
          </Link>
        </div>
      </div>
    );
  }

  const game = getManifest(challenge.gameId);
  const href = `/play/${challenge.gameId}?c=${code}&seed=${encodeURIComponent(challenge.seed)}&mode=${challenge.mode}${payload ? `&p=${payload}` : ""}`;

  return (
    <div className="grid min-h-dvh place-items-center px-6" data-testid="challenge-magic">
      <div className="w-[min(440px,94vw)] text-center">
        <p className="meta text-white/45">Challenge</p>
        <h1 className="display mt-4 text-4xl">{challenge.challengerName} challenged you</h1>
        <p className="mt-4 text-[18px] text-white/80">{game?.title ?? challenge.gameId}</p>
        <p className="display mt-2 text-5xl">{formatScore(challenge.gameId, challenge.challengerScore)}</p>
        <p className="mt-2 text-[13px] text-white/45">
          Same seed · {challenge.trust} · guests can play
        </p>
        <Link
          href={href}
          className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--accent)] text-[15px] text-[#140d12]"
          onClick={() => analytics.track("challenge_started", { code, gameId: challenge.gameId })}
        >
          Beat {challenge.challengerName}
        </Link>
        <p className="mt-4 text-[12px] text-white/40">No signup required to play. Claim a profile to keep the rivalry.</p>
      </div>
    </div>
  );
}
