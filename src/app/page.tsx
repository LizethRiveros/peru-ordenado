import type { Metadata } from "next";
import { Explorer } from "@/components/explorer";
import { parseSelection, selectionTitle, withDefaults } from "@/lib/selection";

const COUNTS = { dep: 25, prov: 196, dist: 1873 } as const;

export async function generateMetadata({
  searchParams,
}: PageProps<"/">): Promise<Metadata> {
  const sel = withDefaults(parseSelection(await searchParams));
  const q = new URLSearchParams({
    nivel: sel.level,
    vista: sel.view,
    orden: sel.metric,
  });
  const lugar = (await searchParams).lugar;
  if (typeof lugar === "string" && /^\d{2}(\d{2}(\d{2})?)?$/.test(lugar))
    q.set("lugar", lugar);
  const description = `Perú: ${selectionTitle(sel, COUNTS[sel.level])}.`;
  return {
    description,
    openGraph: {
      images: [{ url: `/og?${q}`, width: 1200, height: 630 }],
      description,
    },
    twitter: { card: "summary_large_image", images: [`/og?${q}`], description },
  };
}

export default function Home() {
  return <Explorer />;
}
