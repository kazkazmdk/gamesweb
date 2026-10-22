import { headers } from "next/headers";
import { AuthScreen } from "./AuthScreen";

export default async function AuthPage() {
  const nonce = (await headers()).get("x-nonce") ?? "";
  return <AuthScreen turnstileNonce={nonce} turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""} />;
}
