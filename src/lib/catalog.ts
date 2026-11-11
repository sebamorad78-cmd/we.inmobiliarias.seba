import "server-only";
import { cache } from "react";
import { repo } from "./data";
import { applyFilters } from "./filters";
import type { Property, PropertyFilters, PublicAgent, TeamUser } from "./types";

/** Estados visibles en el sitio público. Las vendidas se ocultan; las reservadas se muestran. */
const VISIBLE = new Set<Property["status"]>(["publicada", "reservada"]);

/** Nunca exponer la dirección exacta si el agente no lo habilitó. */
function publicView(full: Property): Property {
  // Datos internos (propietario, autorización y honorarios) nunca salen del panel.
  const { ownerContactId: _o, mandate: _m, ...p } = full;
  void _o;
  void _m;
  if (p.showExactLocation) return p;
  return {
    ...p,
    address: "",
    // Desplazamiento fijo por propiedad (no aleatorio por visita) para no "delatar" el punto real.
    lat: p.lat == null ? null : Math.round(p.lat * 200) / 200,
    lng: p.lng == null ? null : Math.round(p.lng * 200) / 200,
  };
}

export const getPublishedProperties = cache(async (): Promise<Property[]> => {
  const all = await repo.listProperties();
  return all.filter((p) => VISIBLE.has(p.status)).map(publicView);
});

export async function searchProperties(filters: PropertyFilters) {
  return applyFilters(await getPublishedProperties(), filters);
}

export const getPublicProperty = cache(async (slug: string): Promise<Property | null> => {
  const p = await repo.getPropertyBySlug(slug);
  return p && VISIBLE.has(p.status) ? publicView(p) : null;
});

export async function getFeatured(limit = 6) {
  const all = await getPublishedProperties();
  const featured = all.filter((p) => p.featured && p.status === "publicada");
  return (featured.length ? featured : all).slice(0, limit);
}

export async function getSimilar(p: Property, limit = 3) {
  const all = await getPublishedProperties();
  return all
    .filter((x) => x.id !== p.id && x.operation === p.operation)
    .map((x) => {
      let score = 0;
      if (x.type === p.type) score += 3;
      if (x.neighborhood === p.neighborhood) score += 2;
      if (x.city === p.city) score += 1;
      if (p.price && x.price && x.currency === p.currency) {
        const ratio = x.price / p.price;
        if (ratio > 0.7 && ratio < 1.3) score += 2;
      }
      return { x, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.x);
}

export function toPublicAgent(u: TeamUser): PublicAgent {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, title: u.title, license: u.license, bio: u.bio };
}

export const getAgent = cache(async (id: string | null): Promise<PublicAgent | null> => {
  if (!id) return null;
  const u = await repo.getUser(id);
  return u && u.active ? toPublicAgent(u) : null;
});

export const getPublicTeam = cache(async (): Promise<PublicAgent[]> => {
  const users = await repo.listUsers();
  return users
    .filter((u) => u.active && u.public)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(toPublicAgent);
});

export async function getNeighborhoodStats() {
  const all = await getPublishedProperties();
  const map = new Map<string, { name: string; city: string; count: number; image: string | null; minSaleUsd: number | null }>();
  for (const p of all) {
    const cur = map.get(p.neighborhood) ?? { name: p.neighborhood, city: p.city, count: 0, image: null, minSaleUsd: null };
    cur.count++;
    cur.image ??= p.images[0]?.url ?? null;
    if (p.operation === "venta" && p.currency === "USD" && p.price) {
      cur.minSaleUsd = cur.minSaleUsd == null ? p.price : Math.min(cur.minSaleUsd, p.price);
    }
    map.set(p.neighborhood, cur);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}
