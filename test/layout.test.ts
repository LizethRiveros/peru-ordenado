import { expect, test } from "bun:test";
import { gridLayout, mapLayout } from "@/lib/layout";
import type { Shape } from "@/lib/shapes";

const sq = (id: string, size: number, x = 0): Shape => ({
  id,
  name: id,
  dep: "01",
  area: size * size,
  bbox: [x, 0, x + size, size],
  d: "",
});

test("map layout fits the set and keeps one scale", () => {
  const places = mapLayout([sq("a", 10), sq("b", 10, 90)], {
    w: 200,
    h: 100,
    pad: 0,
  });
  expect(places.get("a")?.s).toBe(2);
  expect(places.get("a")?.x).toBe(10);
  expect(places.get("b")?.x).toBe(190);
});

test("grid layout keeps relative size and stays inside the box", () => {
  const order = [
    sq("big", 40),
    ...Array.from({ length: 30 }, (_, i) => sq(`s${i}`, 5)),
  ];
  const box = { w: 400, h: 300, pad: 10 };
  const places = gridLayout(order, box);
  const big = places.get("big");
  const small = places.get("s0");
  expect(big?.s).toBe(small?.s);
  for (const sh of order) {
    const p = places.get(sh.id);
    if (!p) throw new Error(sh.id);
    const half = ((sh.bbox[2] - sh.bbox[0]) * p.s) / 2;
    expect(p.x - half).toBeGreaterThanOrEqual(box.pad - 0.01);
    expect(p.x + half).toBeLessThanOrEqual(box.w - box.pad + 0.01);
    expect(p.y + half).toBeLessThanOrEqual(box.h - box.pad + 0.01);
  }
  expect(big?.y).toBeLessThan(small?.y ?? 0);
});

test("oklch converts to the expected sRGB", async () => {
  const { toRgb } = await import("@/lib/color");
  expect(toRgb("oklch(1 0 0)")).toBe("rgb(255,255,255)");
  expect(toRgb("oklch(0 0 0)")).toBe("rgb(0,0,0)");
  // oklch(0.628 0.2577 29.23) is sRGB red
  expect(toRgb("oklch(0.628 0.2577 29.23)")).toBe("rgb(255,0,0)");
});
