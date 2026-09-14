"use client";

import { analytics } from "@gamesweb/analytics";
import Link from "next/link";
import { usePlayer, useStore } from "@/lib/player";

export function SavePrompt() {
  const player = usePlayer();
  const store = useStore();
  if (!player.pendingSavePrompt || !player.isGuest) return null;
  return (
    <div className="fixed inset-x-0 bottom-20 z-40 mx-auto w-[min(420px,calc(100vw-1.5rem))] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] md:bottom-6">
      <p className="text-[14px] font-medium">Save your progress</p>
      <p className="mt-1 text-[12px] text-[var(--text-dim)]">
        Your records, XP and streak live on this device. Keep them if you switch machines.
      </p>
      <div className="mt-3 flex gap-2">
        <Link
          href="/auth"
          className="rounded-full bg-[var(--text)] px-4 py-2 text-[12px] text-[var(--bg)]"
          onClick={() => analytics.track("signup_started")}
        >
          Continue
        </Link>
        <button type="button" className="px-3 text-[12px] text-[var(--text-dim)]" onClick={() => store.dismissSavePrompt()}>
          Later
        </button>
      </div>
    </div>
  );
}
