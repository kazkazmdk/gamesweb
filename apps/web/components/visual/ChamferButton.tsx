import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * CTA semantics (do not invent extra colors):
 * - platform: cream / high-contrast Gamesweb action (Invite, Create party, profile/nav)
 * - primary: current --accent = game action or event action (Play, Retry, Daily, GP)
 * - ghost / quiet: secondary only
 */
const TONES = {
  primary: "gw-cta",
  platform: "gw-cta-platform",
  ghost: "gw-cta-ghost",
  quiet: "gw-cta-quiet",
} as const;

export function ChamferButton({
  href,
  children,
  tone = "primary",
  cue = tone === "primary" || tone === "platform",
  className = "",
  ...props
}: {
  href?: string;
  children: ReactNode;
  tone?: keyof typeof TONES;
  cue?: boolean;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = `${TONES[tone]} ${className}`.trim();
  const showCue = cue && (tone === "primary" || tone === "platform");
  const body = (
    <>
      {showCue ? <span className="gw-cta-mark" aria-hidden /> : null}
      {children}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls} onClick={props.onClick as never}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...props}>
      {body}
    </button>
  );
}
