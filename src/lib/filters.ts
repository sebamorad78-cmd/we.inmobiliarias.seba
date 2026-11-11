import {
  CURRENCIES,
  OPERATIONS,
  PROPERTY_TYPES,
  SORT_KEYS,
  type Currency,
  type Operation,
  type Property,
  type PropertyFilters,
  type PropertyType,
  type SortKey,
} from "./types";

export type RawSearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = (v: string | string[] | undefined): string[] =>
  (Array.isArray(v) ? v : v ? [v] : [])
    .flatMap((s) => s.split(","))
    .map((s) => s.trim())
    .filter(Boolean);

const posInt = (v: string | string[] | undefined): number | undefined => {
  const n = Number(first(v));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
};

function oneOf<T extends string>(allowed: readonly T[], v: string | undefined): T | undefined {
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
}

/** Convierte los parámetros de la URL en filtros validados. Valores inválidos se ignoran. */
export function parseFilters(sp: RawSearchParams): PropertyFilters {
  const type = list(sp.tipo).filter((t): t is PropertyType => (PROPERTY_TYPES as readonly string[]).includes(t));
  return {
    operation: oneOf<Operation>(OPERATIONS, first(sp.operacion)),
    type: type.length ? type : undefined,
    neighborhood: list(sp.barrio).length ? list(sp.barrio) : undefined,
    q: first(sp.q)?.trim().slice(0, 80) || undefined,
    minPrice: posInt(sp.desde),
    maxPrice: posInt(sp.hasta),
    currency: oneOf<Currency>(CURRENCIES, first(sp.moneda)),
    minRooms: posInt(sp.ambientes),
    minBedrooms: posInt(sp.dormitorios),
    minBathrooms: posInt(sp.banos),
    minArea: posInt(sp.m2),
    garage: first(sp.cochera) === "1" || undefined,
    mortgageEligible: first(sp.credito) === "1" || undefined,
    amenities: list(sp.amenities).length ? list(sp.amenities) : undefined,
    sort: oneOf<SortKey>(SORT_KEYS, first(sp.orden)),
  };
}

/** Inversa de parseFilters: produce una query string limpia y estable. */
export function filtersToQuery(f: PropertyFilters, extra: Record<string, string | undefined> = {}): string {
  const p = new URLSearchParams();
  if (f.operation) p.set("operacion", f.operation);
  if (f.type?.length) p.set("tipo", f.type.join(","));
  if (f.neighborhood?.length) p.set("barrio", f.neighborhood.join(","));
  if (f.q) p.set("q", f.q);
  if (f.currency) p.set("moneda", f.currency);
  if (f.minPrice) p.set("desde", String(f.minPrice));
  if (f.maxPrice) p.set("hasta", String(f.maxPrice));
  if (f.minRooms) p.set("ambientes", String(f.minRooms));
  if (f.minBedrooms) p.set("dormitorios", String(f.minBedrooms));
  if (f.minBathrooms) p.set("banos", String(f.minBathrooms));
  if (f.minArea) p.set("m2", String(f.minArea));
  if (f.garage) p.set("cochera", "1");
  if (f.mortgageEligible) p.set("credito", "1");
  if (f.amenities?.length) p.set("amenities", f.amenities.join(","));
  if (f.sort && f.sort !== "recientes") p.set("orden", f.sort);
  for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
}

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function applyFilters(items: Property[], f: PropertyFilters): Property[] {
  const q = f.q ? normalize(f.q) : null;
  const hoods = f.neighborhood?.map(normalize);

  const out = items.filter((p) => {
    if (f.operation && p.operation !== f.operation) return false;
    if (f.type && !f.type.includes(p.type)) return false;
    if (hoods && !hoods.includes(normalize(p.neighborhood))) return false;
    if (f.minPrice || f.maxPrice) {
      // Un filtro de precio sin moneda explícita asume la moneda habitual de la operación.
      const cur = f.currency ?? (f.operation === "alquiler" ? "ARS" : "USD");
      if (p.price == null || p.currency !== cur) return false;
      if (f.minPrice && p.price < f.minPrice) return false;
      if (f.maxPrice && p.price > f.maxPrice) return false;
    }
    if (f.minRooms && (p.rooms ?? 0) < f.minRooms) return false;
    if (f.minBedrooms && (p.bedrooms ?? 0) < f.minBedrooms) return false;
    if (f.minBathrooms && (p.bathrooms ?? 0) < f.minBathrooms) return false;
    if (f.minArea && (p.coveredArea ?? p.totalArea ?? 0) < f.minArea) return false;
    if (f.garage && !(p.garages && p.garages > 0)) return false;
    if (f.mortgageEligible && !p.mortgageEligible) return false;
    if (f.amenities && !f.amenities.every((a) => p.amenities.includes(a))) return false;
    if (q) {
      const hay = normalize(
        [p.title, p.neighborhood, p.city, p.code, p.type, p.showExactLocation ? p.address : ""].join(" "),
      );
      if (!q.split(/\s+/).every((term) => hay.includes(term))) return false;
    }
    return true;
  });

  // Reservadas al final del listado, sin ocultarlas: generan confianza ("se mueve").
  const statusWeight = (p: Property) => (p.status === "reservada" ? 1 : 0);
  const sorters: Record<SortKey, (a: Property, b: Property) => number> = {
    recientes: (a, b) => b.createdAt.localeCompare(a.createdAt),
    "precio-asc": (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
    "precio-desc": (a, b) => (b.price ?? -1) - (a.price ?? -1),
    "superficie-desc": (a, b) => (b.coveredArea ?? b.totalArea ?? 0) - (a.coveredArea ?? a.totalArea ?? 0),
  };
  const sorter = sorters[f.sort ?? "recientes"];
  return out.sort((a, b) => statusWeight(a) - statusWeight(b) || sorter(a, b));
}

export function countActiveFilters(f: PropertyFilters): number {
  let n = 0;
  if (f.type?.length) n++;
  if (f.neighborhood?.length) n++;
  if (f.minPrice || f.maxPrice) n++;
  if (f.minRooms) n++;
  if (f.minBedrooms) n++;
  if (f.minBathrooms) n++;
  if (f.minArea) n++;
  if (f.garage) n++;
  if (f.mortgageEligible) n++;
  if (f.amenities?.length) n += f.amenities.length;
  return n;
}
