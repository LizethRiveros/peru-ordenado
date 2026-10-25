import { expect, test } from "bun:test";
import type { Dataset } from "../src/lib/shapes";

const data: Dataset = await Bun.file("public/data/shapes.json").json();
const name = (level: "prov" | "dist", id: string) =>
  data[level].find((s) => s.id === id)?.name;

test("districts and provinces carry their accents", () => {
  expect(name("dist", "160106")).toBe("Mazán");
  expect(name("dist", "150102")).toBe("Ancón");
  expect(name("prov", "1001")).toBe("Huánuco");
});

test("no name has stray whitespace or broken characters", () => {
  for (const s of [...data.prov, ...data.dist]) {
    expect(s.name).toBe(s.name.trim());
    expect(s.name).not.toMatch(/\uFFFD|Ã/);
  }
});
