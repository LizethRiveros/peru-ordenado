import { ogImage, ogPlace } from "@/lib/og";
import { parseSelection, withDefaults } from "@/lib/selection";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const sel = withDefaults(parseSelection(q));
  const lugar = q.get("lugar");
  const res =
    lugar && /^\d{2}(\d{2}(\d{2})?)?$/.test(lugar)
      ? await ogPlace(lugar, sel.metric)
      : await ogImage(sel);
  res.headers.set("Cache-Control", "public, max-age=86400, s-maxage=604800");
  return res;
}
