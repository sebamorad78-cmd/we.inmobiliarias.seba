export const OPERATIONS = ["venta", "alquiler", "temporario"] as const;
export type Operation = (typeof OPERATIONS)[number];

export const PROPERTY_TYPES = [
  "departamento",
  "casa",
  "ph",
  "terreno",
  "oficina",
  "local",
  "quinta",
  "galpon",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const CURRENCIES = ["USD", "ARS"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const PROPERTY_STATUSES = ["publicada", "reservada", "vendida", "borrador"] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export interface PropertyImage {
  url: string;
  alt: string;
}

export interface Property {
  id: string;
  slug: string;
  /** Código interno visible para el cliente ("Ref. RB-1042"). */
  code: string;
  title: string;
  operation: Operation;
  type: PropertyType;
  status: PropertyStatus;
  featured: boolean;

  price: number | null; // null = "Consultar precio"
  currency: Currency;
  expenses: number | null;

  neighborhood: string;
  city: string;
  address: string;
  /** Si es false, en el sitio se muestra un área aproximada y no la dirección exacta. */
  showExactLocation: boolean;
  lat: number | null;
  lng: number | null;

  coveredArea: number | null;
  totalArea: number | null;
  rooms: number | null; // ambientes
  bedrooms: number | null;
  bathrooms: number | null;
  garages: number | null;
  age: number | null; // antigüedad en años, 0 = a estrenar
  floor: string | null;
  orientation: string | null;
  mortgageEligible: boolean; // apto crédito
  professionalUse: boolean; // apto profesional

  amenities: string[];
  description: string;
  images: PropertyImage[];
  videoUrl: string | null;
  tourUrl: string | null;

  agentId: string | null;
  /** Datos internos: nunca se muestran en el sitio público. */
  ownerContactId?: string | null;
  mandate?: Mandate | null;
  /** Período del precio en alquileres (por defecto, por mes). */
  pricePeriod?: "dia" | "semana" | "mes" | null;
  createdAt: string;
  updatedAt: string;
}

export const USER_ROLES = ["admin", "agente"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface TeamUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  title: string;
  license: string | null;
  bio: string;
  active: boolean;
  /** Mostrar en la página "Nosotros". */
  public: boolean;
  passwordHash: string;
  createdAt: string;
}

export type PublicAgent = Pick<TeamUser, "id" | "name" | "email" | "phone" | "title" | "license" | "bio">;

export const LEAD_KINDS = ["consulta", "visita", "tasacion", "contacto"] as const;
export type LeadKind = (typeof LEAD_KINDS)[number];

export const LEAD_STATUSES = ["nuevo", "contactado", "visita agendada", "negociación", "cerrado", "descartado"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface Lead {
  id: string;
  createdAt: string;
  kind: LeadKind;
  status: LeadStatus;
  name: string;
  email: string;
  phone: string;
  message: string;
  propertyId: string | null;
  preferredDate: string | null;
  /** Datos extra según el tipo (ej. tasación: dirección, m², tipo). */
  details: Record<string, string>;
  assignedTo: string | null;
  notes: string;
  source: string;
}

export interface PropertyFilters {
  operation?: Operation;
  type?: PropertyType[];
  neighborhood?: string[];
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: Currency;
  minRooms?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  minArea?: number;
  garage?: boolean;
  mortgageEligible?: boolean;
  amenities?: string[];
  sort?: SortKey;
}

export const SORT_KEYS = ["recientes", "precio-asc", "precio-desc", "superficie-desc"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

/* ============================================================
   CRM del martillero: contactos, agenda, oportunidades,
   actividad y contratos de alquiler.
   ============================================================ */

export const CONTACT_KINDS = ["comprador", "propietario", "inquilino", "inversor", "otro"] as const;
export type ContactKind = (typeof CONTACT_KINDS)[number];

export const CONTACT_SOURCES = ["Web", "WhatsApp", "Portal", "Referido", "Cartel", "Redes", "Oficina", "Otro"] as const;

/** Lo que busca un cliente. Se usa para cruzarlo con la cartera. */
export interface ContactSearch {
  operation: Operation;
  types: PropertyType[];
  zones: string[];
  maxPrice: number | null;
  currency: Currency;
  minRooms: number | null;
  notes: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  kinds: ContactKind[];
  source: string;
  notes: string;
  search: ContactSearch | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  lastContactAt: string | null;
}

export const TASK_TYPES = ["visita", "llamado", "tasacion", "firma", "reunion", "tarea"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_STATUSES = ["pendiente", "hecha", "cancelada"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** Evento de agenda o tarea. Con hora: aparece en el calendario. */
export interface Task {
  id: string;
  type: TaskType;
  title: string;
  dueAt: string; // ISO
  durationMin: number;
  contactId: string | null;
  propertyId: string | null;
  leadId: string | null;
  assignedTo: string | null;
  status: TaskStatus;
  outcome: string;
  notes: string;
  createdAt: string;
  completedAt: string | null;
}

export const DEAL_STAGES = ["interesado", "visita", "oferta", "reserva", "boleto", "cerrada", "perdida"] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export interface Deal {
  id: string;
  title: string;
  contactId: string | null;
  propertyId: string | null;
  operation: Operation;
  stage: DealStage;
  value: number | null;
  currency: Currency;
  commissionPct: number;
  assignedTo: string | null;
  expectedClose: string | null;
  lostReason: string;
  createdAt: string;
  updatedAt: string;
}

export const ACTIVITY_KINDS = ["nota", "llamado", "whatsapp", "email", "visita", "sistema"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export interface Activity {
  id: string;
  at: string;
  kind: ActivityKind;
  text: string;
  contactId: string | null;
  propertyId: string | null;
  dealId: string | null;
  userId: string | null;
}

export const ADJUST_INDEXES = ["ICL", "IPC", "Casa Propia", "Fijo", "Otro"] as const;
export type AdjustIndex = (typeof ADJUST_INDEXES)[number];

export interface Contract {
  id: string;
  propertyId: string | null;
  propertyLabel: string;
  tenantId: string | null;
  ownerId: string | null;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  rent: number;
  currency: Currency;
  adjustIndex: AdjustIndex;
  adjustEveryMonths: number;
  payDay: number;
  deposit: number | null;
  notes: string;
  active: boolean;
  createdAt: string;
}

/** Autorización de venta o alquiler firmada con el propietario. */
export interface Mandate {
  kind: "exclusiva" | "compartida" | "sin firma";
  expires: string | null; // YYYY-MM-DD
  commissionPct: number | null;
}

export type CrmCollection = "contacts" | "tasks" | "deals" | "activities" | "contracts";
export interface CrmTypes {
  contacts: Contact;
  tasks: Task;
  deals: Deal;
  activities: Activity;
  contracts: Contract;
}
