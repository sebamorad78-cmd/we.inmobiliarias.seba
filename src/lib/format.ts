import type { Currency, Property } from "./types";
import { operationLabel, typeLabel } from "./labels";

const numberFmt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

export function formatNumber(n: number): string {
  return numberFmt.format(n);
}

export function formatMoney(amount: number, currency: Currency): string {
  return `${currency === "USD" ? "USD" : "$"} ${numberFmt.format(amount)}`;
}

export function formatPrice(p: Pick<Property, "price" | "currency" | "operation">): string {
  if (p.price == null) return "Consultar precio";
  const base = formatMoney(p.price, p.currency);
  if (p.operation === "alquiler") return `${base} /mes`;
  if (p.operation === "temporario") return `${base} /mes`;
  return base;
}

export function formatArea(m2: number | null | undefined): string | null {
  if (m2 == null) return null;
  // Campos y quintas se leen en hectáreas.
  if (m2 >= 10000) return `${(m2 / 10000).toLocaleString("es-AR", { maximumFractionDigits: 2 })} ha`;
  return `${numberFmt.format(m2)} m²`;
}

export function pricePerM2(p: Property): string | null {
  if (p.price == null || p.operation !== "venta") return null;
  const area = p.coveredArea ?? p.totalArea;
  if (!area) return null;
  return `${formatMoney(Math.round(p.price / area), p.currency)} /m²`;
}

export function propertyHeadline(p: Property): string {
  return `${typeLabel[p.type]} en ${operationLabel[p.operation].toLowerCase()} · ${p.neighborhood}`;
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }): string {
  return new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", ...opts }).format(
    new Date(iso),
  );
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `hace ${d} ${d === 1 ? "día" : "días"}`;
  return formatDate(iso);
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function whatsappLink(phoneDigits: string, text: string): string {
  return `https://wa.me/${phoneDigits.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
