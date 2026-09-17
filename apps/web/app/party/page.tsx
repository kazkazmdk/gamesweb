"use client";

import { arcadeStore } from "@/lib/social/arcade-store";
import { usePlayer } from "@/lib/player";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PartyCreatePage() {
  const player = usePlayer();
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <div className="mx-auto max-w-md px-5 py-12 text-center" data-testid="party-create">
      <p className="meta text-white/45">Party</p>
      <h1 className="display mt-2 text-4xl">Play a playlist together</h1>
      <p className="mt-3 text-white/55">Async first. Same rounds, same games, standings after each result.</p>
      <button
        type="button"
        className="mt-8 w-full rounded-full bg-[var(--accent)] py-3 text-[#140d12]"
        onClick={() => {
          const party = arcadeStore.createParty(player.id, player.displayName || "Host");
          router.push(`/party/${party.code}`);
        }}
      >
        Create party
      </button>
      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) router.push(`/party/${code.trim().toUpperCase()}`);
        }}
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Party code"
          className="min-h-12 flex-1 rounded-full border border-white/15 bg-transparent px-4"
          aria-label="Party code"
        />
        <button type="submit" className="rounded-full border border-white/15 px-4">
          Join
        </button>
      </form>
    </div>
  );
}
