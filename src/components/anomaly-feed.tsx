import { useEffect } from "react";
import { Check } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { randomAnomaly, type Severity } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const sev: Record<Severity, string> = {
  low: "bg-chart-1/15 text-chart-1",
  medium: "bg-warning/15 text-warning",
  critical: "bg-destructive/15 text-destructive",
};

function ago(t: number) {
  const m = Math.round((Date.now() - t) / 60e3);
  return m < 1 ? "now" : m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`;
}

export function AnomalyFeed() {
  const anomalies = useAppStore((s) => s.anomalies);
  const push = useAppStore((s) => s.pushAnomaly);
  const ack = useAppStore((s) => s.acknowledge);

  // Simulated autoencoder stream
  useEffect(() => {
    const id = window.setInterval(() => push(randomAnomaly()), 15000);
    return () => window.clearInterval(id);
  }, [push]);

  return (
    <ul className="divide-y divide-border">
      {anomalies.slice(0, 8).map((a) => (
        <li key={a.id} className={cn("flex items-start gap-3 py-2.5 animate-in fade-in", a.acknowledged && "opacity-50")}>
          <span className={cn("mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", sev[a.severity])}>{a.severity}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{a.title}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {a.sensorId} · err {a.error.toFixed(2)} · {ago(a.at)}
            </p>
          </div>
          {!a.acknowledged && (
            <button onClick={() => ack(a.id)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Acknowledge">
              <Check className="h-4 w-4" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
