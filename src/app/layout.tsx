import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { themeScript } from "@/lib/theme";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://peru-ordenado.crafter.ing"),
  title: "Perú, ordenado",
  description:
    "El mapa del Perú desarmado y vuelto a ordenar: departamentos, provincias y distritos a escala, por área e inversión municipal. Crafter Research.",
};

export const viewport: Viewport = {
  themeColor: "#f7f3ea",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-PE"
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable} ${mono.variable} h-full`}
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static theme bootstrap, no user input */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col font-sans">
        {children}
        <footer className="px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-1 text-center text-[10px] text-muted-foreground/75 sm:px-6">
          Límites: IGN 2020 vía OCHA HDX (CC BY-IGO). Inversión: MEF, Datos
          Abiertos 2024. Prototipo no oficial.
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
