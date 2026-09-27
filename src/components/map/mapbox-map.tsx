import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Sensor } from "@/lib/demo-data";

export default function MapboxMap({ sensors, token }: { sensors: Sensor[]; token: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [sensors[0]?.lng ?? 0, sensors[0]?.lat ?? 0],
      zoom: 12,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    sensors.forEach((s) => {
      new mapboxgl.Marker({ color: s.status === "online" ? "#0D9488" : s.status === "degraded" ? "#F59E0B" : "#94A3B8" })
        .setLngLat([s.lng, s.lat])
        .setPopup(new mapboxgl.Popup().setText(`${s.id} · ${s.name}`))
        .addTo(map);
    });
    return () => map.remove();
  }, [sensors, token]);
  return <div ref={ref} className="absolute inset-0" />;
}
