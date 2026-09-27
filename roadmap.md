# Varuna Build Roadmap

Phased plan for building Varuna, the AI-powered water-intelligence web app (dark scientific dashboard, Snapdragon/NPU-first narrative). Check off as phases complete.

## Phase 1 — Foundation (current)
- [x] Vite + React + TypeScript + Tailwind v4 + shadcn/ui project foundation (provided by stack)
- [x] Dark-mode design tokens: Midnight #070F1C, Deep Ocean #0A2540, Slate #1E3A5F, Teal #0D9488, Aqua #22D3EE, Warning/Critical/Success, text tokens
- [x] Typography: Inter (headings/UI) + JetBrains Mono (sensor readings, metrics), loaded via font link in root

## Phase 2 — Public shell
- [ ] Landing page `/` — hero, feature highlights, dashboard preview, Get Started / Sign In
- [ ] Login `/login`, Register `/register` (account + organization setup)
- [ ] 404 "Lost at Sea" page

## Phase 3 — Authenticated shell
- [ ] Top bar + collapsible sidebar (240px/64px, teal active route, state persisted)
- [ ] Onboarding `/onboarding` — device/NPU detection, model download, data source choice, summary

## Phase 4 — Core feature screens
- [ ] Dashboard `/dashboard` — KPI cards, map, anomaly feed, trend chart, NPU widget, alerts
- [ ] Quality Analysis `/analysis` — Live/Upload/Historical tabs, score gauge, heatmap, exports
- [ ] Forecast `/forecast` — 7/14/30-day selector, confidence bands, risk map/timeline, exports
- [ ] Anomalies `/anomalies` — live monitoring, severity timeline, investigation drawer
- [ ] Advisory `/advisory` — streaming chat, context sidebar, recommendation cards
- [ ] Sensors `/sensors` + `/sensors/:id` — grid, add/connection flows, detail charts
- [ ] Report Center `/report-center` — builder, schedules, share links
- [ ] Models `/models` — device status, catalog, benchmarks
- [ ] Settings `/settings`, Docs `/docs`

## Phase 5 — Backend & data
- [ ] Enable Lovable Cloud (auth, database, storage, functions)
- [ ] Schema: users/roles (RBAC), organizations, sensors, readings, anomalies, forecasts, reports
- [ ] AI gateway wiring for advisory/explanations
