import { brand } from "@gamesweb/config";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="display text-[48px]">About</h1>
      <p className="mt-4 text-[16px] text-[var(--text-dim)]">
        {brand.productName} is a browser arcade. Play first, keep a streak, and carry one identity across eight
        first-party games — from Neon Drift and Velocity Run to Swarm, Sky Stack, Knockout, Pocket, Territory, and
        Crowd. Guest play works offline; accounts, global boards, and friends need a configured backend.
      </p>
    </div>
  );
}
