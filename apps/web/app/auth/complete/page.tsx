"use client";

import { analytics } from "@gamesweb/analytics";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useStore } from "@/lib/player";

function CompleteInner() {
  const store = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState("Merging guest progress…");

  useEffect(() => {
    let dead = false;
    (async () => {
      analytics.track("guest_merge_started");
      const next = params.get("next") || "/";
      try {
        await store.completeAuth();
        analytics.track("guest_merge_completed");
        analytics.track("auth_completed");
        if (!dead) router.replace(next.startsWith("/") ? next : "/");
      } catch {
        analytics.track("guest_merge_failed");
        if (!dead) {
          setStatus("Signed in, but guest merge could not finish. Local progress is still on this device.");
          setTimeout(() => router.replace("/me"), 1600);
        }
      }
    })();
    return () => {
      dead = true;
    };
  }, [params, router, store]);

  return <p className="px-5 py-16 text-[15px] text-[var(--text-dim)]">{status}</p>;
}

export default function AuthCompletePage() {
  return (
    <Suspense fallback={<p className="px-5 py-16">Signing in…</p>}>
      <CompleteInner />
    </Suspense>
  );
}
