"use client";

import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import { useState } from "react";
import { SliderControl, SwitchControl } from "@/components/platform";
import { Avatar, useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { accountSyncCopy } from "@/lib/platform/prefs";

const CATS = [
  { id: "account", label: "Account" },
  { id: "gameplay", label: "Gameplay" },
  { id: "audio", label: "Audio" },
  { id: "video", label: "Video" },
  { id: "controls", label: "Controls" },
  { id: "social", label: "Social" },
  { id: "privacy", label: "Privacy" },
  { id: "accessibility", label: "Accessibility" },
] as const;

export default function SettingsPage() {
  useAccent();
  const player = usePlayer();
  const store = useStore();
  const s = player.settings;
  const [cat, setCat] = useState<(typeof CATS)[number]["id"]>("account");
  const [controlGame, setControlGame] = useState(GAME_MANIFESTS[0].id);
  const controls = GAME_MANIFESTS.find((g) => g.id === controlGame) ?? GAME_MANIFESTS[0];
  const sync = accountSyncCopy(player);
  const dev = process.env.NODE_ENV !== "production";

  function previewTone() {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 440;
    gain.gain.value = s.muted ? 0 : s.master * s.sfx * 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
    window.setTimeout(() => void ctx.close(), 400);
  }

  return (
    <div className="px-5 py-8 md:px-10">
      <h1 className="display text-[44px] md:text-[64px]">Settings</h1>
      <div className="mt-8 md:grid md:grid-cols-[200px_minmax(0,32rem)] md:gap-12">
        <nav className="mb-6 flex gap-1 overflow-x-auto scrollbar-none md:mb-0 md:flex-col" aria-label="Settings">
          {CATS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={`min-h-11 shrink-0 px-3 text-left text-[13px] ${
                cat === c.id ? "text-[var(--text)] shadow-[inset_0_-2px_0_var(--accent)] md:shadow-[inset_2px_0_0_var(--accent)]" : "text-[var(--text-dim)]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </nav>

        <form className="max-w-xl space-y-8" onSubmit={(e) => e.preventDefault()}>
          {cat === "account" ? (
            <section>
              <h2 className="meta">Account</h2>
              <div className="mt-4 flex items-center gap-4">
                <Avatar id={player.avatar} size={64} />
                <div>
                  <p className="text-[16px]">{player.displayName}</p>
                  <p className="text-[13px] text-[var(--text-dim)]">@{player.username}</p>
                </div>
              </div>
              <p className="mt-4 text-[13px] text-[var(--text-dim)]">
                {player.isGuest ? "Playing as a guest." : "Signed in."} {sync}
              </p>
              <label className="mt-4 block">
                <span className="text-[12px] text-[var(--text-faint)]">Display name</span>
                <input
                  className="mt-1 h-11 w-full border-b border-[var(--line)] bg-transparent px-0"
                  value={player.displayName}
                  onChange={(e) => store.update({ displayName: e.target.value.slice(0, 24) })}
                  onBlur={() => {
                    if (!player.isGuest) void store.updateProfileRemote();
                  }}
                />
              </label>
              {dev ? (
                <p className="mt-6 font-mono text-[11px] text-[var(--text-faint)]">DEV persistence {player.backend}</p>
              ) : null}
            </section>
          ) : null}

          {cat === "audio" ? (
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
              <button type="button" className="mt-4 min-h-11 text-[13px] text-[var(--text-dim)]" onClick={previewTone}>
                Preview SFX
              </button>
            </section>
          ) : null}

          {cat === "gameplay" ? (
            <section>
              <h2 className="meta">Gameplay</h2>
              <SwitchControl
                label="Ghost on by default"
                description="Neon Drift and Velocity Run show your last ghost unless you toggle it in-run."
                checked={s.ghost}
                onChange={(ghost) => store.update({ settings: { ...s, ghost } })}
              />
              <SliderControl
                label="Camera shake"
                value={s.shake}
                onChange={(shake) => store.update({ settings: { ...s, shake } })}
              />
              <SwitchControl
                label="Haptics"
                checked={s.haptics}
                onChange={(haptics) => store.update({ settings: { ...s, haptics } })}
              />
            </section>
          ) : null}

          {cat === "video" ? (
            <section>
              <h2 className="meta">Video</h2>
              <p className="mt-3 text-[13px] text-[var(--text-dim)]">
                Quality follows the device. Games drop effects on their own when frames slip.
              </p>
              <button
                type="button"
                className="mt-4 min-h-11 text-[13px] underline"
                onClick={() => void document.documentElement.requestFullscreen?.()}
              >
                Enter fullscreen
              </button>
            </section>
          ) : null}

          {cat === "controls" ? (
            <section>
              <h2 className="meta">Controls</h2>
              <p className="mt-2 text-[13px] text-[var(--text-dim)]">Current controls. Remapping comes later.</p>
              <div className="mt-4 flex gap-1 overflow-x-auto scrollbar-none" role="tablist" aria-label="Game controls">
                {GAME_MANIFESTS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    role="tab"
                    aria-selected={controlGame === g.id}
                    className={`min-h-11 px-3 text-[13px] ${controlGame === g.id ? "text-[var(--text)] shadow-[inset_0_-2px_0_var(--accent)]" : "text-[var(--text-dim)]"}`}
                    onClick={() => setControlGame(g.id)}
                  >
                    {g.title}
                  </button>
                ))}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[14px]">
                {controls.controls.map((c) => (
                  <div key={c.input} className="border-t border-[var(--line)] pt-2">
                    <dt className="meta">{c.input}</dt>
                    <dd>{c.action}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {cat === "social" ? (
            <section>
              <h2 className="meta">Social</h2>
              <SwitchControl
                label="Share activity"
                description="Friends can see which game you are in. Presence stays offline when this is off."
                checked={s.shareActivity}
                onChange={(shareActivity) => {
                  store.update({ settings: { ...s, shareActivity } });
                  if (!player.isGuest) void store.updateProfileRemote({ shareActivity });
                }}
              />
            </section>
          ) : null}

          {cat === "privacy" ? (
            <section>
              <h2 className="meta">Privacy</h2>
              <SwitchControl
                label="Show activity on public profile"
                description="Your name, records, and achievements stay visible. Recent runs hide when this is off."
                checked={s.shareActivity}
                onChange={(shareActivity) => {
                  store.update({ settings: { ...s, shareActivity } });
                  if (!player.isGuest) void store.updateProfileRemote({ shareActivity });
                }}
              />
            </section>
          ) : null}

          {cat === "accessibility" ? (
            <section>
              <h2 className="meta">Accessibility</h2>
              <SwitchControl
                label="Reduce motion"
                description="Cuts focus transitions, camera shake, and parallax."
                checked={s.reducedMotion}
                onChange={(reducedMotion) => store.update({ settings: { ...s, reducedMotion } })}
              />
              <SwitchControl
                label="Haptics off"
                checked={!s.haptics}
                onChange={(off) => store.update({ settings: { ...s, haptics: !off } })}
              />
            </section>
          ) : null}
        </form>
      </div>
    </div>
  );
}
