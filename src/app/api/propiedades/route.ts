import { NextResponse, type NextRequest } from "next/server";
import { getPublishedProperties } from "@/lib/catalog";

/** Devuelve propiedades publicadas por id (para favoritos y comparador). */
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 100);
  if (!ids.length) return NextResponse.json([]);
  const all = await getPublishedProperties();
  const byId = new Map(all.map((p) => [p.id, p]));
  const out = ids.map((id) => byId.get(id)).filter(Boolean);
  return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
}
