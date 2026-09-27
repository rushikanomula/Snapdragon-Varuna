import { lazy, Suspense, useEffect, useState } from "react";
import type { Sensor } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const MapboxMap = lazy(() => import("./mapbox-map"));
const TOKEN = import.meta.env['VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN'] as string | undefined;

/** Uses Mapbox GL JS when a public token is configured; otherwise a schematic fallback map. */
export function WaterMap({ sensors, className }: { sensors: Sensor[]; className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-border bg-background", className)}>
      {mounted && TOKEN ? (
        <Suspense fallback={null}>
          <MapboxMap sensors={sensors} token={TOKEN} />
        </Suspense>
      ) : (
        <SchematicMap sensors={sensors} />
      )}
    </div>
  );
}

const statusFill: Record<Sensor["status"], string> = {
  online: "fill-primary",
  degraded: "fill-warning",
  offline: "fill-muted-foreground",
};

function SchematicMap({ sensors }: { sensors: Sensor[] }) {
  const lngs = sensors.map((s) => s.lng);
  const lats = sensors.map((s) => s.lat);
  const [minX, maxX, minY, maxY] = [Math.min(...lngs), Math.max(...lngs), Math.min(...lats), Math.max(...lats)];
  const x = (v: number) => 40 + ((v - minX) / (maxX - minX || 1)) * 520;
  const y = (v: number) => 260 - ((v - minY) / (maxY - minY || 1)) * 220;
  return (
    <svg viewBox="0 0 600 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M30 0H0V30" className="fill-none stroke-border" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="600" height="300" fill="url(#grid)" />
      <path d="M0 210 C120 170 180 240 300 190 S480 110 600 150" className="fill-none stroke-chart-1/40" strokeWidth="14" strokeLinecap="round" />
      <ellipse cx="340" cy="70" rx="70" ry="28" className="fill-chart-1/15 stroke-chart-1/40" />
      <circle cx={x(77.598)} cy={y(12.955)} r="48" className="fill-destructive/10 stroke-destructive/40" strokeDasharray="4 4" />
      {sensors.map((s) => (
        <g key={s.id}>
          <circle cx={x(s.lng)} cy={y(s.lat)} r="6" className={statusFill[s.status]} />
          <text x={x(s.lng) + 9} y={y(s.lat) + 4} className="fill-muted-foreground font-mono" fontSize="10">
            {s.id}
          </text>
        </g>
      ))}
      <text x="12" y="290" className="fill-muted-foreground" fontSize="10">
        Schematic view · connect Mapbox for live basemap
      </text>
    </svg>
  );
}
