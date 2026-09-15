import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const TONES = {
  primary:
    "inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-[14px] font-semibold text-[#140d12]",
  ghost:
    "inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 text-[13px]",
  quiet: "inline-flex min-h-11 items-center justify-center px-3 text-[13px] text-[var(--text-dim)]",
} as const;

export function QuickAction({
  href,
  children,
  tone = "primary",
  ...props
}: {
  href?: string;
  children: ReactNode;
  tone?: keyof typeof TONES;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const className = TONES[tone];
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={className} {...props}>
      {children}
    </button>
  );
}
