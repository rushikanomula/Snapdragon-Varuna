import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, ComposedChart, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ChevronLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel } from "@/components/panel";
import { Ago, BatteryBar, SignalBars, StatusBadge } from "@/components/sensors/sensor-bits";
import { PARAMS, type ParamKey } from "@/lib/demo-data";
import { buildHistory, DEMO_EPOCH, downloadFile, tagOutliers, toCsv, type Calibration, type TelemetryPoint } from "@/lib/sensors";
import { canDelete, useSensorStore } from "@/stores/sensor-store";

export const Route = createFileRoute("/_authenticated/sensors/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} · Sensor — Varuna` },
      { name: "description", content: `Live telemetry, history and calibration for sensor ${params.id}.` },
      { property: "og:title", content: `${params.id} · Sensor — Varuna` },
      { property: "og:description", content: `Live telemetry, history and calibration for sensor ${params.id}.` },
    ],
  }),
  component: SensorDetail,
});

const KEYS = Object.keys(PARAMS) as ParamKey[];
const axis = { fontSize: 10, fill: "var(--muted-foreground)" };
const tip = { background: "var(--popover)", border: "1px solid var(--border)", fontSize: 12 };
const day = 86400e3;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

function SensorDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const sensor = useSensorStore((s) => s.sensors.find((x) => x.id === id));
  const role = useSensorStore((s) => s.role);
  const removeSensors = useSensorStore((s) => s.removeSensors);
  const setCalibration = useSensorStore((s) => s.setCalibration);
  const [param, setParam] = useState<ParamKey>("ph");
  const [from, setFrom] = useState(iso(DEMO_EPOCH - 14 * day));
  const [to, setTo] = useState(iso(DEMO_EPOCH));
  const [live, setLive] = useState<TelemetryPoint[]>([]);
  const [cal, setCal] = useState<Calibration | null>(null);

  useEffect(() => { if (sensor) setCal(sensor.calibration); }, [sensor?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Simulated live stream (1 Hz) with outlier tagging
  useEffect(() => {
    if (!sensor || sensor.status === "offline") return;
    const base = sensor.reading[param];
    const start = Date.now();
    setLive(Array.from({ length: 30 }, (_, i) => ({ t: start - (30 - i) * 1000, value: +(base * (1 + (Math.random() - 0.5) * 0.04)).toFixed(3) })));
    const idHandle = setInterval(() => {
      setLive((pts) => {
        const glitch = Math.random() < 0.05;
        const v = base * (glitch ? 1.6 : 1 + (Math.random() - 0.5) * 0.04);
        return tagOutliers([...pts.slice(-59), { t: Date.now(), value: +v.toFixed(3) }]);
      });
    }, 1000);
    return () => clearInterval(idHandle);
  }, [sensor?.id, sensor?.status, param]); // eslint-disable-line react-hooks/exhaustive-deps

  const history = useMemo(() => {
    if (!sensor) return [];
    const f = new Date(from).getTime();
    const t = new Date(to).getTime() + day - 1;
    return f < t ? buildHistory(sensor, param, f, t) : [];
  }, [sensor, param, from, to]);
  const outliers = history.filter((p) => p.outlier);

  if (!sensor) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold">Sensor {id} not found</p>
        <Link to="/sensors" className="mt-3 inline-block text-sm text-primary hover:underline">Back to sensors</Link>
      </div>
    );
  }

  const isWQ = sensor.type === "Water Quality";
  const unit = PARAMS[param].unit;
  const fmt = (t: number) => new Date(t).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit" });

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/sensors" className="flex items-center hover:text-foreground"><ChevronLeft className="h-3.5 w-3.5" />Sensors</Link>
        <span>/</span><span className="font-mono text-foreground">{sensor.id}</span>
      </nav>

      <div className="flex flex-wrap items-start gap-3">
        <div className="mr-auto">
          <div className="flex items-center gap-2"><h2 className="text-xl font-semibold">{sensor.name}</h2><StatusBadge status={sensor.status} /></div>
          <p className="text-sm text-muted-foreground">{sensor.location}</p>
        </div>
        {isWQ && (
          <Select value={param} onValueChange={(v) => setParam(v as ParamKey)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>{KEYS.map((k) => <SelectItem key={k} value={k}>{PARAMS[k].label}</SelectItem>)}</SelectContent>
          </Select>
        )}
        {canDelete(role) && (
          <Button variant="outline" size="sm" className="text-destructive" onClick={() => { removeSensors([sensor.id]); toast.success(`${sensor.id} deleted`); navigate({ to: "/sensors" }); }}>
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Metadata">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            {[
              ["Sensor ID", sensor.id], ["Type", sensor.type], ["Protocol", sensor.protocol.toUpperCase()], ["Firmware", sensor.firmware],
              ["Coordinates", `${sensor.lat}, ${sensor.lng}`], ["Installed", sensor.installedAt], ["Last calibrated", sensor.calibratedAt ?? "Never"],
            ].map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="truncate font-mono text-xs leading-5">{v}</dd></div>
            ))}
            <dt className="text-muted-foreground">Last ping</dt><dd><Ago t={sensor.lastPingAt} /></dd>
            <dt className="text-muted-foreground">Battery</dt><dd><BatteryBar value={sensor.battery} /></dd>
            <dt className="text-muted-foreground">Signal</dt><dd><SignalBars value={sensor.signal} /></dd>
            {sensor.protocol === "mqtt" && <><dt className="text-muted-foreground">Topic</dt><dd className="truncate font-mono text-xs">{sensor.topic}</dd></>}
          </dl>
        </Panel>

        <Panel title={`Live stream · ${PARAMS[param].label}`} className="lg:col-span-2"
          action={sensor.status !== "offline" && <span className="flex items-center gap-1.5 text-xs text-primary"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />1 Hz</span>}>
          {sensor.status === "offline" ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Sensor offline — no live telemetry.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={live}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="t" tick={axis} tickFormatter={(t: number) => new Date(t).toLocaleTimeString("en-GB")} minTickGap={40} />
                  <YAxis tick={axis} width={44} domain={["auto", "auto"]} />
                  <Tooltip contentStyle={tip} labelFormatter={(t: number) => new Date(t).toLocaleTimeString("en-GB")} formatter={(v: number) => [`${v} ${unit}`, PARAMS[param].label]} />
                  <Line dataKey="value" stroke="var(--chart-1)" strokeWidth={2} isAnimationActive={false}
                    dot={(p: { cx?: number; cy?: number; payload?: TelemetryPoint; key?: string }) =>
                      p.payload?.outlier ? <circle key={p.key} cx={p.cx} cy={p.cy} r={4} fill="var(--destructive)" /> : <g key={p.key} />} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Historical data" action={
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-8 w-36 font-mono text-xs" aria-label="From date" />
          <span className="text-xs text-muted-foreground">→</span>
          <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="h-8 w-36 font-mono text-xs" aria-label="To date" />
          <Button size="sm" variant="outline" className="h-8" onClick={() =>
            downloadFile(`${sensor.id}-${param}-${from}_${to}.csv`, toCsv(history.map((p) => ({ timestamp: new Date(p.t).toISOString(), [param]: p.value, outlier: p.outlier ? "yes" : "no" }))))}>
            Export
          </Button>
        </div>
      }>
        {outliers.length > 0 && (
          <div className="mb-3 flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
            <AlertTriangle className="h-4 w-4 text-warning" />
            AI outlier check flagged <span className="font-mono">{outliers.length}</span> reading{outliers.length > 1 ? "s" : ""} as likely hardware faults (robust z-score &gt; 3.5).
          </div>
        )}
        <div className="h-64">
          <ResponsiveContainer>
            <ComposedChart data={history}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tick={axis} tickFormatter={fmt} minTickGap={50} />
              <YAxis tick={axis} width={44} domain={["auto", "auto"]} />
              <Tooltip contentStyle={tip} labelFormatter={fmt} />
              <Line dataKey="value" name={PARAMS[param].label} stroke="var(--chart-2)" strokeWidth={1.5} isAnimationActive={false}
                dot={(p: { cx?: number; cy?: number; payload?: TelemetryPoint; key?: string }) =>
                  p.payload?.outlier ? <circle key={p.key} cx={p.cx} cy={p.cy} r={4} fill="var(--destructive)" /> : <g key={p.key} />} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div id="calibration">
        <Panel title="Calibration" action={
          role !== "viewer" && cal && (
            <Button size="sm" onClick={() => { setCalibration(sensor.id, cal); toast.success("Calibration saved"); }}>
              <Save className="mr-1 h-4 w-4" /> Save calibration
            </Button>
          )
        }>
          <p className="mb-3 text-xs text-muted-foreground">Corrected value = raw × gain + offset. Applied before readings reach the on-device AI models.</p>
          {cal && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {(isWQ ? KEYS : KEYS.slice(0, 1)).map((k) => {
                const raw = sensor.reading[k];
                const corrected = raw * cal[k].gain + cal[k].offset;
                return (
                  <div key={k} className="rounded-md border border-border p-3">
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-medium">{PARAMS[k].label}</p>
                      <p className="font-mono text-xs text-muted-foreground">{raw} → <span className="text-foreground">{+corrected.toFixed(4)}</span></p>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {(["gain", "offset"] as const).map((f) => (
                        <div key={f} className="space-y-1">
                          <Label className="text-[11px] capitalize text-muted-foreground">{f}</Label>
                          <Input type="number" step="any" disabled={role === "viewer"} className="h-8 font-mono text-xs" value={cal[k][f]}
                            onChange={(e) => setCal({ ...cal, [k]: { ...cal[k], [f]: Number(e.target.value) } })} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
