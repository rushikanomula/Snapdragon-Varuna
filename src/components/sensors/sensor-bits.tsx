import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { timeAgo, type SensorStatus } from "@/lib/sensors";

const statusCls: Record<SensorStatus, string> = {
  online: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  offline: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: SensorStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize", statusCls[status])}>
      <span className={cn("h-1.5 w-1.5 rounded-full bg-current", status === "online" && "animate-pulse")} />
      {status}
    </span>
  );
}

export function BatteryBar({ value }: { value: number }) {
  const tone = value < 20 ? "bg-destructive" : value < 40 ? "bg-warning" : "bg-success";
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs" title={`Battery ${value}%`}>
      <span className="relative inline-block h-2.5 w-6 rounded-sm border border-muted-foreground/60 p-px">
        <span className={cn("block h-full rounded-[1px]", tone)} style={{ width: `${value}%` }} />
      </span>
      {value}%
    </span>
  );
}

export function SignalBars({ value }: { value: number }) {
  const bars = value === 0 ? 0 : Math.ceil(value / 25);
  return (
    <span className="inline-flex items-end gap-0.5" title={`Signal ${value}%`}>
      {[1, 2, 3, 4].map((b) => (
        <span key={b} className={cn("w-1 rounded-sm", b <= bars ? (bars <= 1 ? "bg-warning" : "bg-primary") : "bg-muted")} style={{ height: 3 + b * 3 }} />
      ))}
    </span>
  );
}

/** Relative time that only renders after mount to avoid server/browser mismatch. */
export function Ago({ t }: { t: number }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-xs text-muted-foreground">{now ? timeAgo(t, now) : "—"}</span>;
}
