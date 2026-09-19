"use client";

import { arcadeStore } from "@/lib/social/arcade-store";
import { useArcade } from "@/lib/social/use-arcade";
import { EmptyStateStage } from "@/components/visual";
import { ChamferButton } from "@/components/visual/ChamferButton";
import { useAccent } from "@/components/shell/AppShell";

const KIND: Record<string, string> = {
  challenge: "Challenge",
  friend: "Friend",
  rival: "Rival",
  party: "Party",
  crew: "Crew",
  leaderboard: "Board",
};

export default function InboxPage() {
  useAccent();
  const items = useArcade().inbox;
  const live = items.filter((i) => !i.read);
  const older = items.filter((i) => i.read);

  return (
    <div className="pb-16" data-testid="inbox">
      <div className="px-5 pt-8 md:px-10">
        <p className="meta text-white/45">Inbox</p>
        <h1 className="display mt-2 text-[44px] md:text-[64px]">Action queue</h1>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 px-5 md:px-10">
          <EmptyStateStage
            slug="knockout-circuit"
            kicker="Quiet"
            title="Nothing waiting"
            body="Challenges, crew notes, and party codes land here when someone actually sends one."
            action={<ChamferButton href="/friends">Find a rival</ChamferButton>}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-10 px-5 md:px-10">
          <Queue title="Needs a reply" items={live} />
          {older.length ? <Queue title="Earlier" items={older} quiet /> : null}
        </div>
      )}
    </div>
  );
}

function Queue({
  title,
  items,
  quiet,
}: {
  title: string;
  items: ReturnType<typeof useArcade>["inbox"];
  quiet?: boolean;
}) {
  if (!items.length) return null;
  return (
    <section>
      <p className="meta text-white/40">{title}</p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id} className={`gw-stage ${quiet ? "opacity-70" : "gw-frame"} p-4 md:p-5`}>
            <p className="meta text-white/45">{KIND[item.type] ?? item.type}</p>
            <p className="mt-2 text-[22px] tracking-[-0.03em] text-white">{item.title}</p>
            <p className="mt-1 text-[14px] text-white/60">{item.body}</p>
            <div className="mt-4">
              <ChamferButton href={item.href} onClick={() => arcadeStore.markRead(item.id)}>
                Open
              </ChamferButton>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
