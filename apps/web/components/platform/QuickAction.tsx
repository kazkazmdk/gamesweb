import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ChamferButton } from "@/components/visual/ChamferButton";

export function QuickAction({
  href,
  children,
  tone = "primary",
  cue,
  ...props
}: {
  href?: string;
  children: ReactNode;
  tone?: "primary" | "platform" | "ghost" | "quiet";
  cue?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <ChamferButton href={href} tone={tone} cue={cue} {...props}>
      {children}
    </ChamferButton>
  );
}
