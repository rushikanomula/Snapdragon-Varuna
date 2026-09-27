import { useEffect, useState } from "react";

export type NpuMode = "detecting" | "npu" | "cpu";

/** Detects WebNN availability and simulates live inference latency. */
export function useNpuStatus() {
  const [mode, setMode] = useState<NpuMode>("detecting");
  const [latency, setLatency] = useState(12);

  useEffect(() => {
    const hasWebNN = typeof navigator !== "undefined" && "ml" in navigator;
    // Demo: treat all devices as NPU-capable unless explicitly unsupported later.
    setMode(hasWebNN ? "npu" : "npu");
    const id = window.setInterval(() => {
      setLatency(Math.round(10 + Math.random() * 5));
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  return { mode, latency };
}
