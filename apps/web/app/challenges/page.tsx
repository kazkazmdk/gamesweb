"use client";

import { dailyQuests } from "@gamesweb/game-sdk";
import { ChallengeWidget } from "@/components/platform";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer } from "@/lib/player";
import { challengeViewModel, dailySummary } from "@/lib/platform/adapters";
import { formatCountdown, formatFraction } from "@/lib/platform/format";
import { GameBackdrop, useUtcCountdown } from "@/components/visual";
import { ChamferButton } from "@/components/visual/ChamferButton";

export default function ChallengesPage() {
  useAccent();
  const player = usePlayer();
  const quests = dailyQuests(player.dayKey);
  const summary = dailySummary(player);
  const { remain, label } = useUtcCountdown();
  const current = quests.find((q) => !player.questCompleted.includes(q.id)) ?? quests[0];
  const currentView = current ? challengeViewModel(player, current) : null;

  return (
    <div>
      <GameBackdrop slug={currentView?.slug ?? "neon-drift"} className="min-h-[56vh]" dim={0.22} priority>
        <div className="flex min-h-[56vh] flex-col justify-end px-5 pb-10 pt-20 md:px-10">
          <p className="meta text-white/50">Daily missions</p>
          <h1 className="display mt-2 text-[44px] text-white md:text-[64px]">Daily Challenges</h1>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[13px] text-white/65">
            <p>
              <span className="stat mr-2 text-[22px] text-white">{label}</span>
              reset
            </p>
            {player.streak > 0 ? (
              <p>
                <span className="stat mr-2 text-[22px] text-white">{player.streak}</span>
                day streak
              </p>
            ) : null}
            <p>
              <span className="stat mr-2 text-[22px] text-white">{summary.xp}</span>
              / {summary.totalXp} XP
            </p>
            <p>
              <span className="stat mr-2 text-[22px] text-white">{formatFraction(summary.done, summary.total)}</span>
              complete
            </p>
          </div>
          {currentView && !currentView.done ? (
            <div className="mt-6">
              <ChamferButton href={currentView.slug ? `/play/${currentView.slug}` : "/"}>
                Play {currentView.gameTitle ?? "now"}
              </ChamferButton>
            </div>
          ) : null}
          {summary.done === summary.total && summary.total > 0 ? (
            <p className="mt-6 text-[15px] text-[var(--ok)]">All dailies resolved. Reset {formatCountdown(remain)}.</p>
          ) : null}
        </div>
      </GameBackdrop>

      <div className="grid gap-4 px-5 py-10 md:px-10 lg:grid-cols-3">
        {quests.map((q) => {
          const featured = q.id === current?.id;
          return (
            <div key={q.id} className={featured ? "lg:col-span-2" : ""}>
              <ChallengeWidget view={challengeViewModel(player, q)} variant={featured ? "full" : "compact"} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
