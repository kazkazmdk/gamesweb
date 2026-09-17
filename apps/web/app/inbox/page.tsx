"use client";

import { arcadeStore } from "@/lib/social/arcade-store";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function InboxPage() {
  const [, bump] = useState(0);
  useEffect(() => arcadeStore.subscribe(() => bump((n) => n + 1)), []);
  const items = arcadeStore.view().inbox;

  return (
    <div className="mx-auto max-w-2xl px-5 py-10" data-testid="inbox">
      <p className="meta text-white/45">Inbox</p>
      <h1 className="display mt-2 text-4xl">What needs a reply</h1>
      {items.length === 0 ? (
        <p className="mt-6 text-white/55">No messages yet. Challenges, rival updates, and party invites land here.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-white/10 p-4">
              <p className="text-[12px] text-white/40">{item.type}</p>
              <p className="mt-1 text-lg">{item.title}</p>
              <p className="text-white/60">{item.body}</p>
              <Link
                href={item.href}
                className="mt-3 inline-block text-[var(--accent)]"
                onClick={() => arcadeStore.markRead(item.id)}
              >
                Open
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
