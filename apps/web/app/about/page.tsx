import { brand } from "@gamesweb/config";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="display text-[48px]">About</h1>
      <p className="mt-4 text-[16px] text-[var(--text-dim)]">
        {brand.productName} is a browser arcade. The platform is the meta-game: one identity, three launch titles, and a
        reason to start a second run.
      </p>
    </div>
  );
}
