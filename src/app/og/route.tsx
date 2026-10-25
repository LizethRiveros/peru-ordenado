import { ogImage } from "@/lib/og";
import { parseSelection, withDefaults } from "@/lib/selection";

export async function GET(req: Request) {
  const sel = withDefaults(parseSelection(new URL(req.url).searchParams));
  const res = await ogImage(sel);
  res.headers.set("Cache-Control", "public, max-age=86400, s-maxage=604800");
  return res;
}
