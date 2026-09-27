import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Cpu, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/panel";
import { PARAMS, type ParamKey } from "@/lib/demo-data";
import { analyzeQuality, type QualityResult, type ParamStatus } from "@/lib/ai/engine";
import { sensorsQuery } from "@/lib/queries";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/analysis")({
  head: () => ({
    meta: [
      { title: "Quality Analysis — Varuna" },
      { name: "description", content: "On-device NPU analysis of pH, turbidity, dissolved oxygen, nitrate, heavy metals and coliform." },
      { property: "og:title", content: "Quality Analysis — Varuna" },
      { property: "og:description", content: "On-device NPU analysis of six water-quality parameters." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(sensorsQuery),
  component: Analysis,
});

const KEYS = Object.keys(PARAMS) as ParamKey[];
const tone: Record<ParamStatus, string> = { good: "text-success", warning: "text-warning", critical: "text-destructive" };
const cell: Record<ParamStatus, string> = { good: "bg-success/25", warning: "bg-warning/35", critical: "bg-destructive/45" };

function Gauge({ score }: { score: number }) {
  const r = 80;
  const c = Math.PI * r;
  const s: ParamStatus = score >= 70 ? "good" : score >= 45 ? "warning" : "critical";
  return (
    <svg viewBox="0 0 200 120" className="w-full max-w-xs">
      <path d="M20 100 A80 80 0 0 1 180 100" className="fill-none stroke-muted" strokeWidth="14" strokeLinecap="round" />
      <path
        d="M20 100 A80 80 0 0 1 180 100"
        className={cn("fill-none stroke-current transition-all duration-700", tone[s])}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - score / 100)}
      />
      <text x="100" y="92" textAnchor="middle" className="fill-foreground font-mono" fontSize="36" fontWeight="600">{score}</text>
      <text x="100" y="112" textAnchor="middle" className="fill-muted-foreground" fontSize="10">/ 100 Quality Index</text>
    </svg>
  );
}

function Analysis() {
  const { data: sensors } = useSuspenseQuery(sensorsQuery);
  const input = useAppStore((s) => s.analysisInput);
  const setParam = useAppStore((s) => s.setAnalysisParam);
  const backend = useAppStore((s) => s.activeBackend);
  const record = useAppStore((s) => s.recordLatency);
  const [result, setResult] = useState<QualityResult | null>(null);
  const [heat, setHeat] = useState<Record<string, QualityResult>>({});
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (backend === "detecting") return;
    setBusy(true);
    const r = await analyzeQuality(input, backend);
    record(r.latencyMs);
    setResult(r);
    setBusy(false);
  };

  useEffect(() => {
    if (backend === "detecting") return;
    run();
    const wq = sensors.filter((s) => s.type === "Water Quality");
    Promise.all(wq.map((s) => analyzeQuality(s.reading, backend))).then((rs) =>
      setHeat(Object.fromEntries(wq.map((s, i) => [s.id, rs[i]]))),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Sample Parameters" action={
          <Button size="sm" onClick={run} disabled={busy || backend === "detecting"}>
            <Play className="mr-1 h-3.5 w-3.5" /> Analyze
          </Button>
        }>
          <div className="grid grid-cols-2 gap-3">
            {KEYS.map((k) => (
              <label key={k} className="space-y-1">
                <span className="text-xs text-muted-foreground">{PARAMS[k].label} {PARAMS[k].unit && `(${PARAMS[k].unit})`}</span>
                <Input
                  type="number"
                  step="any"
                  value={input[k]}
                  onChange={(e) => setParam(k, Number(e.target.value))}
                  className="font-mono"
                />
              </label>
            ))}
          </div>
        </Panel>

        <Panel title="Quality Score" className="flex flex-col items-center">
          {result ? (
            <>
              <Gauge score={result.score} />
              <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <Cpu className="h-3.5 w-3.5" /> {backend.toUpperCase()} · {result.latencyMs}ms · {result.mode === "onnx" ? "ONNX model" : "reference kernel"}
              </p>
            </>
          ) : (
            <p className="py-12 text-sm text-muted-foreground">Detecting hardware…</p>
          )}
        </Panel>

        <Panel title="Threshold Check">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {KEYS.map((k) => {
                const p = PARAMS[k];
                const st = result?.params[k].status ?? "good";
                return (
                  <tr key={k}>
                    <td className="py-1.5">{p.label}</td>
                    <td className="py-1.5 font-mono text-xs text-muted-foreground">
                      {p.min !== undefined && p.max !== undefined ? `${p.min}–${p.max}` : p.min !== undefined ? `≥ ${p.min}` : `≤ ${p.max}`}
                    </td>
                    <td className={cn("py-1.5 text-right text-xs font-semibold uppercase", tone[st])}>{st === "good" ? "OK" : st}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {KEYS.map((k) => {
          const r = result?.params[k];
          return (
            <div key={k} className="rounded-lg border border-border bg-card/70 p-3">
              <p className="text-xs text-muted-foreground">{PARAMS[k].label}</p>
              <p className={cn("mt-1 font-mono text-xl font-semibold", r && tone[r.status])}>
                {input[k]}<span className="ml-1 text-xs text-muted-foreground">{PARAMS[k].unit}</span>
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full bg-current transition-all", r && tone[r.status])} style={{ width: `${r?.sub ?? 0}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <Panel title="Network Heatmap · parameter sub-scores">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th className="text-left font-medium text-muted-foreground">Sensor</th>
                {KEYS.map((k) => <th key={k} className="font-medium text-muted-foreground">{PARAMS[k].label}</th>)}
                <th className="font-medium text-muted-foreground">WQI</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(heat).map(([id, r]) => (
                <tr key={id}>
                  <td className="font-mono">{id}</td>
                  {KEYS.map((k) => (
                    <td key={k} className={cn("rounded py-2 text-center font-mono", cell[r.params[k].status])}>{Math.round(r.params[k].sub)}</td>
                  ))}
                  <td className="text-center font-mono font-semibold">{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
