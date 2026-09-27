import { useSensorStore } from "@/stores/sensor-store";

const BOUNDS = { minLng: 77.54, maxLng: 77.68, minLat: 12.93, maxLat: 13.03 };

/** Click-to-place pin picker over the monitoring area. */
export function PinPicker({ value, onChange }: { value: { lng: number; lat: number }; onChange: (v: { lng: number; lat: number }) => void }) {
  const sensors = useSensorStore((s) => s.sensors);
  const x = (lng: number) => ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 400;
  const y = (lat: number) => 200 - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 200;
  return (
    <svg
      viewBox="0 0 400 200"
      className="h-40 w-full cursor-crosshair rounded-md border border-border bg-background"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * 400;
        const py = ((e.clientY - r.top) / r.height) * 200;
        onChange({
          lng: +(BOUNDS.minLng + (px / 400) * (BOUNDS.maxLng - BOUNDS.minLng)).toFixed(5),
          lat: +(BOUNDS.minLat + ((200 - py) / 200) * (BOUNDS.maxLat - BOUNDS.minLat)).toFixed(5),
        });
      }}
    >
      <path d="M0 140 C80 110 120 160 200 125 S320 70 400 100" className="fill-none stroke-chart-1/40" strokeWidth="10" />
      {sensors.map((s) => <circle key={s.id} cx={x(s.lng)} cy={y(s.lat)} r="3" className="fill-muted-foreground" />)}
      <g transform={`translate(${x(value.lng)} ${y(value.lat)})`}>
        <path d="M0 0 L-6 -12 A7 7 0 1 1 6 -12 Z" className="fill-primary" />
        <circle cy="-14" r="2.5" className="fill-background" />
      </g>
    </svg>
  );
}
