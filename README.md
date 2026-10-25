# Perú, ordenado

Unofficial Crafter Research prototype. The map of Peru taken apart: every department, province and district leaves its place and lines up in rows, at true relative scale, sorted by the criterion you pick. It is not a government site.

## Views

- **Mapa / Ordenado**: geographic positions, or rows sorted by the selected metric.
- **Nivel**: 25 departments, 196 provinces, 1,873 districts. Going down, children fly out of their parent; going up, they fold back into it.
- **Metric**: area (IGN), local-government investment budget (PIM, genérica 2.6) and investment executed (devengado / PIM), MEF 2024.
- **Recorrido**: plays map → departments → provinces → districts and back. `?video` opens a chrome-free 4:5 stage that loops the tour, for screen recording.

State lives in the URL (`?nivel=dist&vista=ordenado&orden=ejecucion`).

## Data

```bash
bun data:geo          # IGN boundaries (2020) via OCHA HDX → data/raw
bun data:mef 2024     # streams the ~10 GB MEF spending CSV → data/raw/mef-municipal-2024.json
bun data:build        # simplify, project, join → public/data/shapes.json
```

Each provincial municipality reports under its capital district's ubigeo, so it counts there; provinces and departments sum their local governments. Districts created after 2020 are missing from the IGN layer.

## Run locally

```bash
bun install
bun dev
```

## Checks

```bash
bun test && bun typecheck && bunx biome check .
```

## License

Code: MIT (`LICENSE`). Boundaries: IGN via OCHA HDX, CC BY-IGO. Spending: MEF Datos Abiertos.
