"use client";

import { dailyQuests } from "@gamesweb/game-sdk";
import { useEffect, useState } from "react";
import { ChallengeWidget } from "@/components/platform";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer } from "@/lib/player";
import { challengeViewModel, dailySummary } from "@/lib/platform/adapters";
import { formatCountdown, formatFraction, msUntilUtcMidnight } from "@/lib/platform/format";

export default function ChallengesPage() {
  useAccent();
  const player = usePlayer();
  const quests = dailyQuests(player.dayKey);
  const summary = dailySummary(player);
  const [remain, setRemain] = useState(msUntilUtcMidnight());

  useEffect(() => {
    const t = window.setInterval(() => setRemain(msUntilUtcMidnight()), 1000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="px-5 py-8 md:px-10">
      <p className="meta">Daily missions</p>
      <h1 className="display mt-2 text-[44px] md:text-[64px]">Daily Challenges</h1>
      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[13px] text-[var(--text-dim)]">
        <p>
          <span className="stat mr-2 text-[22px] text-[var(--text)]">{formatCountdown(remain)}</span>
          reset
        </p>
        {player.streak > 0 ? (
          <p>
            <span className="stat mr-2 text-[22px] text-[var(--text)]">{player.streak}</span>
            day streak
          </p>
        ) : null}
        <p>
          <span className="stat mr-2 text-[22px] text-[var(--text)]">{summary.xp}</span>
          / {summary.totalXp} XP
        </p>
        <p>
          <span className="stat mr-2 text-[22px] text-[var(--text)]">{formatFraction(summary.done, summary.total)}</span>
          complete
        </p>
      </div>
      {summary.done === summary.total && summary.total > 0 ? (
        <p className="mt-8 text-[15px] text-[var(--ok)]">All dailies resolved. Reset {formatCountdown(remain)}.</p>
      ) : null}
      <div className="mt-10 grid gap-8 md:grid-cols-1 lg:grid-cols-3">
        {quests.map((q) => (
          <ChallengeWidget key={q.id} view={challengeViewModel(player, q)} variant="full" />
        ))}
      </div>
    </div>
  );
}
