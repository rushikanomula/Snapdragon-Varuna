/**
 * On-device inference engine.
 * - Detects WebNN (NPU), WebGPU and falls back to WASM/CPU.
 * - Loads quantized ONNX models via ONNX Runtime Web (browser-only, lazy import).
 * - When no model file is registered yet, runs a JS reference kernel so the UI stays functional.
 */
import type * as Ort from "onnxruntime-web";
import { PARAMS, type ParamKey, type Reading } from "@/lib/demo-data";
import type { ActiveBackend, BackendPref } from "@/stores/app-store";

export type ModelId = "wq-classifier" | "flow-lstm" | "anomaly-ae";

/** Model registry — set `url` to a hosted Qualcomm AI Hub / HF ONNX export to enable real inference. */
export const MODELS: Record<ModelId, { name: string; precision: "INT8" | "FP16"; url: string | null }> = {
  "wq-classifier": { name: "Water Quality Classifier", precision: "INT8", url: null },
  "flow-lstm": { name: "Hydro LSTM Forecaster", precision: "INT8", url: null },
  "anomaly-ae": { name: "Sensor Autoencoder", precision: "INT8", url: null },
};

type NavigatorML = Navigator & {
  ml?: { createContext: (o?: { deviceType?: string }) => Promise<unknown> };
  gpu?: { requestAdapter: () => Promise<unknown | null> };
};

export async function detectBackend(pref: BackendPref): Promise<{ backend: Exclude<ActiveBackend, "detecting">; webnn: boolean }> {
  const nav = navigator as NavigatorML;
  let npu = false;
  let gpu = false;
  const webnn = !!nav.ml;
  if (nav.ml && (pref === "auto" || pref === "npu")) {
    try {
      await nav.ml.createContext({ deviceType: "npu" });
      npu = true;
    } catch {
      npu = false;
    }
  }
  if (nav.gpu && (pref === "auto" || pref === "gpu" || !npu)) {
    try {
      gpu = !!(await nav.gpu.requestAdapter());
    } catch {
      gpu = false;
    }
  }
  if (pref === "cpu") return { backend: "cpu", webnn };
  if (npu && pref !== "gpu") return { backend: "npu", webnn };
  if (gpu && pref !== "npu") return { backend: "gpu", webnn };
  return { backend: "cpu", webnn };
}

function providersFor(backend: Exclude<ActiveBackend, "detecting">): Ort.InferenceSession.ExecutionProviderConfig[] {
  if (backend === "npu") return [{ name: "webnn", deviceType: "npu" } as Ort.InferenceSession.ExecutionProviderConfig, "wasm"];
  if (backend === "gpu") return ["webgpu", "wasm"];
  return ["wasm"];
}

const sessions = new Map<ModelId, Ort.InferenceSession>();

export async function loadModel(id: ModelId, backend: Exclude<ActiveBackend, "detecting">) {
  const url = MODELS[id].url;
  if (!url) return null;
  if (sessions.has(id)) return sessions.get(id)!;
  const ort = await import("onnxruntime-web");
  const session = await ort.InferenceSession.create(url, { executionProviders: providersFor(backend) });
  sessions.set(id, session);
  return session;
}

// ---------- Water quality ----------

export type ParamStatus = "good" | "warning" | "critical";
export type QualityResult = {
  score: number;
  params: Record<ParamKey, { value: number; sub: number; status: ParamStatus }>;
  latencyMs: number;
  mode: "onnx" | "reference";
};

function subScore(k: ParamKey, v: number): number {
  const p = PARAMS[k];
  const [lo, hi] = p.range;
  if (p.min !== undefined && v < p.min) return Math.max(0, 60 * ((v - lo) / (p.min - lo)));
  if (p.max !== undefined && v > p.max) return Math.max(0, 60 - 60 * ((v - p.max) / (hi - p.max)));
  const span = p.max !== undefined && p.min !== undefined ? (p.max - p.min) / 2 : Math.abs((p.max ?? p.min ?? p.ideal * 2) - p.ideal) || 1;
  return Math.max(60, 100 - 40 * Math.min(1, Math.abs(v - p.ideal) / span));
}

const status = (s: number): ParamStatus => (s >= 70 ? "good" : s >= 45 ? "warning" : "critical");

export async function analyzeQuality(input: Reading, backend: Exclude<ActiveBackend, "detecting">): Promise<QualityResult> {
  const t0 = performance.now();
  const session = await loadModel("wq-classifier", backend).catch(() => null);
  const keys = Object.keys(PARAMS) as ParamKey[];
  let score: number;
  let mode: QualityResult["mode"] = "reference";
  const params = {} as QualityResult["params"];
  keys.forEach((k) => {
    const sub = subScore(k, input[k]);
    params[k] = { value: input[k], sub, status: status(sub) };
  });

  if (session) {
    const ort = await import("onnxruntime-web");
    const tensor = new ort.Tensor("float32", Float32Array.from(keys.map((k) => input[k])), [1, keys.length]);
    const inName = session.inputNames[0] ?? "input";
    const outName = session.outputNames[0] ?? "output";
    const out = await session.run({ [inName]: tensor });
    score = Math.round(Number((out[outName]!.data as Float32Array)[0]));
    mode = "onnx";
  } else {
    const weights: Record<ParamKey, number> = { ph: 1.2, turbidity: 1, do: 1.1, nitrate: 0.9, lead: 1.2, coliform: 1.3 };
    const tot = keys.reduce((a, k) => a + weights[k], 0);
    score = Math.round(keys.reduce((a, k) => a + params[k].sub * weights[k], 0) / tot);
  }
  return { score, params, latencyMs: +(performance.now() - t0).toFixed(1), mode };
}
