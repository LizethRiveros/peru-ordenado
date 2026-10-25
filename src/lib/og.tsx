import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { colorFor, toRgb } from "@/lib/color";
import { gridLayout, mapLayout } from "@/lib/layout";
import { type Selection, selectionTitle } from "@/lib/selection";
import { type Dataset, value } from "@/lib/shapes";

export const ogSize = { width: 1200, height: 630 };
const asset = (f: string) =>
  readFile(path.join(process.cwd(), "src", "assets", f));

let dataset: Promise<Dataset> | undefined;
const loadData = () => {
  dataset ??= readFile(
    path.join(process.cwd(), "public", "data", "shapes.json"),
  ).then((b) => JSON.parse(b.toString()));
  return dataset;
};

const STAGE = { w: 640, h: 590 };

/** 1200×630 card: wordmark and title on the left, the selected view drawn on the right. */
export async function ogImage(sel: Selection) {
  const [data, serif, serifItalic, sans, sansMedium] = await Promise.all([
    loadData(),
    asset("fraunces-latin-400-normal.ttf"),
    asset("fraunces-latin-300-italic.ttf"),
    asset("inter-latin-400-normal.ttf"),
    asset("inter-latin-500-normal.ttf"),
  ]);
  const shapes = data[sel.level];
  const box = { ...STAGE, pad: 16 };
  const places =
    sel.view === "mapa"
      ? mapLayout(shapes, box)
      : gridLayout(
          [...shapes].sort(
            (a, b) =>
              (value(b, sel.metric) ?? -1) - (value(a, sel.metric) ?? -1),
          ),
          box,
        );
  const pims = shapes.flatMap((s) => (s.inv ? [s.inv.pim] : []));
  const range: [number, number] = [
    Math.max(1, Math.min(...pims)),
    Math.max(2, ...pims),
  ];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#f7f3ea",
        color: "#2a2520",
        fontFamily: "Inter",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 540,
          padding: "56px 0 52px 60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            fontWeight: 500,
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="1" y="1" width="22" height="22" rx="7" fill="#e6e0d2" />
            <path
              d="M7 6h4v5H7zM13 6h4v3h-4zM13 11h4v7h-4zM7 13h4v5H7z"
              fill="#2f7a4a"
            />
          </svg>
          peru-ordenado
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Fraunces",
              fontSize: 66,
              lineHeight: 1,
            }}
          >
            Perú,&nbsp;
            <span style={{ fontStyle: "italic", fontWeight: 300 }}>
              ordenado
            </span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              lineHeight: 1.35,
              color: "#5c544a",
              textTransform: "uppercase",
              letterSpacing: 1.5,
              maxWidth: 440,
            }}
          >
            {selectionTitle(sel, shapes.length)}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 17, color: "#857b6e" }}>
          Crafter Research · datos IGN, MEF y muniscan
        </div>
      </div>
      <svg
        width={STAGE.w}
        height={STAGE.h}
        viewBox={`0 0 ${STAGE.w} ${STAGE.h}`}
        style={{ marginTop: 20 }}
        aria-hidden="true"
      >
        {shapes.map((s) => {
          const p = places.get(s.id);
          if (!p) return null;
          const cx = (s.bbox[0] + s.bbox[2]) / 2;
          const cy = (s.bbox[1] + s.bbox[3]) / 2;
          return (
            <path
              key={s.id}
              d={s.d}
              fill={toRgb(colorFor(s, sel.metric, sel.level !== "dep", range))}
              transform={`translate(${(p.x - cx * p.s).toFixed(1)} ${(p.y - cy * p.s).toFixed(1)}) scale(${p.s.toFixed(4)})`}
            />
          );
        })}
      </svg>
    </div>,
    {
      ...ogSize,
      fonts: [
        { name: "Fraunces", data: serif, weight: 400, style: "normal" },
        { name: "Fraunces", data: serifItalic, weight: 300, style: "italic" },
        { name: "Inter", data: sans, weight: 400, style: "normal" },
        { name: "Inter", data: sansMedium, weight: 500, style: "normal" },
      ],
    },
  );
}
