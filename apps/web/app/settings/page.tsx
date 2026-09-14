"use client";

import { usePlayer, useStore } from "@/lib/player";

export default function SettingsPage() {
  const player = usePlayer();
  const store = useStore();
  const s = player.settings;
  return (
    <div className="px-5 py-8 md:px-10">
      <h1 className="display text-[44px] md:text-[64px]">Settings</h1>
      <form className="mt-8 max-w-md space-y-6" onSubmit={(e) => e.preventDefault()}>
        <label className="block">
          <span className="text-[12px] text-[var(--text-faint)]">Display name</span>
          <input
            className="mt-1 h-11 w-full rounded-xl border border-[var(--line)] bg-transparent px-3"
            value={player.displayName}
              onChange={(e) => {
                store.update({ displayName: e.target.value.slice(0, 24) });
              }}
              onBlur={() => {
                if (!player.isGuest) void store.updateProfileRemote();
              }}
          />
        </label>
        <fieldset>
          <legend className="text-[12px] text-[var(--text-faint)]">Audio</legend>
          {(
            [
              ["master", "Master"],
              ["music", "Music"],
              ["sfx", "SFX"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="mt-3 flex items-center justify-between gap-4">
              <span className="text-[14px]">{label}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={s[key]}
                onChange={(e) =>
                  store.update({
                    settings: { ...s, [key]: Number(e.target.value) },
                  })
                }
              />
            </label>
          ))}
          <label className="mt-3 flex items-center gap-2 text-[14px]">
            <input
              type="checkbox"
              checked={s.muted}
              onChange={(e) => store.update({ settings: { ...s, muted: e.target.checked } })}
            />
            Mute
          </label>
        </fieldset>
        <label className="flex items-center gap-2 text-[14px]">
          <input
            type="checkbox"
            checked={s.reducedMotion}
            onChange={(e) => store.update({ settings: { ...s, reducedMotion: e.target.checked } })}
          />
          Reduce motion
        </label>
        <label className="flex items-center gap-2 text-[14px]">
          <input
            type="checkbox"
            checked={s.shareActivity}
              onChange={(e) => {
                store.update({ settings: { ...s, shareActivity: e.target.checked } });
                if (!player.isGuest) void store.updateProfileRemote({ shareActivity: e.target.checked });
              }}
          />
          Share activity with friends
        </label>
        <p className="text-[12px] text-[var(--text-faint)]">
          Identity: {player.isGuest ? "guest, local-first" : "account"} · backend {player.backend}
        </p>
      </form>
    </div>
  );
}
