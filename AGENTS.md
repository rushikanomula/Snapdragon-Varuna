<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Global client state lives in Zustand (`src/stores/app-store.ts`, persist with skipHydration + rehydrate in AppShell) — avoids SSR hydration mismatches.
- Data reads go through TanStack Query options in `src/lib/queries.ts` (demo data now, swap to Cloud later) — components stay unchanged when the backend arrives.
- On-device AI runs via `src/lib/ai/engine.ts`: WebNN NPU → WebGPU → WASM, onnxruntime-web imported lazily in the browser; JS reference kernel used until model URLs are registered.
- Maps: Mapbox GL JS lazily loaded only when the public Mapbox token exists; schematic SVG fallback otherwise.
