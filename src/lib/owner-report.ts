import "server-only";
import { addDays, arDayKey, weekStart } from "./crm";
import { repo } from "./data";
import type { Property } from "./types";

export interface OwnerReport {
  property: Property;
  periodDays: number;
  daysOnMarket: number;
  inquiries: number;
  inquiriesPeriod: number;
  perWeek: { week: string; n: number }[];
  visitsDone: number;
  visitsPeriod: number;
  upcomingVisits: number;
  feedback: { at: string; text: string }[];
  interested: number;
  openNegotiations: number;
  pricePerM2: number | null;
  zonePerM2: number | null;
  zoneSample: number;
  recommendations: string[];
}

/** Arma el informe de gestión de una propiedad para su dueño. Sin datos personales de los interesados. */
export async function buildOwnerReport(propertyId: string, periodDays = 30): Promise<OwnerReport | null> {
  const [property, properties, leads, activities, tasks, deals, contacts] = await Promise.all([
    repo.getProperty(propertyId),
    repo.listProperties(),
    repo.listLeads(),
    repo.list("activities"),
    repo.list("tasks"),
    repo.list("deals"),
    repo.list("contacts"),
  ]);
  if (!property) return null;
  const now = Date.now();
  const since = now - periodDays * 86400000;

  // Consultas: formularios web + consultas registradas en el historial (WhatsApp, teléfono…)
  const inquiryDates = [
    ...leads.filter((l) => l.propertyId === property.id).map((l) => l.createdAt),
    ...activities.filter((a) => a.propertyId === property.id && a.kind === "sistema" && /desde la web|consulta/i.test(a.text)).map((a) => a.at),
  ];
  const uniq = [...new Set(inquiryDates)];
  const ws = weekStart(arDayKey());
  const perWeek = Array.from({ length: 6 }, (_, i) => {
    const w = addDays(ws, -7 * (5 - i));
    return { week: w, n: uniq.filter((d) => arDayKey(d) >= w && arDayKey(d) < addDays(w, 7)).length };
  });

  const visits = tasks.filter((t) => t.propertyId === property.id && t.type === "visita");
  const done = visits.filter((t) => t.status === "hecha");
  const feedback = done
    .filter((t) => t.outcome)
    .sort((a, b) => (b.completedAt ?? b.dueAt).localeCompare(a.completedAt ?? a.dueAt))
    .slice(0, 6)
    .map((t) => ({ at: t.completedAt ?? t.dueAt, text: t.outcome }));

  const area = property.coveredArea ?? property.totalArea;
  const ppm = property.price && area && property.operation === "venta" ? property.price / area : null;
  const comps = properties.filter(
    (p) =>
      p.id !== property.id &&
      p.operation === property.operation &&
      p.type === property.type &&
      p.currency === property.currency &&
      p.price &&
      (p.coveredArea ?? p.totalArea) &&
      (p.neighborhood === property.neighborhood || p.city === property.city),
  );
  const vals = comps.map((p) => p.price! / (p.coveredArea ?? p.totalArea)!).sort((a, b) => a - b);
  const zonePerM2 = vals.length ? vals[Math.floor(vals.length / 2)] : null;

  const interested = contacts.filter((c) => {
    const s = c.search;
    if (!s || s.operation !== property.operation) return false;
    if (s.types.length && !s.types.includes(property.type)) return false;
    if (s.zones.length && !s.zones.some((z) => [property.neighborhood, property.city].map((x) => x.toLowerCase()).includes(z.toLowerCase()))) return false;
    return !s.maxPrice || !property.price || property.price <= s.maxPrice * 1.1;
  }).length;
  const openNegotiations = deals.filter((d) => d.propertyId === property.id && ["oferta", "reserva", "boleto"].includes(d.stage)).length;
  const daysOnMarket = Math.floor((now - new Date(property.createdAt).getTime()) / 86400000);
  const inquiriesPeriod = uniq.filter((d) => new Date(d).getTime() >= since).length;
  const visitsPeriod = done.filter((t) => new Date(t.completedAt ?? t.dueAt).getTime() >= since).length;

  const rec: string[] = [];
  if (openNegotiations) rec.push("Hay una negociación en curso. Le avisaremos cada novedad apenas ocurra.");
  if (inquiriesPeriod >= 4 && visitsPeriod === 0) rec.push("Hay interés pero pocas visitas: sugerimos ampliar los horarios disponibles para mostrarla.");
  if (visitsPeriod >= 3 && !openNegotiations) rec.push("Las visitas no se convierten en ofertas. Revisemos juntos la devolución de los interesados y el precio.");
  if (ppm && zonePerM2 && ppm > zonePerM2 * 1.12) rec.push(`El valor por m² está ${Math.round((ppm / zonePerM2 - 1) * 100)} % por encima de propiedades comparables en la zona.`);
  if (daysOnMarket > 90 && inquiriesPeriod < 3) rec.push("Lleva más de 90 días publicada con poca demanda: conviene reforzar la difusión o revisar el precio.");
  if (property.images.length < 8) rec.push("Sumar más fotografías (idealmente 12 o más) mejora la cantidad de consultas.");
  if (!rec.length) rec.push("La propiedad se comporta dentro de lo esperado para la zona. Seguimos con el plan de difusión.");

  return {
    property,
    periodDays,
    daysOnMarket,
    inquiries: uniq.length,
    inquiriesPeriod,
    perWeek,
    visitsDone: done.length,
    visitsPeriod,
    upcomingVisits: visits.filter((t) => t.status === "pendiente" && new Date(t.dueAt).getTime() > now).length,
    feedback,
    interested,
    openNegotiations,
    pricePerM2: ppm,
    zonePerM2,
    zoneSample: vals.length,
    recommendations: rec,
  };
}
