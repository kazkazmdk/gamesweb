"use client";

import { useState } from "react";
import { useStore } from "@/lib/player";
import { QuickAction } from "./QuickAction";

export function InviteWidget({ slug, compact }: { slug?: string; compact?: boolean }) {
  const store = useStore();
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(store.inviteLink(slug));
    store.markInvite();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div>
      {compact ? null : (
        <>
          <p className="meta">Invite a friend</p>
          <p className="mt-2 max-w-md text-[14px] text-[var(--text-dim)]">
            Send a link. They can play before creating an account.
          </p>
        </>
      )}
      <div className={compact ? "" : "mt-4"}>
        <QuickAction onClick={() => void copy()} tone={copied || compact ? "ghost" : "primary"}>
          {copied ? "Copied" : compact ? "Invite" : "Copy link"}
        </QuickAction>
      </div>
    </div>
  );
}
