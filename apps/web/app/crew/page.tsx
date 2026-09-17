"use client";

import { CREW_REACTIONS } from "@gamesweb/game-sdk";
import { arcadeStore } from "@/lib/social/arcade-store";
import { usePlayer } from "@/lib/player";
import { useState } from "react";

export default function CrewPage() {
  const player = usePlayer();
  const crew = arcadeStore.ensureCrew(player.displayName);
  const [react, setReact] = useState("");
  return (
    <div className="mx-auto max-w-2xl px-5 py-10" data-testid="crew">
      <p className="meta text-white/45">{crew.tag}</p>
      <h1 className="display mt-2 text-4xl">{crew.name}</h1>
      <p className="mt-2 text-white/55">Lv {crew.level} · {crew.members.length}/30 · weekly {crew.weekly.progress}/{crew.weekly.target}</p>
      <ul className="mt-8 space-y-2 text-white/70">
        {crew.feed.length ? crew.feed.map((f) => <li key={f.id}>{f.text}</li>) : <li>No feed yet. Set a PB and it shows up here.</li>}
      </ul>
      <div className="mt-6 flex gap-2">
        {CREW_REACTIONS.map((r) => (
          <button key={r} type="button" className="rounded-full border border-white/15 px-3 py-1" onClick={() => setReact(r)}>
            {r}
          </button>
        ))}
      </div>
      {react ? <p className="mt-2 text-white/45">{react}</p> : null}
    </div>
  );
}
