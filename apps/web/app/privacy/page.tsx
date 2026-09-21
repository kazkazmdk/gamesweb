import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="display text-[48px]">Privacy</h1>
      <div className="mt-6 space-y-4 text-[15px] text-[var(--text-dim)]">
        <p>
          Gamesweb stores guest play on this device in localStorage, including scores, settings, and a local player id.
          A first-party cookie named <code>gw_guest</code> identifies the same guest to the server so runs can be saved
          without an account.
        </p>
        <p>
          If you save progress, we collect the email address you enter so we can send a sign-in link. The account then
          holds your profile, XP, achievements, cloud saves, friendships, and scores.
        </p>
        <p>
          Scores submitted to the server are validated. Verified scores from signed-in players may appear on public
          leaderboards with username, display name, avatar, and score. Unverified or flagged runs are not ranked.
        </p>
        <p>
          Optional product analytics (PostHog) uses a pseudonymous player id and gameplay events. It is not required to
          play. We do not sell ads against your play.
        </p>
        <p>
          When a backend is configured, data lives in Supabase (Postgres + Auth). Rate limits in production use a Redis
          provider if configured. Magic-link abuse protection may use Cloudflare Turnstile when enabled.
        </p>
        <p>
          See also <Link href="/about">About</Link> and <Link href="/terms">Terms</Link>.
        </p>
      </div>
    </main>
  );
}
