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
      <div className="mt-8 md:grid md:grid-cols-[220px_minmax(520px,640px)_minmax(0,1fr)] md:gap-12">
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
            </section>
          ) : null}

          {cat === "video" ? (
            <section>
              <h2 className="meta">Video</h2>
              <p className="mt-3 text-[13px] text-[var(--text-dim)]">Automatic quality. Effects drop if frames slip.</p>
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
              <p className="mt-2 text-[13px] text-[var(--text-dim)]">Current controls for each game.</p>
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
                label="Share game presence"
                description="Friends can see when you are online or playing a game."
                checked={s.sharePresence}
                onChange={(sharePresence) => {
                  store.update({ settings: { ...s, sharePresence } });
                  if (!player.isGuest) void store.updateProfileRemote({ sharePresence });
                }}
              />
            </section>
          ) : null}

          {cat === "privacy" ? (
            <section>
              <h2 className="meta">Privacy</h2>
              <SwitchControl
                label="Show recent activity on profile"
                description="Recent verified runs can appear on your public profile."
                checked={s.sharePublicActivity}
                onChange={(sharePublicActivity) => {
                  store.update({ settings: { ...s, sharePublicActivity } });
                  if (!player.isGuest) void store.updateProfileRemote({ sharePublicActivity });
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
                label="Haptics"
                description="Controller and phone vibration during play."
                checked={s.haptics}
                onChange={(haptics) => store.update({ settings: { ...s, haptics } })}
              />
            </section>
          ) : null}
        </form>
        <aside className="mt-10 hidden md:block">
          <SettingsContext cat={cat} controlGame={controlGame} />
        </aside>
      </div>
    </div>
  );
}

function SettingsContext({ cat, controlGame }: { cat: string; controlGame: string }) {
  const player = usePlayer();
  const s = player.settings;
  const game = GAME_MANIFESTS.find((g) => g.id === controlGame) ?? GAME_MANIFESTS[0];
  return (
    <div className="sticky top-24 text-[13px] text-[var(--text-dim)]">
      {cat === "account" ? (
        <div>
          <p className="meta">Profile</p>
          <p className="mt-3 text-[15px] text-[var(--text)]">{player.displayName}</p>
          <p className="mt-1">@{player.username}</p>
          <p className="mt-3">{player.isGuest ? "Guest identity stays on this device." : "Signed-in profile."}</p>
        </div>
      ) : null}
      {cat === "audio" ? (
        <div>
          <p className="meta">Output</p>
          <p className="mt-3">Master {Math.round(s.master * 100)} · Music {Math.round(s.music * 100)} · SFX {Math.round(s.sfx * 100)}</p>
          <div className="mt-4 flex items-end gap-1">
            {[s.master, s.music, s.sfx].map((v, i) => (
              <span key={i} className="inline-block w-4 bg-[var(--accent)]" style={{ height: `${12 + v * 36}px` }} />
            ))}
          </div>
        </div>
      ) : null}
      {cat === "gameplay" ? (
        <div>
          <p className="meta">Feel</p>
          <p className="mt-3">Ghost {s.ghost ? "on" : "off"} · Shake {Math.round(s.shake * 100)}</p>
        </div>
      ) : null}
      {cat === "controls" ? (
        <div>
          <p className="meta">{game.title}</p>
          <ul className="mt-3 space-y-1">
            {game.controls.slice(0, 4).map((c) => (
              <li key={c.input}>{c.input} · {c.action}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {cat === "privacy" ? (
        <div>
          <p className="meta">Public profile</p>
          <p className="mt-3">{s.sharePublicActivity ? "Recent verified runs can appear." : "Activity stays private."}</p>
        </div>
      ) : null}
      {cat === "social" ? (
        <div>
          <p className="meta">Presence</p>
          <p className="mt-3">{s.sharePresence ? "Friends can see when you play." : "You appear offline to friends."}</p>
        </div>
      ) : null}
      {cat === "accessibility" ? (
        <div>
          <p className="meta">Motion</p>
          <p className="mt-3">{s.reducedMotion ? "Transitions are cut." : "Focus and camera motion stay on."}</p>
        </div>
      ) : null}
      {cat === "video" ? (
        <div>
          <p className="meta">Display</p>
          <p className="mt-3">Automatic quality. Fullscreen from the play chrome.</p>
        </div>
      ) : null}
    </div>
  );
}
