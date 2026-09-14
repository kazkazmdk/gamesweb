const USERNAME = /^[a-zA-Z0-9_]{3,20}$/;

export function isValidInviteRef(ref: string, currentUsername?: string): boolean {
  const value = ref.trim();
  if (!value || value.length < 3 || value.length > 20) return false;
  if (!USERNAME.test(value)) return false;
  if (currentUsername && value.toLowerCase() === currentUsername.toLowerCase()) return false;
  return true;
}
