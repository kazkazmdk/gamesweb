"use client";

import { SliderControl, SwitchControl } from "@/components/platform";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";

export default function SettingsPage() {
  useAccent();
  const player = usePlayer();
  const store = useStore();
  const s = player.settings;
  return (
    <div className="px-5 py-8 md:px-10">
      <h1 className="display text-[44px] md:text-[64px]">Settings</h1>
      <form className="mt-10 max-w-md space-y-10" onSubmit={(e) => e.preventDefault()}>
        <section>
          <h2 className="meta">Account</h2>
          <p className="mt-2 text-[13px] text-[var(--text-dim)]">
            {player.isGuest ? "Guest. Progress stored on this device." : "Synced."}
          </p>
          <label className="mt-4 block">
            <span className="text-[12px] text-[var(--text-faint)]">Display name</span>
            <input
              className="mt-1 h-11 w-full border-b border-[var(--line)] bg-transparent px-0"
              value={player.displayName}
              onChange={(e) => {
                store.update({ displayName: e.target.value.slice(0, 24) });
              }}
              onBlur={() => {
                if (!player.isGuest) void store.updateProfileRemote();
              }}
            />
          </label>
        </section>

        <section>
          <h2 className="meta">Audio</h2>
          {(
            [
              ["master", "Master"],
              ["music", "Music"],
              ["sfx", "SFX"],
            ] as const
          ).map(([key, label]) => (
            <SliderControl
              key={key}
              label={label}
              value={s[key]}
              onChange={(v) => store.update({ settings: { ...s, [key]: v } })}
            />
          ))}
          <SwitchControl
            label="Mute"
            checked={s.muted}
            onChange={(muted) => store.update({ settings: { ...s, muted } })}
          />
        </section>

        <section>
          <h2 className="meta">Gameplay</h2>
          <SwitchControl
            label="Reduce motion"
            checked={s.reducedMotion}
            onChange={(reducedMotion) => store.update({ settings: { ...s, reducedMotion } })}
          />
        </section>

        <section>
          <h2 className="meta">Social</h2>
          <SwitchControl
            label="Share activity with friends"
            checked={s.shareActivity}
            description="Friends can see the game you are in."
            onChange={(shareActivity) => {
              store.update({ settings: { ...s, shareActivity } });
              if (!player.isGuest) void store.updateProfileRemote({ shareActivity });
            }}
          />
        </section>

        <section>
          <h2 className="meta">Privacy</h2>
          <p className="mt-2 text-[13px] text-[var(--text-dim)]">
            Identity: {player.isGuest ? "guest, local-first" : "account"} · backend {player.backend}
          </p>
        </section>
      </form>
    </div>
  );
}
