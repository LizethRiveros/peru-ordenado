import type { Shape } from "@/lib/shapes";

export const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

type Geo = { dist: Shape[]; prov: Shape[]; dep: Shape[] };

/**
 * gob.pe names look like "Municipalidad Distrital de Chilca - Huancayo - MDCH": a place, optional
 * qualifiers (province or department) and an acronym. Returns the IGN district ubigeo, or undefined
 * when the name is missing or stays ambiguous after the qualifiers.
 */
export function matchMunicipality(
  nombre: string,
  geo: Geo,
): string | undefined {
  const parts = nombre.split(/\s+-\s+/);
  const head = parts[0].match(
    /^Municipalidad\s+(Distrital|Provincial|Metropolitana)?\s*(?:de(?:l)?\s+)?(.+)$/i,
  );
  if (!head) return undefined;
  const provincial = /provincial|metropolitana/i.test(head[1] ?? "");
  const place = norm(head[2]);
  const qualifiers = parts.slice(1, -1).map(norm);
  const provName = new Map(geo.prov.map((p) => [p.id, norm(p.name)]));
  const depName = new Map(geo.dep.map((d) => [d.id, norm(d.name)]));

  if (provincial) {
    // "Morropón Chulucanas": province name, then its capital.
    const prov = geo.prov.filter(
      (p) => place === norm(p.name) || place.startsWith(norm(p.name)),
    );
    const best = prov.sort(
      (a, b) => norm(b.name).length - norm(a.name).length,
    )[0];
    return best ? `${best.id}01` : undefined;
  }
  let hits = geo.dist.filter((d) => norm(d.name) === place);
  // Province qualifiers are more specific than department ones ("Lima" is both).
  for (const scope of [
    (d: Shape) => provName.get(d.id.slice(0, 4)),
    (d: Shape) => depName.get(d.dep),
  ]) {
    if (hits.length <= 1 || !qualifiers.length) break;
    const q = hits.filter((d) => qualifiers.includes(scope(d) ?? ""));
    if (q.length) hits = q;
  }
  return hits.length === 1 ? hits[0].id : undefined;
}
