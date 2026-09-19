import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const TONES = {
  primary: "gw-cta",
  ghost: "gw-cta-ghost",
  quiet: "gw-cta-quiet",
} as const;

export function ChamferButton({
  href,
  children,
  tone = "primary",
  cue = tone === "primary",
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
  const body = (
    <>
      {cue && tone === "primary" ? <span className="gw-cta-mark" aria-hidden /> : null}
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
