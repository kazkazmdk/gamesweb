export function IconMark({
  children,
  size = 18,
  label,
}: {
  children: React.ReactNode;
  size?: number;
  label?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden={label ? undefined : true} aria-label={label}>
      <g stroke="currentColor" strokeWidth="1.6" strokeLinejoin="miter" strokeLinecap="square">
        {children}
      </g>
    </svg>
  );
}

export function SettingsIcon({ size = 18 }: { size?: number }) {
  return (
    <IconMark size={size}>
      <rect x="3" y="3" width="5" height="5" />
      <rect x="10" y="3" width="5" height="5" />
      <rect x="3" y="10" width="5" height="5" />
      <path d="M12.5 10.5 V15.2 M10.2 12.8 H14.8" />
    </IconMark>
  );
}

export function PlayIcon({ size = 18 }: { size?: number }) {
  return (
    <IconMark size={size}>
      <path d="M5 3.4 L14.2 9 L5 14.6 Z" />
    </IconMark>
  );
}

export function InviteIcon({ size = 18 }: { size?: number }) {
  return (
    <IconMark size={size}>
      <circle cx="7" cy="6.4" r="2.1" />
      <path d="M3.6 14.2 C4 11.8 5.6 10.4 7.2 10.4 S10.4 11.8 10.8 14.2" />
      <path d="M12.2 7 H16 M14.1 5.1 V8.9" />
    </IconMark>
  );
}

export function TrophyIcon({ size = 18 }: { size?: number }) {
  return (
    <IconMark size={size}>
      <path d="M6 3.4 H12 V7.2 C12 9.4 10.2 11 9 11 S6 9.4 6 7.2 Z" />
      <path d="M6 4.6 H4.2 C4.2 7 5.4 8.2 6.6 8.4" />
      <path d="M12 4.6 H13.8 C13.8 7 12.6 8.2 11.4 8.4" />
      <path d="M7.2 11 H10.8 V13.2 H7.2 Z M6.2 13.2 H11.8 V14.6 H6.2 Z" />
    </IconMark>
  );
}

export function BoardIcon({ size = 18 }: { size?: number }) {
  return (
    <IconMark size={size}>
      <path d="M3.4 13.6 H14.6" />
      <path d="M5.2 13.6 V8.2 H7.4 V13.6" />
      <path d="M8.4 13.6 V4.4 H10.8 V13.6" />
      <path d="M11.8 13.6 V10 H14 V13.6" />
    </IconMark>
  );
}

export function SeatIcon({ size = 18 }: { size?: number }) {
  return (
    <IconMark size={size}>
      <rect x="4" y="4" width="10" height="10" />
      <path d="M7 9 H11 M9 7 V11" />
    </IconMark>
  );
}
