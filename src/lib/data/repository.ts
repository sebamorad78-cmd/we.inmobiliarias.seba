import type { CrmCollection, CrmTypes, Lead, Property, TeamUser } from "../types";

/**
 * Contrato único de acceso a datos. El sitio nunca habla directo con la base:
 * así se puede pasar de archivo local a Supabase (u otra base) sin tocar páginas.
 */
export interface Repository {
  listProperties(): Promise<Property[]>;
  getProperty(id: string): Promise<Property | null>;
  getPropertyBySlug(slug: string): Promise<Property | null>;
  saveProperty(p: Property): Promise<Property>;
  deleteProperty(id: string): Promise<void>;

  listUsers(): Promise<TeamUser[]>;
  getUser(id: string): Promise<TeamUser | null>;
  getUserByEmail(email: string): Promise<TeamUser | null>;
  saveUser(u: TeamUser): Promise<TeamUser>;

  listLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | null>;
  saveLead(l: Lead): Promise<Lead>;

  /** Colecciones del CRM (contactos, agenda, oportunidades, actividad, contratos). */
  list<C extends CrmCollection>(c: C): Promise<CrmTypes[C][]>;
  get<C extends CrmCollection>(c: C, id: string): Promise<CrmTypes[C] | null>;
  put<C extends CrmCollection>(c: C, item: CrmTypes[C]): Promise<CrmTypes[C]>;
  remove(c: CrmCollection, id: string): Promise<void>;

  /** Guarda una imagen y devuelve su URL pública. */
  uploadImage(file: File, folder: string): Promise<string>;
}
