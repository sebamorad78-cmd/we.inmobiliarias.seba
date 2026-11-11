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
