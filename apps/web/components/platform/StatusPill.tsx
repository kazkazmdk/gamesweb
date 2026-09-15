const TONES = {
  online: "text-[var(--ok)]",
  playing: "text-[var(--accent)]",
  offline: "text-[var(--text-faint)]",
  complete: "text-[var(--ok)]",
  locked: "text-[var(--text-faint)]",
  verified: "text-[var(--ok)]",
  review: "text-[var(--warning)]",
} as const;

const LABELS = {
  online: "ONLINE",
  playing: "PLAYING",
  offline: "OFFLINE",
  complete: "COMPLETE",
  locked: "LOCKED",
  verified: "VERIFIED",
  review: "UNDER REVIEW",
} as const;

export type StatusKind = keyof typeof TONES;

export function StatusPill({ kind, label }: { kind: StatusKind; label?: string }) {
  return (
    <span className={`meta ${TONES[kind]}`}>
      {label ?? LABELS[kind]}
    </span>
  );
}
