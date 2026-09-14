import { brand } from "@gamesweb/config";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="display text-[48px]">About</h1>
      <p className="mt-4 text-[16px] text-[var(--text-dim)]">
        {brand.productName} is a browser arcade. Play first, keep a streak, and carry one identity across Neon Drift,
        Velocity Run, and Swarm Protocol. This public beta is still being hardened — guest play works offline, while
        accounts, global boards, and friends need a configured backend.
      </p>
    </div>
  );
}
