"use client";

import { analytics } from "@gamesweb/analytics";
import { brand, levelFromXp } from "@gamesweb/config";
import { useState } from "react";
import { ProgressWidget, StatsWidget } from "@/components/platform";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { playerStatsFromSnapshot } from "@/lib/platform/adapters";
import { formatLevel } from "@/lib/platform/format";

export default function AuthPage() {
  useAccent();
  const store = useStore();
  const player = usePlayer();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
  const local = store.snapshot.backend === "local" || !configured;
  const lv = levelFromXp(player.xp);
  const stats = playerStatsFromSnapshot(player);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    analytics.track("signup_started");
    if (!configured) {
      setError("");
      setSent(true);
      return;
    }
    try {
      const res = await fetch("/api/player/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; mode?: string; error?: { message: string } };
      if (!res.ok || data.ok === false) {
        analytics.track("auth_failed");
        throw new Error(data.error?.message ?? "auth failed");
      }
      setSent(true);
    } catch {
      analytics.track("auth_failed");
      setError("Couldn't reach auth. Your local progress is still saved on this device.");
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="display text-[44px]">Save your progress</h1>
      <p className="mt-3 text-[15px] text-[var(--text-dim)]">
        {brand.productName} keeps this device in sync first. An account is only for carrying records elsewhere.
      </p>

      <section className="mt-8" aria-label="Save this run">
        <p className="meta">Save this run</p>
        <p className="metric mt-2 text-[40px]">{formatLevel(lv.level)}</p>
        <div className="mt-4">
          <ProgressWidget value={lv.intoLevel} max={Math.max(1, lv.needed)} caption="Level progress" />
        </div>
        <div className="mt-6">
          <StatsWidget
            items={[
              { value: stats.pbs, label: "PBs" },
              { value: stats.achievements, label: "Achievements" },
              { value: stats.runs, label: "Runs" },
              { value: stats.games, label: "Games" },
            ]}
          />
        </div>
      </section>

      {local ? (
        <p className="mt-6 text-[13px] text-[var(--text-dim)]">
          Local development mode. Accounts need a configured Supabase project. Guest progress stays on this browser.
        </p>
      ) : null}
      {sent ? (
        <p className="mt-8 text-[15px]">
          {configured ? "Check your email for a sign-in link. We’ll merge the runs this device already saved." : "No account was created. Keep playing as a guest on this device."}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-[12px] text-[var(--text-faint)]">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-12 w-full border-b border-[var(--line)] bg-transparent px-0"
            />
          </label>
          <button type="submit" className="h-12 w-full rounded-full bg-[var(--text)] text-[var(--bg)]" disabled={!configured}>
            {configured ? "Continue" : "Unavailable in local mode"}
          </button>
          {error ? <p className="text-[13px] text-[var(--danger)]">{error}</p> : null}
        </form>
      )}
    </div>
  );
}
