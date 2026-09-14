export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.3.0";
export const GAME_BUILD_VERSION = process.env.NEXT_PUBLIC_GAME_BUILD_VERSION ?? "1.0.0";

export function commitSha(): string {
  return process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? "dev";
}
