import type { LeadKind, LeadStatus, Operation, PropertyStatus, PropertyType, SortKey } from "./types";

export const operationLabel: Record<Operation, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
  temporario: "Alquiler temporario",
};

export const typeLabel: Record<PropertyType, string> = {
  departamento: "Departamento",
  casa: "Casa",
  ph: "PH",
  terreno: "Terreno",
  oficina: "Oficina",
  local: "Local comercial",
  quinta: "Quinta",
  galpon: "Galpón",
};

export const typePlural: Record<PropertyType, string> = {
  departamento: "Departamentos",
  casa: "Casas",
  ph: "PH",
  terreno: "Terrenos",
  oficina: "Oficinas",
  local: "Locales",
  quinta: "Quintas",
  galpon: "Galpones",
};

export const statusLabel: Record<PropertyStatus, string> = {
  publicada: "Publicada",
  reservada: "Reservada",
  vendida: "Vendida / Alquilada",
  borrador: "Borrador",
};

export const sortLabel: Record<SortKey, string> = {
  recientes: "Más recientes",
  "precio-asc": "Menor precio",
  "precio-desc": "Mayor precio",
  "superficie-desc": "Mayor superficie",
};

export const leadKindLabel: Record<LeadKind, string> = {
  consulta: "Consulta por propiedad",
  visita: "Pedido de visita",
  tasacion: "Tasación",
  contacto: "Contacto general",
};

export const leadStatusLabel: Record<LeadStatus, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  "visita agendada": "Visita agendada",
  negociación: "En negociación",
  cerrado: "Cerrado",
  descartado: "Descartado",
};

/** Lista curada de comodidades: mantiene consistencia entre fichas y filtros. */
export const AMENITIES = [
  "Pileta",
  "Parrilla",
  "Jardín",
  "Terraza",
  "Balcón",
  "Cochera cubierta",
  "Baulera",
  "Seguridad 24 h",
  "Gimnasio",
  "SUM",
  "Laundry",
  "Aire acondicionado",
  "Calefacción central",
  "Losa radiante",
  "Dependencia de servicio",
  "Vestidor",
  "Cocina integrada",
  "Vista abierta",
  "Amenities completos",
  "Apto mascotas",
  "Amoblado",
  "Ascensor",
  "Luminoso",
  "Muelle",
] as const;
