import { brand } from "@gamesweb/config";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="display text-[48px]">Terms</h1>
      <p className="mt-4 text-[15px] text-[var(--text-dim)]">
        {brand.productName} is provided as an instant-play arcade. Don&apos;t cheat leaderboards. Don&apos;t harass
        other players. Local guest progress belongs to the browser profile that created it until you save an account.
      </p>
    </div>
  );
}
