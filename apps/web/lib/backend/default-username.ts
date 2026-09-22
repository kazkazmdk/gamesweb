export function defaultAccountUsername(userId: string): string {
  const hex = userId.replace(/-/g, "");
  return `player_${hex.slice(0, 12)}`;
}

export function defaultAccountUsernameFallback(userId: string): string {
  const hex = userId.replace(/-/g, "");
  return `player_${hex.slice(0, 13)}`;
}
