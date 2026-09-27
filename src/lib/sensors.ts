import { DEMO_SENSORS, PARAMS, type ParamKey, type Reading, type Sensor } from "@/lib/demo-data";

export type Protocol = "mqtt" | "http" | "manual";
export type SensorStatus = "online" | "warning" | "offline";
export type Calibration = Record<ParamKey, { offset: number; gain: number }>;

export type SensorRecord = Omit<Sensor, "status"> & {
  status: SensorStatus;
  location: string;
  signal: number; // 0-100
  lastPingAt: number; // epoch ms
  protocol: Protocol;
  broker?: string;
  topic?: string;
  firmware: string;
  installedAt: string;
  calibratedAt: string | null;
  calibration: Calibration;
};

export const defaultCalibration = (): Calibration =>
  Object.fromEntries((Object.keys(PARAMS) as ParamKey[]).map((k) => [k, { offset: 0, gain: 1 }])) as Calibration;

const LOCATIONS: Record<string, string> = {
  "WQ-101": "Hebbal Intake, North Canal",
  "WQ-102": "Reservoir North Basin",
  "WQ-103": "Treatment Plant Outlet",
  "WQ-104": "Canal Junction C4",
  "FL-201": "River Gauge, Km 12",
  "WQ-105": "Downstream Weir",
  "WX-301": "Ridge Weather Mast",
};

// Fixed reference time so server and browser render identical demo values.
export const DEMO_EPOCH = Date.UTC(2026, 8, 27, 15, 0, 0);

export const DEMO_SENSOR_RECORDS: SensorRecord[] = DEMO_SENSORS.map((s, i) => ({
  ...s,
  status: s.status === "degraded" ? "warning" : s.status,
  location: LOCATIONS[s.id] ?? "Field site",
  signal: s.status === "offline" ? 0 : s.status === "degraded" ? 38 : 70 + ((i * 7) % 28),
  lastPingAt: DEMO_EPOCH - (s.status === "offline" ? 5 * 3600e3 : s.status === "degraded" ? 9 * 60e3 : (i + 1) * 20e3),
  protocol: s.type === "Weather" ? "http" : i % 3 === 2 ? "manual" : "mqtt",
  broker: "wss://broker.hivemq.com:8884/mqtt",
  topic: `varuna/${s.id.toLowerCase()}/telemetry`,
  firmware: `v2.${4 + (i % 3)}.1`,
  installedAt: "2025-11-0" + ((i % 8) + 1),
  calibratedAt: i % 2 ? "2026-08-14" : null,
  calibration: defaultCalibration(),
}));

export function lastThree(r: Reading, type: Sensor["type"]): { label: string; value: string }[] {
  if (type === "Flow Rate") return [{ label: "Flow", value: "284 m³/s" }, { label: "Level", value: "6.2 m" }, { label: "Velocity", value: "1.4 m/s" }];
  if (type === "Weather") return [{ label: "Rain", value: "3.1 mm" }, { label: "Temp", value: "24.6 °C" }, { label: "RH", value: "71 %" }];
  return [
    { label: "pH", value: String(r.ph) },
    { label: "Turb", value: `${r.turbidity} NTU` },
    { label: "DO", value: `${r.do} mg/L` },
  ];
}

export function timeAgo(t: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

// ---------- Telemetry & outlier tagging ----------

export type TelemetryPoint = { t: number; value: number; outlier?: boolean };

/** Deterministic history for a sensor/param between two dates (hourly). */
export function buildHistory(sensor: SensorRecord, param: ParamKey, from: number, to: number): TelemetryPoint[] {
  const base = sensor.reading[param];
  const seed = sensor.id.charCodeAt(3) + param.length;
  const pts: TelemetryPoint[] = [];
  const step = Math.max(3600e3, Math.round((to - from) / 240 / 3600e3) * 3600e3);
  for (let t = from, i = 0; t <= to; t += step, i++) {
    let v = base * (1 + 0.06 * Math.sin((i + seed) / 7) + 0.03 * Math.sin((i * seed) / 3));
    if ((i + seed) % 53 === 0) v = base * 1.9; // injected hardware glitch
    pts.push({ t, value: +v.toFixed(param === "lead" ? 4 : 2) });
  }
  return tagOutliers(pts);
}

/** Robust z-score (median/MAD) outlier tagging — flags likely faulty hardware readings. */
export function tagOutliers(pts: TelemetryPoint[], threshold = 3.5): TelemetryPoint[] {
  if (pts.length < 5) return pts;
  const vals = pts.map((p) => p.value).sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)]!;
  const devs = vals.map((v) => Math.abs(v - med)).sort((a, b) => a - b);
  const mad = devs[Math.floor(devs.length / 2)]! || 1e-9;
  return pts.map((p) => ({ ...p, outlier: Math.abs((0.6745 * (p.value - med)) / mad) > threshold }));
}

/** Tries a WebSocket handshake with the MQTT broker (mqtt subprotocol). */
export function testMqttConnection(url: string, timeoutMs = 6000): Promise<{ ok: boolean; message: string; ms: number }> {
  const t0 = performance.now();
  return new Promise((resolve) => {
    if (!/^wss?:\/\//.test(url)) {
      resolve({ ok: false, message: "Broker URL must start with ws:// or wss://", ms: 0 });
      return;
    }
    let ws: WebSocket;
    try {
      ws = new WebSocket(url, ["mqtt"]);
    } catch {
      resolve({ ok: false, message: "Invalid broker URL", ms: 0 });
      return;
    }
    const done = (ok: boolean, message: string) => {
      clearTimeout(timer);
      try { ws.close(); } catch { /* ignore */ }
      resolve({ ok, message, ms: Math.round(performance.now() - t0) });
    };
    const timer = setTimeout(() => done(false, "Timed out reaching broker"), timeoutMs);
    ws.onopen = () => done(true, "Broker reachable");
    ws.onerror = () => done(false, "Broker refused the connection");
  });
}

export function toCsv(rows: Record<string, string | number>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]!);
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c] ?? "")).join(","))].join("\n");
}

export function downloadFile(name: string, content: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
