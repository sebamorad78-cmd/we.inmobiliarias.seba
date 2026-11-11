import type { MetadataRoute } from "next";
import { site } from "@/site.config";
import { getPublishedProperties } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const props = await getPublishedProperties();
  const now = new Date();
  const fixed = ["", "/propiedades", "/propiedades?operacion=venta", "/propiedades?operacion=alquiler", "/tasaciones", "/nosotros", "/contacto"].map(
    (path) => ({ url: `${site.url}${path}`, lastModified: now, changeFrequency: "daily" as const, priority: path === "" ? 1 : 0.8 }),
  );
  return [
    ...fixed,
    ...props.map((p) => ({
      url: `${site.url}/propiedades/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: p.images.slice(0, 5).map((i) => i.url),
    })),
  ];
}
