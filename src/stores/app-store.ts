import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Anomaly, ParamKey, Reading } from "@/lib/demo-data";
import { DEMO_ANOMALIES } from "@/lib/demo-data";

export type BackendPref = "auto" | "npu" | "gpu" | "cpu";
export type ActiveBackend = "detecting" | "npu" | "gpu" | "cpu";

type AppState = {
  // AI runtime
  backendPref: BackendPref;
  activeBackend: ActiveBackend;
  webnn: boolean;
  lastLatencyMs: number | null;
  setBackendPref: (b: BackendPref) => void;
  setRuntime: (p: { activeBackend: ActiveBackend; webnn: boolean }) => void;
  recordLatency: (ms: number) => void;

  // Forecast
  horizon: 7 | 14 | 30;
  setHorizon: (h: 7 | 14 | 30) => void;

  // Analysis input
  analysisInput: Reading;
  setAnalysisParam: (k: ParamKey, v: number) => void;

  // Live anomaly feed
  anomalies: Anomaly[];
  pushAnomaly: (a: Anomaly) => void;
  acknowledge: (id: string) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      backendPref: "auto",
      activeBackend: "detecting",
      webnn: false,
      lastLatencyMs: null,
      setBackendPref: (backendPref) => set({ backendPref }),
      setRuntime: (p) => set(p),
      recordLatency: (ms) => set({ lastLatencyMs: ms }),

      horizon: 14,
      setHorizon: (horizon) => set({ horizon }),

      analysisInput: { ph: 8.9, turbidity: 6.1, do: 5.3, nitrate: 22, lead: 0.004, coliform: 0 },
      setAnalysisParam: (k, v) => set((s) => ({ analysisInput: { ...s.analysisInput, [k]: v } })),

      anomalies: DEMO_ANOMALIES,
      pushAnomaly: (a) => set((s) => ({ anomalies: [a, ...s.anomalies].slice(0, 50) })),
      acknowledge: (id) =>
        set((s) => ({ anomalies: s.anomalies.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)) })),
    }),
    {
      name: "varuna.app",
      skipHydration: true,
      partialize: (s) => ({ backendPref: s.backendPref, horizon: s.horizon }),
    },
  ),
);
