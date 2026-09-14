"use client";

import { analytics } from "@gamesweb/analytics";
import { brand } from "@gamesweb/config";
import { useState } from "react";
import { useStore } from "@/lib/player";

export default function AuthPage() {
  const store = useStore();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    analytics.track("signup_started");
    if (!configured) {
      const name = email.split("@")[0]?.replace(/[^a-z0-9]/gi, "").slice(0, 16) || "player";
      await store.mergeAccount(crypto.randomUUID(), name);
      setSent(true);
      return;
    }
    try {
      const res = await fetch("/api/player/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("auth failed");
      setSent(true);
    } catch {
      setError("Couldn't reach auth. Your local progress is still saved.");
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="display text-[44px]">Save your progress</h1>
      <p className="mt-3 text-[15px] text-[var(--text-dim)]">
        {brand.productName} keeps this device in sync first. An account is only for carrying records elsewhere.
      </p>
      {sent ? (
        <p className="mt-8 text-[15px]">
          {configured ? "Check your email for a sign-in link. Guest runs merge on first login." : "Progress locked to this name on this device."}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-[12px] text-[var(--text-faint)]">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-12 w-full rounded-xl border border-[var(--line)] bg-transparent px-3"
            />
          </label>
          <button type="submit" className="h-12 w-full rounded-full bg-[var(--text)] text-[var(--bg)]">
            Continue
          </button>
          {error ? <p className="text-[13px] text-[var(--danger)]">{error}</p> : null}
        </form>
      )}
    </div>
  );
}
