import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, LayoutGrid, List, Map as MapIcon, Search, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WaterMap } from "@/components/map/water-map";
import { AddSensorDialog } from "@/components/sensors/add-sensor-dialog";
import { Ago, BatteryBar, SignalBars, StatusBadge } from "@/components/sensors/sensor-bits";
import { ROLE_LABEL, canDelete, useSensorStore, type Role } from "@/stores/sensor-store";
import { downloadFile, lastThree, toCsv, type SensorRecord } from "@/lib/sensors";
import type { Sensor } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/sensors/")({
  head: () => ({
    meta: [
      { title: "Sensor Management — Varuna" },
      { name: "description", content: "Register, monitor and configure field-deployed water sensors: health, battery, signal and live readings." },
      { property: "og:title", content: "Sensor Management — Varuna" },
      { property: "og:description", content: "Register, monitor and configure field-deployed water sensors." },
    ],
  }),
  component: SensorsPage,
});

type View = "grid" | "list" | "map";

export const toMapSensor = (s: SensorRecord): Sensor => ({ ...s, status: s.status === "warning" ? "degraded" : s.status });

function SensorsPage() {
  const { sensors, role, setRole, removeSensors } = useSensorStore();
  const [view, setView] = useState<View>("grid");
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const admin = canDelete(role);

  const filtered = useMemo(
    () =>
      sensors.filter(
        (s) =>
          (type === "all" || s.type === type) &&
          `${s.id} ${s.name} ${s.location}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [sensors, q, type],
  );
  const counts = {
    online: sensors.filter((s) => s.status === "online").length,
    warning: sensors.filter((s) => s.status === "warning").length,
    offline: sensors.filter((s) => s.status === "offline").length,
  };
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const allSelected = filtered.length > 0 && filtered.every((s) => selected.includes(s.id));

  const exportSelected = () => {
    const rows = sensors
      .filter((s) => selected.includes(s.id))
      .map((s) => ({ id: s.id, name: s.name, type: s.type, location: s.location, status: s.status, battery: s.battery, signal: s.signal, lat: s.lat, lng: s.lng, ...s.reading }));
    downloadFile(`varuna-sensors-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
    toast.success(`Exported ${rows.length} sensors`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h2 className="text-xl font-semibold">Sensor Management</h2>
          <p className="font-mono text-xs text-muted-foreground">
            <span className="text-success">{counts.online} online</span> · <span className="text-warning">{counts.warning} warning</span> · {counts.offline} offline
          </p>
        </div>
        <Select value={role} onValueChange={(v) => { setRole(v as Role); setSelected([]); }}>
          <SelectTrigger className="h-9 w-48 text-xs" aria-label="Preview as role"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <SelectItem key={r} value={r}>Preview as: {ROLE_LABEL[r]}</SelectItem>)}
          </SelectContent>
        </Select>
        {role !== "viewer" && <AddSensorDialog />}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID, name or location" className="pl-8" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="Water Quality">Water Quality</SelectItem>
            <SelectItem value="Flow Rate">Flow Rate</SelectItem>
            <SelectItem value="Weather">Weather</SelectItem>
          </SelectContent>
        </Select>
        <div className="inline-flex rounded-md border border-border p-0.5">
          {([["grid", LayoutGrid], ["list", List], ["map", MapIcon]] as const).map(([v, Icon]) => (
            <button key={v} onClick={() => setView(v)} aria-label={`${v} view`}
              className={cn("rounded px-2.5 py-1.5", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {selected.length > 0 && view !== "map" && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
          <span className="mr-auto font-mono">{selected.length} selected</span>
          <Button size="sm" variant="outline" onClick={exportSelected}><Download className="mr-1 h-4 w-4" /> Export CSV</Button>
          {admin && <Button size="sm" variant="destructive" onClick={() => setConfirm(true)}><Trash2 className="mr-1 h-4 w-4" /> Delete</Button>}
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
        </div>
      )}

      {view === "grid" && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((s) => (
            <article key={s.id} className={cn("flex flex-col rounded-lg border bg-card/70 p-4 transition-colors", selected.includes(s.id) ? "border-primary" : "border-border")}>
              <div className="flex items-start gap-2">
                <Checkbox checked={selected.includes(s.id)} onCheckedChange={() => toggle(s.id)} aria-label={`Select ${s.id}`} className="mt-1" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-muted-foreground">{s.id} · {s.type}</p>
                  <h3 className="truncate font-semibold">{s.name}</h3>
                  <p className="truncate text-xs text-muted-foreground">{s.location}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div className="mt-3 flex items-center justify-between border-y border-border py-2">
                <Ago t={s.lastPingAt} />
                <div className="flex items-center gap-3"><BatteryBar value={s.battery} /><SignalBars value={s.signal} /></div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {lastThree(s.reading, s.type).map((r) => (
                  <div key={r.label} className="rounded bg-background/60 px-2 py-1.5">
                    <p className="text-[10px] text-muted-foreground">{r.label}</p>
                    <p className="truncate font-mono text-sm">{r.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1"><Link to="/sensors/$id" params={{ id: s.id }}>View Details</Link></Button>
                <Button asChild size="sm" variant="ghost" className="flex-1"><Link to="/sensors/$id" params={{ id: s.id }} hash="calibration"><Settings2 className="mr-1 h-4 w-4" />Configure</Link></Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {view === "list" && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card/70">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground">
              <tr>
                <th className="w-10 p-3"><Checkbox checked={allSelected} onCheckedChange={() => setSelected(allSelected ? [] : filtered.map((s) => s.id))} aria-label="Select all" /></th>
                <th className="p-3">Sensor</th><th className="p-3">Type</th><th className="p-3">Location</th><th className="p-3">Status</th>
                <th className="p-3">Last ping</th><th className="p-3">Battery</th><th className="p-3">Signal</th><th className="p-3">Protocol</th><th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className={cn("hover:bg-accent/40", selected.includes(s.id) && "bg-primary/5")}>
                  <td className="p-3"><Checkbox checked={selected.includes(s.id)} onCheckedChange={() => toggle(s.id)} aria-label={`Select ${s.id}`} /></td>
                  <td className="p-3"><span className="font-mono text-xs text-muted-foreground">{s.id}</span><br />{s.name}</td>
                  <td className="p-3 text-xs">{s.type}</td>
                  <td className="p-3 text-xs text-muted-foreground">{s.location}</td>
                  <td className="p-3"><StatusBadge status={s.status} /></td>
                  <td className="p-3"><Ago t={s.lastPingAt} /></td>
                  <td className="p-3"><BatteryBar value={s.battery} /></td>
                  <td className="p-3"><SignalBars value={s.signal} /></td>
                  <td className="p-3 font-mono text-xs uppercase">{s.protocol}</td>
                  <td className="p-3 text-right"><Link to="/sensors/$id" params={{ id: s.id }} className="text-xs text-primary hover:underline">Details</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "map" && <WaterMap sensors={filtered.map(toMapSensor)} className="h-[520px]" />}

      {filtered.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No sensors match your filters.</p>}

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.length} sensor{selected.length > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the devices and stops their telemetry ingestion. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { removeSensors(selected); toast.success(`Deleted ${selected.length} sensors`); setSelected([]); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
