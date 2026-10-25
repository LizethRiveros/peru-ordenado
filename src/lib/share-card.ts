import type { Shape } from "@/lib/shapes";

export type CardInput = {
  shape: Shape;
  /** "Provincia, Departamento" under the name. */
  where: string;
  /** Big figure ("41") and what it counts ("de cada 100 soles ya gastados"). */
  big: string;
  unit: string;
  /** One plain sentence with the comparison against the country, if any. */
  line: string;
  question: string;
  fill: string;
  url: string;
};

const W = 1080;
const H = 1920;

function family(cls: string, fallback: string): string {
  const el = document.createElement("span");
  el.className = cls;
  document.body.appendChild(el);
  const f = getComputedStyle(el).fontFamily || fallback;
  el.remove();
  return f;
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const w of text.split(" ")) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** A 1080×1920 story card (Instagram / Facebook / WhatsApp status): the shape, one number, one sentence. */
export async function renderCard(c: CardInput): Promise<Blob> {
  await document.fonts?.ready;
  const display = family("font-display", "Georgia, serif");
  const sans = family("font-sans", "system-ui, sans-serif");
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d");
  if (!ctx) throw new Error("canvas");

  ctx.fillStyle = "#f6eddf";
  ctx.fillRect(0, 0, W, H);

  // The quipu: a main cord with hanging knotted strings, as a quiet frame.
  ctx.strokeStyle = "#b5522b";
  ctx.fillStyle = "#b5522b";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(60, 120);
  ctx.lineTo(W - 60, 120);
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const x = 120 + i * 80;
    const len = 40 + ((i * 37) % 70);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 120);
    ctx.lineTo(x, 120 + len);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, 120 + len, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#3a2a1c";
  ctx.textAlign = "left";
  ctx.font = `600 34px ${sans}`;
  ctx.fillText("QUIPU", 80, 300);
  ctx.fillStyle = "#7a6552";
  ctx.font = `500 30px ${sans}`;
  ctx.fillText(c.question, 80, 348);

  // The shape, at its real proportions.
  const [x0, y0, x1, y1] = c.shape.bbox;
  const box = 640;
  const k = Math.min(box / (x1 - x0), box / (y1 - y0));
  ctx.save();
  ctx.translate(W / 2 - ((x0 + x1) / 2) * k, 700 - ((y0 + y1) / 2) * k);
  ctx.scale(k, k);
  ctx.fillStyle = c.fill;
  ctx.fill(new Path2D(c.shape.d));
  ctx.lineWidth = 2 / k;
  ctx.strokeStyle = "#f6eddf";
  ctx.stroke(new Path2D(c.shape.d));
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = "#3a2a1c";
  ctx.font = `500 96px ${display}`;
  ctx.fillText(c.shape.name, W / 2, 1160);
  ctx.fillStyle = "#7a6552";
  ctx.font = `400 34px ${sans}`;
  ctx.fillText(c.where, W / 2, 1212);

  ctx.fillStyle = "#b5522b";
  ctx.font = `600 230px ${display}`;
  ctx.fillText(c.big, W / 2, 1450);
  ctx.fillStyle = "#3a2a1c";
  ctx.font = `500 42px ${sans}`;
  ctx.fillText(c.unit, W / 2, 1512);

  ctx.fillStyle = "#5a4636";
  ctx.font = `400 36px ${sans}`;
  wrap(ctx, c.line, 860)
    .slice(0, 3)
    .forEach((l, i) => ctx.fillText(l, W / 2, 1600 + i * 50));

  ctx.fillStyle = "#3a2a1c";
  ctx.font = `600 36px ${sans}`;
  ctx.fillText(c.url.replace(/^https?:\/\//, ""), W / 2, 1810);
  ctx.fillStyle = "#7a6552";
  ctx.font = `400 28px ${sans}`;
  ctx.fillText("Busca el tuyo · datos abiertos del MEF", W / 2, 1856);

  return new Promise((res, rej) =>
    cv.toBlob((b) => (b ? res(b) : rej(new Error("png"))), "image/png"),
  );
}
