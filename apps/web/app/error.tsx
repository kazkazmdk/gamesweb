"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-[50vh] place-items-center px-6 text-center">
      <div>
        <p className="display text-[40px]">Something dropped</p>
        <p className="mt-2 text-[var(--text-dim)]">You can keep playing locally.</p>
        <button type="button" className="mt-6 rounded-full bg-[var(--text)] px-5 py-2 text-[var(--bg)]" onClick={reset}>
          Retry
        </button>
      </div>
    </div>
  );
}
