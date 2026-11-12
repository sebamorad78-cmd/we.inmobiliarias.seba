import type { ImageLoaderProps } from "next/image";

/** Anchos pre-generados (WebP) para las fotos propias en /public/img. */
const LOCAL_WIDTHS = [256, 640, 1080, 1600, 2560];

/**
 * Cada foto se pide al lugar más rápido:
 * - Unsplash: directo a su CDN, al ancho justo y en AVIF/WebP según el navegador.
 * - Fotos propias (/img): versión estática pre-generada, servida desde el borde de Cloudflare.
 * - Fotos subidas desde el panel: optimizador de Next.
 */
export function photoLoader({ src, width, quality }: ImageLoaderProps): string {
  const q = quality ?? 80;
  if (src.startsWith("https://images.unsplash.com/")) {
    const u = new URL(src);
    u.searchParams.set("w", String(width));
    u.searchParams.set("q", String(q));
    u.searchParams.set("auto", "format");
    u.searchParams.set("fit", "crop");
    return u.toString();
  }
  if (src.startsWith("/img/") && src.endsWith(".jpg")) {
    const w = LOCAL_WIDTHS.find((x) => x >= width) ?? LOCAL_WIDTHS[LOCAL_WIDTHS.length - 1];
    return `${src.slice(0, -4)}-${w}.webp`;
  }
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}
