import type { Metadata, Viewport } from "next";
import { Jost, Libre_Caslon_Display, Libre_Caslon_Text } from "next/font/google";
import { site } from "@/site.config";
import "@/styles/base.css";
import "@/styles/site.css";

const display = Libre_Caslon_Display({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

const serifText = Libre_Caslon_Text({
  weight: ["400", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-caslon",
  display: "swap",
});

const text = Jost({
  subsets: ["latin", "latin-ext"],
  variable: "--font-text",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · Propiedades en venta, alquiler y tasaciones`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: site.name,
    url: site.url,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: `${site.name} · Martillera y corredora pública` }],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#5a1a25",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${display.variable} ${serifText.variable} ${text.variable}`}>
      <body>{children}</body>
    </html>
  );
}
