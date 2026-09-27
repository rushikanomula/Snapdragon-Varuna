import { useState } from "react";
import { z } from "zod";
import { Loader2, Plus, Wifi } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PinPicker } from "./pin-picker";
import { useSensorStore } from "@/stores/sensor-store";
import { defaultCalibration, testMqttConnection, type Protocol } from "@/lib/sensors";
import type { Sensor } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(60),
  location: z.string().trim().min(2, "Location label is required").max(120),
  broker: z.string().trim().max(255).optional(),
});

const PREFIX: Record<Sensor["type"], string> = { "Water Quality": "WQ", "Flow Rate": "FL", Weather: "WX" };

export function AddSensorDialog() {
  const add = useSensorStore((s) => s.addSensor);
  const count = useSensorStore((s) => s.sensors.length);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<Sensor["type"]>("Water Quality");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [pos, setPos] = useState({ lng: 77.61, lat: 12.98 });
  const [protocol, setProtocol] = useState<Protocol>("mqtt");
  const [broker, setBroker] = useState("wss://broker.hivemq.com:8884/mqtt");
  const [topic, setTopic] = useState("varuna/new-node/telemetry");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [test, setTest] = useState<{ state: "idle" | "busy" | "ok" | "fail"; msg?: string }>({ state: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const runTest = async () => {
    setTest({ state: "busy" });
    const r = await testMqttConnection(broker);
    setTest({ state: r.ok ? "ok" : "fail", msg: `${r.message}${r.ms ? ` · ${r.ms}ms` : ""}` });
  };

  const submit = () => {
    const parsed = schema.safeParse({ name, location, broker });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    const id = `${PREFIX[type]}-${400 + count}`;
    add({
      id,
      name: parsed.data.name,
      type,
      lng: pos.lng,
      lat: pos.lat,
      location: parsed.data.location,
      status: protocol === "manual" ? "offline" : "online",
      battery: 100,
      signal: protocol === "manual" ? 0 : 85,
      lastPingAt: Date.now(),
      protocol,
      ...(protocol === "mqtt" ? { broker, topic } : {}),
      firmware: "v2.6.1",
      installedAt: new Date().toISOString().slice(0, 10),
      calibratedAt: null,
      calibration: defaultCalibration(),
      reading: { ph: 7.2, turbidity: 1.8, do: 7.9, nitrate: 12, lead: 0.003, coliform: 0 },
    });
    toast.success(`${id} registered`);
    setOpen(false);
    setName("");
    setLocation("");
    setErrors({});
    setTest({ state: "idle" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Sensor</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Register sensor</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5 sm:col-span-1">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="East Intake" maxLength={60} />
              {errors["name"] && <p className="text-xs text-destructive">{errors["name"]}</p>}
            </div>
            <div className="col-span-2 space-y-1.5 sm:col-span-1">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as Sensor["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Water Quality", "Flow Rate", "Weather"] as const).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Canal bridge, sector 7" maxLength={120} />
            {errors["location"] && <p className="text-xs text-destructive">{errors["location"]}</p>}
            <PinPicker value={pos} onChange={setPos} />
            <p className="font-mono text-xs text-muted-foreground">Pin: {pos.lat}, {pos.lng} · click the map to move</p>
          </div>
          <div className="space-y-1.5">
            <Label>Connection</Label>
            <div className="grid grid-cols-3 gap-1 rounded-md border border-border p-1">
              {(["mqtt", "http", "manual"] as const).map((p) => (
                <button key={p} type="button" onClick={() => setProtocol(p)}
                  className={cn("rounded py-1.5 text-sm", protocol === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {p === "mqtt" ? "MQTT" : p === "http" ? "HTTP webhook" : "Manual"}
                </button>
              ))}
            </div>
          </div>
          {protocol === "mqtt" && (
            <div className="space-y-3 rounded-md border border-border p-3">
              <div className="space-y-1.5"><Label>Broker URL</Label><Input className="font-mono" value={broker} onChange={(e) => { setBroker(e.target.value); setTest({ state: "idle" }); }} /></div>
              <div className="space-y-1.5"><Label>Topic</Label><Input className="font-mono" value={topic} onChange={(e) => setTopic(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Username</Label><Input value={user} onChange={(e) => setUser(e.target.value)} autoComplete="off" /></div>
                <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" /></div>
              </div>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="sm" onClick={runTest} disabled={test.state === "busy"}>
                  {test.state === "busy" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Wifi className="mr-1 h-4 w-4" />} Test connection
                </Button>
                {test.msg && <span className={cn("text-xs", test.state === "ok" ? "text-success" : "text-destructive")}>{test.msg}</span>}
              </div>
            </div>
          )}
          {protocol === "http" && (
            <div className="rounded-md border border-border p-3 text-sm">
              <p className="text-muted-foreground">Devices POST JSON readings to:</p>
              <p className="mt-1 break-all font-mono text-xs text-primary">/api/public/ingest/{PREFIX[type].toLowerCase()}-{400 + count}</p>
              <p className="mt-2 text-xs text-muted-foreground">A signing secret is issued once the sensor is saved to your workspace.</p>
            </div>
          )}
          {protocol === "manual" && <p className="text-sm text-muted-foreground">Readings will be entered by field staff or uploaded as CSV.</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Register sensor</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
