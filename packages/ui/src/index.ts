export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const radii = {
  sm: "6px",
  md: "10px",
  lg: "16px",
  xl: "24px",
} as const;
