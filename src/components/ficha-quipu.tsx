import type { FichaRow } from "@/lib/ficha";

const X0 = 28;
const STEP = 61;
const TOP = 12;
const MAX = 108;

/** A place as a quipu: one cord with a thread per layer; the longer the thread, the higher the place ranks. */
export function FichaQuipu({ rows }: { rows: FichaRow[] }) {
  return (
    <svg
      viewBox="0 0 320 188"
      role="img"
      aria-label={rows.map((r) => `${r.label}: ${r.text}`).join(". ")}
      className="w-full"
    >
      <path
        d={`M6 ${TOP}H314`}
        className="stroke-foreground/45"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      {rows.map((r, i) => {
        const x = X0 + i * STEP;
        const len = r.frac === null ? 12 : 22 + r.frac * MAX;
        return (
          <g key={r.key}>
            <g
              className="cord"
              style={{ animationDelay: `${i * 90}ms` }}
              fill="none"
            >
              <line
                x1={x}
                x2={x}
                y1={TOP}
                y2={TOP + len}
                className="stroke-foreground/45"
                strokeWidth="1.4"
                strokeDasharray={r.frac === null ? "2 3" : undefined}
              />
              {r.frac !== null && (
                <>
                  <circle
                    cx={x}
                    cy={TOP + len * 0.45}
                    r="2.2"
                    className="fill-foreground/35 stroke-none"
                  />
                  <circle
                    cx={x}
                    cy={TOP + len}
                    r="5.4"
                    className="fill-accent stroke-none"
                  />
                </>
              )}
              {r.frac === null && (
                <circle
                  cx={x}
                  cy={TOP + len}
                  r="4"
                  className="stroke-foreground/40"
                  strokeWidth="1.2"
                />
              )}
            </g>
            <text
              x={x}
              y="152"
              textAnchor="middle"
              className="fill-foreground font-display"
              style={{ fontSize: r.text === "sin dato" ? 11 : 19 }}
            >
              {r.text}
            </text>
            <text
              x={x}
              y="170"
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 9.5, letterSpacing: "0.02em" }}
            >
              {r.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
