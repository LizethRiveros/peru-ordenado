# Perú, ordenado

Unofficial Crafter Research prototype. The map of Peru taken apart: every department, province and district leaves its place and lines up in rows, at true relative scale, sorted by the criterion you pick. It is not a government site.

## Views

- **Mapa / Ordenado**: geographic positions, or rows sorted by the selected metric.
- **Nivel**: 25 departments, 196 provinces, 1,873 districts. Going down, children fly out of their parent; going up, they fold back into it.
- **Metric**: area (IGN), local-government investment budget (PIM, genérica 2.6), investment executed (devengado / PIM), share of investment in ornament (MEF project names classified by Jev), and muniscan's digital-surface index.
- **Historia**: an 8-step guided story with captions computed from the data (`src/lib/story.ts`), auto-advancing with pause, previous/next and arrow keys; the featured shapes get a ring and a callout. `?video` opens a chrome-free 4:5 stage that loops the story, for screen recording.

**Avance 2026 (quipu).** `bun data:quipu` adds, to every shape, the municipal investment (genérica 2.6) devengado up to the last closed month over PIM, plus the same figure for the previous year. Input: `data/raw/municipal-ubigeo.json`, produced by [`scripts/municipal_ubigeo.py`](https://github.com/crafter-station/quipu/blob/main/scripts/municipal_ubigeo.py) from the MEF `Gasto-Diario`/`Gasto-Mensual` zips. `QUIPU_MES` overrides the cutoff month (default: previous calendar month, so incomplete months are never compared).

State lives in the URL (`?nivel=dist&vista=ordenado&orden=ejecucion`).

## Data

```bash
bun data:geo          # IGN boundaries (2020) via OCHA HDX → data/raw
bun data:mef 2024     # streams the ~10 GB MEF spending CSV → data/raw/mef-municipal-2024.json
bun data:jev          # Jev classifies every project name (resumable) → data/raw/jev-projects.jsonl
bun data:build        # simplify, project, join → public/data/shapes.json
bun data:quipu       # avance del año en curso (inversión municipal) sobre shapes.json; ver abajo
```

Each provincial municipality reports under its capital district's ubigeo, so it counts there; provinces and departments sum their local governments. Districts created after 2020 are missing from the IGN layer.

Jev answers below 0.97 probability count as unsure and fade the shape in the ornament view. muniscan (`data/raw/muniscan-2026-08-21.json`, copied from crafter-research/muniscan) joins by municipality name; ambiguous names stay without data.

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
