// Streams MEF "Presupuesto y Ejecución de Gasto" (~10 GB CSV) and keeps one row per municipality:
// PIM and devengado in total and for genérica 2.6 (investment), plus each investment project per
// district. Writes data/raw/mef-municipal-<year>.json and data/raw/mef-projects-<year>.json.
const year = process.argv[2] ?? "2024";
const url = `https://fs.datosabiertos.mef.gob.pe/datastorefiles/${year}-Gasto.csv`;

type Row = {
  sec: string;
  nombre: string;
  dep: string;
  prov: string;
  dist: string;
  pia: number;
  pim: number;
  dev: number;
  invPim: number;
  invDev: number;
};

/** One CSV line into fields; MEF quotes every field and doubles inner quotes. */
export function parseLine(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let j = i + 1;
      let s = "";
      while (j < line.length) {
        if (line[j] === '"') {
          if (line[j + 1] === '"') {
            s += '"';
            j += 2;
            continue;
          }
          break;
        }
        s += line[j++];
      }
      out.push(s);
      i = j + 2;
    } else {
      const j = line.indexOf(",", i);
      const e = j < 0 ? line.length : j;
      out.push(line.slice(i, e));
      i = e + 1;
    }
  }
  return out;
}

if (import.meta.main) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`${url} → ${res.status}`);
  const dec = new TextDecoder();
  const acc = new Map<string, Row>();
  const projects = new Map<
    string,
    {
      ub: string;
      code: string;
      name: string;
      funcion: string;
      pim: number;
      dev: number;
    }
  >();
  const col: Record<string, number> = {};
  let buf = "";
  let header = false;
  let rows = 0;
  for await (const chunk of res.body) {
    buf += dec.decode(chunk, { stream: true });
    let k = buf.indexOf("\n");
    while (k >= 0) {
      const line = buf.slice(0, k).replace(/\r$/, "");
      buf = buf.slice(k + 1);
      k = buf.indexOf("\n");
      if (!header) {
        parseLine(line).forEach((h, i) => {
          col[h] = i;
        });
        header = true;
        continue;
      }
      if (!line.includes('"M","GOBIERNOS LOCALES"')) continue;
      const f = parseLine(line);
      rows++;
      const sec = f[col.SEC_EJEC];
      let a = acc.get(sec);
      if (!a) {
        a = {
          sec,
          nombre: f[col.EJECUTORA_NOMBRE],
          dep: f[col.DEPARTAMENTO_EJECUTORA],
          prov: f[col.PROVINCIA_EJECUTORA],
          dist: f[col.DISTRITO_EJECUTORA],
          pia: 0,
          pim: 0,
          dev: 0,
          invPim: 0,
          invDev: 0,
        };
        acc.set(sec, a);
      }
      const pim = Number(f[col.MONTO_PIM]) || 0;
      const dev = Number(f[col.MONTO_DEVENGADO]) || 0;
      a.pia += Number(f[col.MONTO_PIA]) || 0;
      a.pim += pim;
      a.dev += dev;
      if (f[col.GENERICA] === "6") {
        a.invPim += pim;
        a.invDev += dev;
        const ub = a.dep + a.prov + a.dist;
        const pk = `${ub}|${f[col.PRODUCTO_PROYECTO]}`;
        let p = projects.get(pk);
        if (!p) {
          p = {
            ub,
            code: f[col.PRODUCTO_PROYECTO],
            name: f[col.PRODUCTO_PROYECTO_NOMBRE],
            funcion: f[col.FUNCION_NOMBRE],
            pim: 0,
            dev: 0,
          };
          projects.set(pk, p);
        }
        p.pim += pim;
        p.dev += dev;
      }
    }
  }
  await Bun.write(
    `data/raw/mef-municipal-${year}.json`,
    JSON.stringify([...acc.values()]),
  );
  await Bun.write(
    `data/raw/mef-projects-${year}.json`,
    JSON.stringify([...projects.values()]),
  );
  console.log(
    `${rows} rows · ${acc.size} municipalities · ${projects.size} projects`,
  );
}
