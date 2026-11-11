import "server-only";
import { randomUUID } from "node:crypto";
import { repo } from "./data";
import { leadKindLabel } from "./labels";
import type { Activity, Contact, ContactKind, Lead, Property, Task } from "./types";

export const newId = (prefix: string) => `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;

const digits = (s: string) => s.replace(/\D/g, "").slice(-8); // últimos 8: ignora prefijos 0, 15, 54, 9

export async function logActivity(a: Omit<Activity, "id" | "at"> & { at?: string }) {
  return repo.put("activities", { id: newId("ac"), at: a.at ?? new Date().toISOString(), ...a });
}

export async function findContact(phone: string, email: string): Promise<Contact | null> {
  const all = await repo.list("contacts");
  const ph = phone ? digits(phone) : "";
  const em = email.trim().toLowerCase();
  return (
    all.find((c) => (ph && ph.length >= 8 && digits(c.phone) === ph) || (em && c.email.toLowerCase() === em)) ?? null
  );
}

function kindFor(lead: Lead): ContactKind {
  if (lead.kind === "tasacion") return "propietario";
  if (lead.details["Motivo"]?.includes("vender")) return "propietario";
  return "comprador";
}

/**
 * Cada consulta web entra al CRM: se crea o actualiza el contacto, queda registrada
 * en su historial y se agenda la tarea de responder (en 2 h hábiles aprox.).
 */
export async function contactFromLead(lead: Lead, property: Property | null): Promise<Contact> {
  const now = new Date().toISOString();
  const existing = await findContact(lead.phone, lead.email);
  const kind = kindFor(lead);

  const contact: Contact = existing
    ? {
        ...existing,
        phone: existing.phone || lead.phone,
        email: existing.email || lead.email,
        kinds: existing.kinds.includes(kind) ? existing.kinds : [...existing.kinds, kind],
        assignedTo: existing.assignedTo ?? lead.assignedTo,
        updatedAt: now,
        lastContactAt: now,
      }
    : {
        id: newId("ct"),
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        kinds: [kind],
        source: "Web",
        notes: "",
        search:
          property && lead.kind !== "tasacion"
            ? {
                operation: property.operation,
                types: [property.type],
                zones: [property.neighborhood],
                maxPrice: property.price ? Math.round(property.price * 1.15) : null,
                currency: property.currency,
                minRooms: null,
                notes: "Búsqueda inferida de su primera consulta. Confirmar con el cliente.",
              }
            : null,
        assignedTo: lead.assignedTo,
        createdAt: now,
        updatedAt: now,
        lastContactAt: now,
      };
  await repo.put("contacts", contact);

  const detail =
    `${leadKindLabel[lead.kind]} desde la web` +
    (property ? ` por ${property.title} (${property.code})` : "") +
    (lead.message ? `: “${lead.message.slice(0, 280)}”` : ".");
  await logActivity({ kind: "sistema", text: detail.trim(), contactId: contact.id, propertyId: property?.id ?? null, dealId: null, userId: null });

  const due = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
  const task: Task = {
    id: newId("tk"),
    type: lead.kind === "tasacion" ? "llamado" : lead.kind === "visita" ? "visita" : "llamado",
    title:
      lead.kind === "tasacion"
        ? `Coordinar tasación con ${lead.name}`
        : lead.kind === "visita"
          ? `Confirmar visita con ${lead.name}${property ? ` · ${property.code}` : ""}`
          : `Responder consulta de ${lead.name}${property ? ` · ${property.code}` : ""}`,
    dueAt: due,
    durationMin: 15,
    contactId: contact.id,
    propertyId: property?.id ?? null,
    leadId: lead.id,
    assignedTo: lead.assignedTo,
    status: "pendiente",
    outcome: "",
    notes: lead.preferredDate ? `Día preferido: ${lead.preferredDate}. ${lead.details["Franja horaria"] ?? ""}` : "",
    createdAt: now,
    completedAt: null,
  };
  await repo.put("tasks", task);
  return contact;
}
