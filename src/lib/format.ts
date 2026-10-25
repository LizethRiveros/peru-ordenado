const int = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("es-PE", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const km2 = (n: number) => `${int.format(n)} km²`;
export const soles = (n: number) => `S/ ${compact.format(n)}`;
export const pct = (r: number) => `${Math.round(r * 100)}%`;
export const count = (n: number) => int.format(n);
