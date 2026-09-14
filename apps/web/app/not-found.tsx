import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6 text-center">
      <div>
        <p className="display text-[56px]">Lost</p>
        <p className="mt-2 text-[var(--text-dim)]">That route is not part of the arcade.</p>
        <Link href="/" className="mt-6 inline-block text-[var(--text)]">
          Home
        </Link>
      </div>
    </div>
  );
}
