import { brand } from "@gamesweb/config";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="display text-[48px]">Terms</h1>
      <p className="mt-4 text-[15px] text-[var(--text-dim)]">
        {brand.productName} is provided as an instant-play arcade. Don&apos;t cheat leaderboards. Don&apos;t harass
        other players. Guest progress lives in this browser (and the guest cookie) until you save an account. Public
        leaderboards only include verified scores from signed-in players.
      </p>
      <p className="mt-6 text-[15px] text-[var(--text-dim)]">
        Read <Link href="/about">About</Link> and <Link href="/privacy">Privacy</Link>.
      </p>
    </main>
  );
}
