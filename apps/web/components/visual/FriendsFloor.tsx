import type { ReactNode } from "react";
import { Avatar } from "@/components/shell/AppShell";
import { SeatIcon } from "./Icons";

export function FriendsFloor({
  name,
  avatar,
  action,
}: {
  name: string;
  avatar: string;
  action: ReactNode;
}) {
  return (
    <div className="gw-social-object">
      <div className="gw-social-motif" aria-hidden />
      <div className="relative grid items-center gap-5 p-5 md:grid-cols-[1fr_auto_1fr] md:gap-8 md:p-7">
        <div className="flex items-center gap-3">
          <Avatar id={avatar} size={56} />
          <div className="min-w-0">
            <p className="truncate text-[16px] text-white">{name}</p>
            <p className="mt-1 text-[12px] text-white/45">You</p>
          </div>
        </div>
        <p className="gw-versus justify-self-start md:justify-self-center">VS</p>
        <div className="flex items-center justify-start gap-3 md:justify-end">
          <div className="min-w-0 text-left md:text-right">
            <p className="text-[16px] text-white/70">Open seat</p>
            <p className="mt-1 text-[12px] text-white/40">Waiting on a real invite</p>
          </div>
          <span className="gw-empty-seat" aria-hidden>
            <SeatIcon size={20} />
          </span>
        </div>
      </div>
      <div className="relative border-t border-white/8 px-5 py-5 md:px-7">
        <p className="display text-[28px] text-white md:text-[36px]">No friends yet</p>
        <p className="mt-2 max-w-md text-[14px] text-white/60">
          Invite someone to chase a score. Presence only appears when they are actually here.
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-white/48">
          <li>Challenge</li>
          <li>Compare</li>
          <li>Rival</li>
          <li>Activity</li>
        </ul>
        <div className="mt-5">{action}</div>
      </div>
    </div>
  );
}
