import { useEffect, useState } from "react";
import { formatCountdown, msUntilUtcMidnight } from "@/lib/platform/format";

export function useUtcCountdown() {
  const [remain, setRemain] = useState(msUntilUtcMidnight());
  useEffect(() => {
    const t = window.setInterval(() => setRemain(msUntilUtcMidnight()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return { remain, label: formatCountdown(remain) };
}
