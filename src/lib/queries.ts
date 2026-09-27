import { queryOptions } from "@tanstack/react-query";
import { DEMO_SENSORS, QUALITY_TREND, buildForecast } from "@/lib/demo-data";

// Data layer. Query functions return the demo dataset today; swap bodies for Cloud reads
// once the backend is enabled — components and caching stay unchanged.
const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 150));

export const sensorsQuery = queryOptions({
  queryKey: ["sensors"],
  queryFn: () => delay(DEMO_SENSORS),
  staleTime: 30_000,
});

export const qualityTrendQuery = queryOptions({
  queryKey: ["quality-trend"],
  queryFn: () => delay(QUALITY_TREND),
  staleTime: 60_000,
});

export const forecastQuery = (horizon: 7 | 14 | 30) =>
  queryOptions({
    queryKey: ["forecast", horizon],
    queryFn: () => delay(buildForecast(horizon)),
    staleTime: 5 * 60_000,
  });
