import type {
  Activity,
  Contact,
  Deal,
  Lead,
  ContactKind,
  ContactSearch,
  Contract,
  DealStage,
  Property,
  Task,
  TaskType,
  TeamUser,
} from "./types";

/* ───────────── Etiquetas ───────────── */

export const taskTypeLabel: Record<TaskType, string> = {
  visita: "Visita",
  llamado: "Llamado",
  tasacion: "Tasación",
  firma: "Firma",
  reunion: "Reunión",
  tarea: "Tarea",
};

export const dealStageLabel: Record<DealStage, string> = {
  interesado: "Interesado",
  visita: "Visitó",
  oferta: "Oferta",
  reserva: "Reserva",
  boleto: "Boleto",
  cerrada: "Escriturada",
  perdida: "Perdida",
};

export const contactKindLabel: Record<ContactKind, string> = {
  comprador: "Comprador",
  propietario: "Propietario",
  inquilino: "Inquilino",
  inversor: "Inversor",
  otro: "Otro",
};

/** Probabilidad orientativa de cierre por etapa (para el valor ponderado del embudo). */
export const stageProbability: Record<DealStage, number> = {
  interesado: 0.1,
  visita: 0.25,
  oferta: 0.5,
  reserva: 0.75,
  boleto: 0.9,
  cerrada: 1,
  perdida: 0,
};

/* ───────────── Fechas en hora de Argentina (UTC-3, sin horario de verano) ───────────── */

const AR_OFFSET_MS = -3 * 3600 * 1000;
export const TZ = "America/Argentina/Buenos_Aires";

/** Fecha/hora "de pared" en Argentina como objeto Date en UTC (solo para leer componentes con getUTC*). */
export function arWall(d: Date | string | number = Date.now()): Date {
  return new Date(new Date(d).getTime() + AR_OFFSET_MS);
}

/** "2026-11-11" en Argentina. */
export function arDayKey(d: Date | string | number = Date.now()): string {
  return arWall(d).toISOString().slice(0, 10);
}

/** Instante UTC de un día/hora de Argentina. */
export function fromArLocal(day: string, time = "00:00"): Date {
  return new Date(`${day}T${time}:00-03:00`);
}

/** Valor para <input type="datetime-local"> en hora argentina. */
export function toArInput(iso: string): string {
  return arWall(iso).toISOString().slice(0, 16);
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Lunes de la semana del día dado. */
export function weekStart(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  return addDays(day, -dow);
}

export function daysBetween(fromDay: string, toDay: string): number {
  return Math.round((new Date(`${toDay}T12:00:00Z`).getTime() - new Date(`${fromDay}T12:00:00Z`).getTime()) / 86400000);
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
export function fmtAr(iso: string, opts: Intl.DateTimeFormatOptions): string {
  const key = JSON.stringify(opts);
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, ...opts });
    fmtCache.set(key, f);
  }
  return f.format(new Date(iso));
}

export const hhmm = (iso: string) => fmtAr(iso, { hour: "2-digit", minute: "2-digit", hour12: false });

/** "hoy", "mañana", "ayer", "jue 14 nov". */
export function dayLabel(iso: string, today = arDayKey()): string {
  const d = arDayKey(iso);
  const diff = daysBetween(today, d);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  return fmtAr(iso, { weekday: "short", day: "numeric", month: "short" });
}

/* ───────────── Visibilidad por usuario ───────────── */

/** Un administrador ve todo; un agente ve lo suyo y lo que todavía no tiene responsable. */
export function canSee(user: TeamUser, assignedTo: string | null | undefined): boolean {
  return user.role === "admin" || !assignedTo || assignedTo === user.id;
}

/* ───────────── Cruce cliente ↔ propiedad ───────────── */

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/**
 * Puntaje 0-100 de qué tan bien una propiedad responde a una búsqueda.
 * Operación es excluyente; tipo, zona, precio y ambientes suman.
 * Devuelve null si no corresponde mostrarla.
 */
export function matchScore(search: ContactSearch, p: Property): number | null {
  if (p.operation !== search.operation) return null;
  if (p.status !== "publicada" && p.status !== "reservada") return null;
  let score = 30;
  if (search.types.length) {
    if (!search.types.includes(p.type)) return null;
    score += 20;
  }
  if (search.zones.length) {
    const zones = search.zones.map(norm);
    if (!zones.includes(norm(p.neighborhood)) && !zones.includes(norm(p.city))) return null;
    score += 25;
  }
  if (search.maxPrice) {
    if (p.price == null) score += 5;
    else if (p.currency !== search.currency) return null;
    else if (p.price > search.maxPrice * 1.1) return null; // hasta 10 % arriba: se negocia
    else score += p.price <= search.maxPrice ? 15 : 5;
  }
  if (search.minRooms) {
    if ((p.rooms ?? 0) < search.minRooms) return null;
    score += 10;
  }
  return Math.min(100, score);
}

export function matchesFor(contact: Contact, properties: Property[], limit = 6) {
  if (!contact.search) return [];
  return properties
    .map((p) => ({ p, score: matchScore(contact.search!, p) }))
    .filter((r): r is { p: Property; score: number } => r.score != null)
    .sort((a, b) => b.score - a.score || b.p.createdAt.localeCompare(a.p.createdAt))
    .slice(0, limit);
}

export function interestedIn(property: Property, contacts: Contact[], limit = 8) {
  return contacts
    .filter((c) => c.search)
    .map((c) => ({ c, score: matchScore(c.search!, property) }))
    .filter((r): r is { c: Contact; score: number } => r.score != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/* ───────────── Contratos de alquiler ───────────── */

function addMonths(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(d, last));
  return date.toISOString().slice(0, 10);
}

/** Próxima fecha de actualización del alquiler (o null si es fijo o ya terminó). */
export function nextAdjustment(c: Contract, today = arDayKey()): string | null {
  if (c.adjustIndex === "Fijo" || !c.adjustEveryMonths || today > c.end) return null;
  let n = c.adjustEveryMonths;
  let next = addMonths(c.start, n);
  while (next <= today) {
    n += c.adjustEveryMonths;
    next = addMonths(c.start, n);
  }
  return next < c.end ? next : null;
}

export function contractAlerts(c: Contract, today = arDayKey()) {
  const toEnd = daysBetween(today, c.end);
  const adj = nextAdjustment(c, today);
  const toAdj = adj ? daysBetween(today, adj) : null;
  return {
    toEnd,
    adjustment: adj,
    toAdjustment: toAdj,
    endingSoon: c.active && toEnd >= 0 && toEnd <= 90,
    expired: c.active && toEnd < 0,
    adjustSoon: c.active && toAdj != null && toAdj <= 30,
  };
}

/* ───────────── Varios ───────────── */

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function waNumber(phone: string): string {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) d = d.slice(1);
  if (!d.startsWith("54")) d = `549${d}`;
  return d;
}

export function isOverdue(t: Task, now = Date.now()): boolean {
  return t.status === "pendiente" && new Date(t.dueAt).getTime() < now - 15 * 60000;
}

/* ───────────── Temperatura del contacto ───────────── */


export type Temperature = "caliente" | "tibio" | "frio";

/**
 * Temperatura 0-100 según actividad reciente, etapa del negocio y visitas.
 * Es una guía para priorizar llamados, no un juicio sobre el cliente.
 */
export function temperatureOf(
  c: Contact,
  ctx: { deals: Deal[]; activities: Activity[]; tasks: Task[] },
  now = Date.now(),
): { score: number; label: Temperature } {
  let score = 0;
  const last = new Date(c.lastContactAt ?? c.createdAt).getTime();
  const days = (now - last) / 86400000;
  score += days <= 2 ? 35 : days <= 7 ? 25 : days <= 14 ? 12 : days <= 30 ? 5 : 0;
  const active = ctx.deals.filter((d) => d.contactId === c.id && d.stage !== "cerrada" && d.stage !== "perdida");
  const best = Math.max(0, ...active.map((d) => stageProbability[d.stage]));
  score += Math.round(best * 40);
  const recent = ctx.activities.filter((a) => a.contactId === c.id && now - new Date(a.at).getTime() < 14 * 86400000 && a.kind !== "sistema").length;
  score += Math.min(15, recent * 5);
  const visits = ctx.tasks.filter((t) => t.contactId === c.id && t.type === "visita" && t.status === "hecha").length;
  score += Math.min(10, visits * 5);
  if (c.search) score += 5;
  score = Math.min(100, score);
  return { score, label: score >= 60 ? "caliente" : score >= 30 ? "tibio" : "frio" };
}

export const temperatureLabel: Record<Temperature, string> = { caliente: "Caliente", tibio: "Tibio", frio: "Frío" };

/* ───────────── Listas inteligentes ───────────── */

export interface SmartContext {
  deals: Deal[];
  activities: Activity[];
  tasks: Task[];
  leads: Lead[];
  now: number;
}

export const SMART_LISTS: { id: string; label: string; hint: string; test: (c: Contact, x: SmartContext) => boolean }[] = [
  { id: "todos", label: "Todos", hint: "Todos los contactos", test: () => true },
  {
    id: "calientes",
    label: "Calientes",
    hint: "Actividad reciente y negocio avanzado",
    test: (c, x) => temperatureOf(c, x, x.now).label === "caliente",
  },
  {
    id: "nuevos",
    label: "Nuevos esta semana",
    hint: "Ingresaron en los últimos 7 días",
    test: (c, x) => x.now - new Date(c.createdAt).getTime() < 7 * 86400000,
  },
  {
    id: "sin-seguimiento",
    label: "Sin seguimiento",
    hint: "Con negocio abierto y sin contacto hace 7 días o más",
    test: (c, x) =>
      x.deals.some((d) => d.contactId === c.id && d.stage !== "cerrada" && d.stage !== "perdida") &&
      x.now - new Date(c.lastContactAt ?? c.createdAt).getTime() >= 7 * 86400000,
  },
  {
    id: "visitaron",
    label: "Visitaron sin ofertar",
    hint: "Hicieron una visita y su negocio no pasó a oferta",
    test: (c, x) =>
      x.tasks.some((t) => t.contactId === c.id && t.type === "visita" && t.status === "hecha") &&
      !x.deals.some((d) => d.contactId === c.id && ["oferta", "reserva", "boleto", "cerrada"].includes(d.stage)),
  },
  { id: "compradores", label: "Buscan comprar", hint: "Con búsqueda de compra cargada", test: (c) => c.search?.operation === "venta" },
  { id: "inquilinos", label: "Buscan alquilar", hint: "Con búsqueda de alquiler cargada", test: (c) => !!c.search && c.search.operation !== "venta" },
  { id: "propietarios", label: "Propietarios", hint: "Dueños de propiedades y locadores", test: (c) => c.kinds.includes("propietario") },
  {
    id: "dormidos",
    label: "Para reactivar",
    hint: "Sin contacto hace más de 30 días",
    test: (c, x) => x.now - new Date(c.lastContactAt ?? c.createdAt).getTime() > 30 * 86400000,
  },
];
