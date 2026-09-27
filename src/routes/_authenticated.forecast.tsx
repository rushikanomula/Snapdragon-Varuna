import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel } from "@/components/panel";
import { forecastQuery } from "@/lib/queries";
import { DROUGHT_THRESHOLD, FLOOD_THRESHOLD } from "@/lib/demo-data";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/forecast")({
  head: () => ({
    meta: [
      { title: "Hydrological Forecast — Varuna" },
      { name: "description", content: "7, 14 and 30-day river flow and flood-risk predictions from an on-device LSTM." },
      { property: "og:title", content: "Hydrological Forecast — Varuna" },
      { property: "og:description", content: "7, 14 and 30-day river flow and flood-risk predictions." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(forecastQuery(14)),
  component: Forecast,
});

const riskCls = { low: "bg-success/40", medium: "bg-warning/60", high: "bg-destructive/70" };
const axis = { fontSize: 10, fill: "var(--muted-foreground)" };

function Forecast() {
  const horizon = useAppStore((s) => s.horizon);
  const setHorizon = useAppStore((s) => s.setHorizon);
  const { data = [], isFetching } = useQuery({ ...forecastQuery(horizon), placeholderData: (p) => p });
  const future = data.filter((d) => d.actual === undefined);
  const peak = future.reduce((m, d) => Math.max(m, d.predicted ?? 0), 0);
  const highDays = future.filter((d) => d.risk === "high").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border border-border p-0.5">
          {([7, 14, 30] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={cn("rounded px-3 py-1 text-sm", h === horizon ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {h} days
            </button>
          ))}
        </div>
        {isFetching && <span className="text-xs text-muted-foreground">Running LSTM…</span>}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Peak flow", `${peak} m³/s`],
          ["High-risk days", String(highDays)],
          ["MAE", "11.4 m³/s"],
          ["RMSE", "16.9 m³/s"],
        ].map(([l, v]) => (
          <div key={l} className="rounded-lg border border-border bg-card/70 p-3">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="mt-1 font-mono text-xl font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <Panel title="River Flow · actual vs predicted (m³/s)">
        <div className="h-80">
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ left: 0, right: 8 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={axis} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tick={axis} width={36} domain={[0, 600]} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area dataKey="band" name="90% confidence" stroke="none" fill="var(--chart-2)" fillOpacity={0.2} />
              <Line dataKey="actual" name="Actual" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
              <Line dataKey="predicted" name="Predicted" stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              <ReferenceLine y={FLOOD_THRESHOLD} stroke="var(--destructive)" strokeDasharray="3 3" label={{ value: "Flood", fill: "var(--destructive)", fontSize: 10, position: "insideTopRight" }} />
              <ReferenceLine y={DROUGHT_THRESHOLD} stroke="var(--warning)" strokeDasharray="3 3" label={{ value: "Drought", fill: "var(--warning)", fontSize: 10, position: "insideBottomRight" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Risk Timeline">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {future.map((d) => (
            <div key={d.date} className="flex min-w-10 flex-1 flex-col items-center gap-1">
              <div className={cn("h-8 w-full rounded", riskCls[d.risk])} title={`${d.date}: ${d.risk}`} />
              <span className="whitespace-nowrap font-mono text-[10px] text-muted-foreground">{d.date}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Prediction Table">
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr><th className="py-1 text-left">Date</th><th className="text-right">Predicted</th><th className="text-right">Interval</th><th className="text-right">Risk</th></tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-xs">
              {future.map((d) => (
                <tr key={d.date}>
                  <td className="py-1.5">{d.date}</td>
                  <td className="text-right">{d.predicted}</td>
                  <td className="text-right text-muted-foreground">{d.band?.[0]}–{d.band?.[1]}</td>
                  <td className="text-right uppercase">{d.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
