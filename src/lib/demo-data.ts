// Demo dataset used until live Cloud data is connected.

export type ParamKey = "ph" | "turbidity" | "do" | "nitrate" | "lead" | "coliform";

export const PARAMS: Record<
  ParamKey,
  { label: string; unit: string; min?: number; max?: number; ideal: number; range: [number, number] }
> = {
  ph: { label: "pH", unit: "", min: 6.5, max: 8.5, ideal: 7.4, range: [0, 14] },
  turbidity: { label: "Turbidity", unit: "NTU", max: 5, ideal: 1, range: [0, 20] },
  do: { label: "Dissolved O₂", unit: "mg/L", min: 5, ideal: 8, range: [0, 14] },
  nitrate: { label: "Nitrate", unit: "mg/L", max: 50, ideal: 10, range: [0, 100] },
  lead: { label: "Lead (Pb)", unit: "mg/L", max: 0.01, ideal: 0.002, range: [0, 0.05] },
  coliform: { label: "Coliform", unit: "CFU/100mL", max: 1, ideal: 0, range: [0, 50] },
};

export type Reading = Record<ParamKey, number>;

export type Sensor = {
  id: string;
  name: string;
  type: "Water Quality" | "Flow Rate" | "Weather";
  lng: number;
  lat: number;
  status: "online" | "degraded" | "offline";
  battery: number;
  reading: Reading;
};

const base: Reading = { ph: 7.3, turbidity: 2.1, do: 7.6, nitrate: 18, lead: 0.004, coliform: 0 };

export const DEMO_SENSORS: Sensor[] = [
  { id: "WQ-101", name: "Upper Intake", type: "Water Quality", lng: 77.585, lat: 12.985, status: "online", battery: 92, reading: { ...base, ph: 8.9, turbidity: 4.2 } },
  { id: "WQ-102", name: "Reservoir North", type: "Water Quality", lng: 77.61, lat: 12.995, status: "online", battery: 81, reading: { ...base, do: 6.1, nitrate: 34 } },
  { id: "WQ-103", name: "Treatment Outlet", type: "Water Quality", lng: 77.632, lat: 12.97, status: "online", battery: 67, reading: base },
  { id: "WQ-104", name: "Canal Junction", type: "Water Quality", lng: 77.598, lat: 12.955, status: "degraded", battery: 23, reading: { ...base, turbidity: 7.8, coliform: 4, do: 4.6 } },
  { id: "FL-201", name: "River Gauge A", type: "Flow Rate", lng: 77.57, lat: 12.968, status: "online", battery: 88, reading: base },
  { id: "WQ-105", name: "Downstream Weir", type: "Water Quality", lng: 77.648, lat: 12.948, status: "online", battery: 74, reading: { ...base, lead: 0.013, nitrate: 41 } },
  { id: "WX-301", name: "Weather Mast", type: "Weather", lng: 77.62, lat: 13.01, status: "offline", battery: 5, reading: base },
];

export type Severity = "low" | "medium" | "critical";
export type Anomaly = {
  id: string;
  sensorId: string;
  severity: Severity;
  title: string;
  param: ParamKey;
  error: number; // reconstruction error
  at: number; // epoch ms
  acknowledged: boolean;
};

const now = Date.now();
export const DEMO_ANOMALIES: Anomaly[] = [
  { id: "A-9012", sensorId: "WQ-104", severity: "critical", title: "Coliform spike with DO drop", param: "coliform", error: 0.91, at: now - 4 * 60e3, acknowledged: false },
  { id: "A-9011", sensorId: "WQ-101", severity: "medium", title: "pH above 8.5 threshold", param: "ph", error: 0.58, at: now - 22 * 60e3, acknowledged: false },
  { id: "A-9010", sensorId: "WQ-105", severity: "medium", title: "Lead exceeds 0.01 mg/L", param: "lead", error: 0.52, at: now - 65 * 60e3, acknowledged: false },
  { id: "A-9009", sensorId: "WQ-102", severity: "low", title: "Nitrate drift upward", param: "nitrate", error: 0.24, at: now - 3 * 3600e3, acknowledged: true },
];

const ANOMALY_TEMPLATES: Omit<Anomaly, "id" | "at" | "acknowledged">[] = [
  { sensorId: "WQ-103", severity: "low", title: "Turbidity micro-fluctuation", param: "turbidity", error: 0.18 },
  { sensorId: "WQ-104", severity: "medium", title: "Dissolved O₂ below 5 mg/L", param: "do", error: 0.47 },
  { sensorId: "WQ-101", severity: "critical", title: "pH excursion > 9.0", param: "ph", error: 0.88 },
  { sensorId: "WQ-102", severity: "low", title: "Nitrate sensor noise", param: "nitrate", error: 0.21 },
];

let seq = 9013;
export function randomAnomaly(): Anomaly {
  const t = ANOMALY_TEMPLATES[Math.floor(Math.random() * ANOMALY_TEMPLATES.length)]!;
  return { ...t, id: `A-${seq++}`, at: Date.now(), acknowledged: false };
}

export const QUALITY_TREND = Array.from({ length: 30 }, (_, i) => ({
  day: `D-${29 - i}`,
  wqi: Math.round(78 + Math.sin(i / 4) * 5 - (i > 22 ? (i - 22) * 0.8 : 0)),
}));

export type ForecastPoint = {
  date: string;
  actual?: number;
  predicted?: number;
  band?: [number, number];
  risk: "low" | "medium" | "high";
};

export const FLOOD_THRESHOLD = 420;
export const DROUGHT_THRESHOLD = 140;

// Deterministic pseudo-LSTM output: history + horizon days of predictions.
export function buildForecast(horizon: 7 | 14 | 30): ForecastPoint[] {
  const pts: ForecastPoint[] = [];
  const start = new Date();
  for (let i = -21; i <= horizon; i++) {
    const d = new Date(start.getTime() + i * 86400e3);
    const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    const seasonal = 260 + 70 * Math.sin((i + 30) / 6) + (i > 3 && i < 12 ? (i - 3) * 16 : 0);
    if (i <= 0) {
      pts.push({ date, actual: Math.round(seasonal + ((i * 37) % 19) - 9), risk: "low" });
    } else {
      const spread = 12 + i * 3.2;
      const p = Math.round(seasonal);
      const risk = p + spread > FLOOD_THRESHOLD || p - spread < DROUGHT_THRESHOLD ? "high" : p > FLOOD_THRESHOLD * 0.85 ? "medium" : "low";
      pts.push({ date, predicted: p, band: [Math.round(p - spread), Math.round(p + spread)], risk });
    }
  }
  // stitch last actual to first prediction
  const last = pts.find((p, idx) => pts[idx + 1]?.predicted !== undefined && p.actual !== undefined);
  if (last && last.actual !== undefined) {
    last.predicted = last.actual;
    last.band = [last.actual, last.actual];
  }
  return pts;
}
