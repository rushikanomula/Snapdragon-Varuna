import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, AlertTriangle, Droplets, Radio, Waves } from "lucide-react";
import { sensorsQuery, qualityTrendQuery } from "@/lib/queries";
import { Panel } from "@/components/panel";
import { WaterMap } from "@/components/map/water-map";
import { AnomalyFeed } from "@/components/anomaly-feed";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Varuna" },
      { name: "description", content: "Water quality index, active sensors, anomalies and forecast risk at a glance." },
      { property: "og:title", content: "Dashboard — Varuna" },
      { property: "og:description", content: "Water quality index, active sensors, anomalies and forecast risk at a glance." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(sensorsQuery), context.queryClient.ensureQueryData(qualityTrendQuery)]),
  component: Dashboard,
});

function Kpi({ label, value, sub, icon: Icon, tone }: { label: string; value: string; sub: string; icon: typeof Droplets; tone: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/70 p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {label}
        <Icon className={cn("h-4 w-4", tone)} />
      </div>
      <p className={cn("mt-2 font-mono text-3xl font-semibold", tone)}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Dashboard() {
  const { data: sensors } = useSuspenseQuery(sensorsQuery);
  const { data: trend } = useSuspenseQuery(qualityTrendQuery);
  const anomalies = useAppStore((s) => s.anomalies);
  const open = anomalies.filter((a) => !a.acknowledged);
  const critical = open.filter((a) => a.severity === "critical").length;
  const online = sensors.filter((s) => s.status !== "offline").length;

  return (
    <div className="space-y-4">
      {critical > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="flex-1">{critical} critical anomaly requires investigation.</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Water Quality Index" value="74" sub="Fair · −3 vs last week" icon={Droplets} tone="text-warning" />
        <Kpi label="Active Sensors" value={`${online}/${sensors.length}`} sub="1 degraded · 1 offline" icon={Radio} tone="text-primary" />
        <Kpi label="Active Anomalies" value={String(open.length)} sub={`${critical} critical`} icon={Activity} tone={critical ? "text-destructive" : "text-chart-1"} />
        <Kpi label="Forecast Risk" value="Med" sub="Flood watch in 6–9 days" icon={Waves} tone="text-warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Monitoring Network" className="lg:col-span-2">
          <WaterMap sensors={sensors} className="h-72 md:h-96" />
        </Panel>
        <Panel title="Live Anomaly Feed" action={<span className="flex items-center gap-1.5 text-xs text-primary"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />Streaming</span>}>
          <div className="max-h-96 overflow-y-auto"><AnomalyFeed /></div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Quality Index · 30 days" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="wqi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={4} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={30} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 12 }} />
                <Area dataKey="wqi" stroke="var(--chart-1)" fill="url(#wqi)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Quick Actions">
          <div className="grid gap-2">
            <Link to="/analysis" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">Run quality analysis</Link>
            <Link to="/forecast" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">View 14-day forecast</Link>
            <Link to="/sensors" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">Manage sensors</Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
