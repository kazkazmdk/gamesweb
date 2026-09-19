"use client";

import { arcadeStore } from "@/lib/social/arcade-store";
import { usePlayer } from "@/lib/player";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyStateStage } from "@/components/visual";
import { ChamferButton } from "@/components/visual/ChamferButton";
import { useAccent } from "@/components/shell/AppShell";

export default function PartyCreatePage() {
  useAccent();
  const player = usePlayer();
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <div data-testid="party-create">
      <EmptyStateStage
        slug="sky-stack"
        kicker="Party"
        title="Open a lobby"
        body="Same playlist. Play on your own time. Standings update after each result — this is not a live match room."
        action={
          <ChamferButton
            onClick={() => {
              const party = arcadeStore.createParty(player.id, player.displayName || "Host");
              router.push(`/party/${party.code}`);
            }}
          >
            Create party
          </ChamferButton>
        }
      />
      <form
        className="mx-auto flex max-w-lg items-end gap-3 px-5 py-10 md:px-10"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) router.push(`/party/${code.trim().toUpperCase()}`);
        }}
      >
        <label className="flex-1">
          <span className="meta text-white/40">Enter a code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="PARTY"
            className="gw-input mt-2"
            aria-label="Party code"
          />
        </label>
        <ChamferButton type="submit" tone="ghost" cue={false}>
          Join
        </ChamferButton>
      </form>
    </div>
  );
}
