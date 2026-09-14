export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="display text-[48px]">Privacy</h1>
      <p className="mt-4 text-[15px] text-[var(--text-dim)]">
        Guest play is stored on your device. Optional accounts exist only when a Supabase project is configured.
        Scores sent to the server are validated and may be marked unverified or flagged. If product analytics is
        enabled (PostHog), events use a pseudonymous player id — not your email. No ads are required to complete
        challenges.
      </p>
    </div>
  );
}
