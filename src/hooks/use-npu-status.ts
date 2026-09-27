import { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";
import { detectBackend } from "@/lib/ai/engine";

/** Runs hardware detection once per backend preference and exposes the runtime status. */
export function useNpuStatus() {
  const pref = useAppStore((s) => s.backendPref);
  const setRuntime = useAppStore((s) => s.setRuntime);
  const mode = useAppStore((s) => s.activeBackend);
  const latency = useAppStore((s) => s.lastLatencyMs);

  useEffect(() => {
    let cancelled = false;
    detectBackend(pref).then(({ backend, webnn }) => {
      if (!cancelled) setRuntime({ activeBackend: backend, webnn });
    });
    return () => {
      cancelled = true;
    };
  }, [pref, setRuntime]);

  return { mode, latency };
}
