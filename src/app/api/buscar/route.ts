import { NextResponse } from "next/server";
import { getPublishedProperties } from "@/lib/catalog";
import { formatArea, formatPrice } from "@/lib/format";
import { operationLabel, typeLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

/** Índice compacto para el buscador instantáneo: solo lo necesario para mostrar y filtrar. */
export async function GET() {
  const all = await getPublishedProperties();
  const items = all.map((p) => ({
    slug: p.slug,
    code: p.code,
    title: p.title,
    hood: p.neighborhood,
    city: p.city,
    type: typeLabel[p.type],
    op: p.operation,
    opLabel: operationLabel[p.operation],
    price: formatPrice(p),
    area: formatArea(p.coveredArea ?? p.totalArea),
    rooms: p.rooms,
    image: p.images[0]?.url ?? null,
    featured: p.featured,
    tags: p.amenities.join(" "),
  }));
  const hoods = [...new Map(all.map((p) => [p.neighborhood, { name: p.neighborhood, city: p.city }])).values()].map((h) => ({
    ...h,
    count: all.filter((p) => p.neighborhood === h.name).length,
  }));
  return NextResponse.json(
    { items, hoods },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
