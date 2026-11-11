"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { canSee, fromArLocal, taskTypeLabel } from "@/lib/crm";
import { contactFromLead, findContact, logActivity, newId } from "@/lib/crm-server";
import { repo } from "@/lib/data";
import {
  ACTIVITY_KINDS,
  ADJUST_INDEXES,
  CONTACT_KINDS,
  CURRENCIES,
  DEAL_STAGES,
  OPERATIONS,
  PROPERTY_TYPES,
  TASK_TYPES,
  type Contact,
  type Contract,
  type Deal,
  type DealStage,
  type Task,
} from "@/lib/types";
import type { ActionState } from "./actions";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const nOrNull = (v: string) => {
  if (!v) return null;
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const idOrNull = (v: string) => (v ? v : null);

function errorsOf(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) out[String(i.path[0])] ??= i.message;
  return out;
}

function refresh() {
  revalidatePath("/panel", "layout");
}

/* ───────────── Contactos ───────────── */

const contactSchema = z.object({
  name: z.string().trim().min(2, "Ingresá el nombre").max(100),
  phone: z.string().trim().max(40),
  email: z
    .string()
    .trim()
    .max(120)
    .refine((v) => !v || z.email().safeParse(v).success, "Email inválido"),
  source: z.string().trim().max(40),
  notes: z.string().max(4000),
});

export async function saveContact(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = contactSchema.safeParse({
    name: s(fd, "name"),
    phone: s(fd, "phone"),
    email: s(fd, "email"),
    source: s(fd, "source"),
    notes: String(fd.get("notes") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: "Revisá los campos marcados.", errors: errorsOf(parsed.error) };
  if (!parsed.data.phone && !parsed.data.email) {
    return { ok: false, message: "Cargá al menos un teléfono o un email.", errors: { phone: "Teléfono o email" } };
  }

  const id = s(fd, "id");
  const existing = id ? await repo.get("contacts", id) : null;
  if (existing && !canSee(user, existing.assignedTo)) return { ok: false, message: "No tenés acceso a este contacto." };

  const kinds = fd.getAll("kinds").map(String).filter((k): k is Contact["kinds"][number] => (CONTACT_KINDS as readonly string[]).includes(k));
  const hasSearch = fd.get("hasSearch") === "on";
  const operation = s(fd, "searchOperation");
  const currency = s(fd, "searchCurrency");

  const now = new Date().toISOString();
  const contact: Contact = {
    id: existing?.id ?? newId("ct"),
    ...parsed.data,
    email: parsed.data.email.toLowerCase(),
    kinds: kinds.length ? kinds : ["comprador"],
    search: hasSearch
      ? {
          operation: (OPERATIONS as readonly string[]).includes(operation) ? (operation as (typeof OPERATIONS)[number]) : "venta",
          types: fd.getAll("searchTypes").map(String).filter((t): t is (typeof PROPERTY_TYPES)[number] => (PROPERTY_TYPES as readonly string[]).includes(t)),
          zones: s(fd, "searchZones")
            .split(",")
            .map((z) => z.trim())
            .filter(Boolean)
            .slice(0, 12),
          maxPrice: nOrNull(s(fd, "searchMaxPrice")),
          currency: (CURRENCIES as readonly string[]).includes(currency) ? (currency as "USD" | "ARS") : "USD",
          minRooms: nOrNull(s(fd, "searchMinRooms")),
          notes: s(fd, "searchNotes").slice(0, 600),
        }
      : null,
    assignedTo: idOrNull(s(fd, "assignedTo")) ?? existing?.assignedTo ?? (user.role === "agente" ? user.id : null),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastContactAt: existing?.lastContactAt ?? null,
  };
  await repo.put("contacts", contact);
  if (!existing) {
    await logActivity({ kind: "sistema", text: `Contacto creado por ${user.name}.`, contactId: contact.id, propertyId: null, dealId: null, userId: user.id });
  }
  refresh();
  if (!existing) redirect(`/panel/contactos/${contact.id}`);
  return { ok: true, message: "Contacto guardado." };
}

export async function deleteContact(fd: FormData) {
  await requireUser("admin");
  const id = s(fd, "id");
  if (id) await repo.remove("contacts", id);
  refresh();
  redirect("/panel/contactos");
}

/* ───────────── Actividad ───────────── */

export async function addActivity(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const text = s(fd, "text").slice(0, 3000);
  const kind = s(fd, "kind");
  if (!text) return { ok: false, message: "Escribí qué pasó." };
  if (!(ACTIVITY_KINDS as readonly string[]).includes(kind)) return { ok: false, message: "Tipo inválido." };
  const contactId = idOrNull(s(fd, "contactId"));
  await logActivity({
    kind: kind as (typeof ACTIVITY_KINDS)[number],
    text,
    contactId,
    propertyId: idOrNull(s(fd, "propertyId")),
    dealId: idOrNull(s(fd, "dealId")),
    userId: user.id,
  });
  if (contactId && kind !== "nota") {
    const c = await repo.get("contacts", contactId);
    if (c) await repo.put("contacts", { ...c, lastContactAt: new Date().toISOString() });
  }
  refresh();
  return { ok: true, message: "Registrado." };
}

/** Se llama al tocar un mensaje de WhatsApp: deja constancia en el historial. */
export async function logWhatsapp(contactId: string, text: string) {
  const user = await requireUser();
  const c = await repo.get("contacts", contactId);
  if (!c || !canSee(user, c.assignedTo)) return;
  await logActivity({ kind: "whatsapp", text: `WhatsApp enviado: “${text.slice(0, 400)}”`, contactId, propertyId: null, dealId: null, userId: user.id });
  await repo.put("contacts", { ...c, lastContactAt: new Date().toISOString() });
  refresh();
}

/* ───────────── Agenda y tareas ───────────── */

export async function saveTask(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const type = s(fd, "type");
  if (!(TASK_TYPES as readonly string[]).includes(type)) return { ok: false, message: "Elegí un tipo." };
  const day = s(fd, "day");
  const time = s(fd, "time") || "09:00";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { ok: false, message: "Elegí la fecha.", errors: { day: "Fecha" } };
  if (!/^\d{2}:\d{2}$/.test(time)) return { ok: false, message: "Revisá la hora.", errors: { time: "Hora" } };

  const contactId = idOrNull(s(fd, "contactId"));
  const propertyId = idOrNull(s(fd, "propertyId"));
  const [contact, property] = await Promise.all([
    contactId ? repo.get("contacts", contactId) : null,
    propertyId ? repo.getProperty(propertyId) : null,
  ]);
  let title = s(fd, "title").slice(0, 160);
  if (!title) {
    title = [taskTypeLabel[type as Task["type"]], contact ? `con ${contact.name}` : "", property ? `· ${property.code}` : ""].filter(Boolean).join(" ");
  }

  const id = s(fd, "id");
  const existing = id ? await repo.get("tasks", id) : null;
  const task: Task = {
    id: existing?.id ?? newId("tk"),
    type: type as Task["type"],
    title,
    dueAt: fromArLocal(day, time).toISOString(),
    durationMin: Math.max(5, Math.min(600, Number(s(fd, "durationMin")) || 60)),
    contactId,
    propertyId,
    leadId: existing?.leadId ?? idOrNull(s(fd, "leadId")),
    assignedTo: idOrNull(s(fd, "assignedTo")) ?? existing?.assignedTo ?? user.id,
    status: existing?.status ?? "pendiente",
    outcome: existing?.outcome ?? "",
    notes: String(fd.get("notes") ?? "").slice(0, 2000),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    completedAt: existing?.completedAt ?? null,
  };
  await repo.put("tasks", task);
  refresh();
  return { ok: true, message: existing ? "Evento actualizado." : "Agendado." };
}

export async function completeTask(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const t = await repo.get("tasks", s(fd, "id"));
  if (!t) return { ok: false, message: "El evento ya no existe." };
  const outcome = s(fd, "outcome").slice(0, 1500);
  const status = s(fd, "status") === "cancelada" ? "cancelada" : "hecha";
  await repo.put("tasks", { ...t, status, outcome, completedAt: new Date().toISOString() });

  if (t.contactId && status === "hecha") {
    const kind = t.type === "visita" ? "visita" : t.type === "llamado" ? "llamado" : "nota";
    await logActivity({
      kind,
      text: `${taskTypeLabel[t.type]} ${t.type === "llamado" ? "realizado" : t.type === "tarea" ? "hecha" : "realizada"}${outcome ? `: ${outcome}` : "."}`,
      contactId: t.contactId,
      propertyId: t.propertyId,
      dealId: null,
      userId: user.id,
    });
    const c = await repo.get("contacts", t.contactId);
    if (c) await repo.put("contacts", { ...c, lastContactAt: new Date().toISOString() });
  }
  // Seguimiento opcional: crea la próxima tarea en un paso.
  const followDays = Number(s(fd, "followUpDays"));
  if (followDays > 0 && status === "hecha") {
    const due = new Date(Date.now() + followDays * 86400000);
    await repo.put("tasks", {
      ...t,
      id: newId("tk"),
      type: "llamado",
      title: `Seguimiento: ${t.title.replace(/^Seguimiento: /, "")}`,
      dueAt: fromArLocal(due.toISOString().slice(0, 10), "10:00").toISOString(),
      durationMin: 15,
      status: "pendiente",
      outcome: "",
      notes: outcome ? `Resultado anterior: ${outcome}` : "",
      createdAt: new Date().toISOString(),
      completedAt: null,
    });
  }
  refresh();
  return { ok: true, message: status === "hecha" ? "Marcado como hecho." : "Cancelado." };
}

export async function reopenTask(id: string) {
  await requireUser();
  const t = await repo.get("tasks", id);
  if (t) await repo.put("tasks", { ...t, status: "pendiente", completedAt: null });
  refresh();
}

export async function deleteTask(id: string) {
  await requireUser();
  await repo.remove("tasks", id);
  refresh();
}

/* ───────────── Oportunidades ───────────── */

export async function saveDeal(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const contactId = idOrNull(s(fd, "contactId"));
  const propertyId = idOrNull(s(fd, "propertyId"));
  if (!contactId && !propertyId) return { ok: false, message: "Vinculá un contacto o una propiedad." };
  const [contact, property] = await Promise.all([
    contactId ? repo.get("contacts", contactId) : null,
    propertyId ? repo.getProperty(propertyId) : null,
  ]);
  const stage = s(fd, "stage");
  const operation = s(fd, "operation");
  const currency = s(fd, "currency");
  const id = s(fd, "id");
  const existing = id ? await repo.get("deals", id) : null;
  const now = new Date().toISOString();
  const deal: Deal = {
    id: existing?.id ?? newId("dl"),
    title: s(fd, "title") || [contact?.name.split(" ").slice(-1)[0], property?.title].filter(Boolean).join(" · ") || "Oportunidad",
    contactId,
    propertyId,
    operation: (OPERATIONS as readonly string[]).includes(operation) ? (operation as Deal["operation"]) : property?.operation ?? "venta",
    stage: (DEAL_STAGES as readonly string[]).includes(stage) ? (stage as DealStage) : "interesado",
    value: nOrNull(s(fd, "value")) ?? property?.price ?? null,
    currency: (CURRENCIES as readonly string[]).includes(currency) ? (currency as Deal["currency"]) : property?.currency ?? "USD",
    commissionPct: nOrNull(s(fd, "commissionPct")) ?? property?.mandate?.commissionPct ?? 3,
    assignedTo: idOrNull(s(fd, "assignedTo")) ?? existing?.assignedTo ?? user.id,
    expectedClose: s(fd, "expectedClose") || null,
    lostReason: s(fd, "lostReason").slice(0, 500),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await repo.put("deals", deal);
  if (!existing) {
    await logActivity({ kind: "sistema", text: `Nueva oportunidad: ${deal.title}.`, contactId, propertyId, dealId: deal.id, userId: user.id });
  }
  refresh();
  return { ok: true, message: "Oportunidad guardada." };
}

export async function moveDeal(id: string, stage: DealStage) {
  const user = await requireUser();
  if (!(DEAL_STAGES as readonly string[]).includes(stage)) return;
  const d = await repo.get("deals", id);
  if (!d || d.stage === stage) return;
  await repo.put("deals", { ...d, stage, updatedAt: new Date().toISOString() });
  const labels: Record<DealStage, string> = {
    interesado: "Interesado",
    visita: "Visitó",
    oferta: "Oferta",
    reserva: "Reserva",
    boleto: "Boleto",
    cerrada: "Escriturada",
    perdida: "Perdida",
  };
  await logActivity({ kind: "sistema", text: `${d.title}: pasó a ${labels[stage]}.`, contactId: d.contactId, propertyId: d.propertyId, dealId: d.id, userId: user.id });
  refresh();
}

export async function deleteDeal(id: string) {
  await requireUser();
  await repo.remove("deals", id);
  refresh();
}

/* ───────────── Contratos de alquiler ───────────── */

export async function saveContract(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const start = s(fd, "start");
  const end = s(fd, "end");
  const errors: Record<string, string> = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) errors.start = "Fecha de inicio";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(end)) errors.end = "Fecha de fin";
  if (!errors.start && !errors.end && end <= start) errors.end = "Debe ser posterior al inicio";
  const rent = nOrNull(s(fd, "rent"));
  if (!rent || rent <= 0) errors.rent = "Monto del alquiler";
  const propertyLabel = s(fd, "propertyLabel");
  const propertyId = idOrNull(s(fd, "propertyId"));
  if (!propertyLabel && !propertyId) errors.propertyLabel = "Indicá la propiedad";
  if (Object.keys(errors).length) return { ok: false, message: "Revisá los campos marcados.", errors };

  const property = propertyId ? await repo.getProperty(propertyId) : null;
  const index = s(fd, "adjustIndex");
  const currency = s(fd, "currency");
  const id = s(fd, "id");
  const existing = id ? await repo.get("contracts", id) : null;
  const contract: Contract = {
    id: existing?.id ?? newId("co"),
    propertyId,
    propertyLabel: propertyLabel || (property ? `${property.title} · ${property.neighborhood}` : ""),
    tenantId: idOrNull(s(fd, "tenantId")),
    ownerId: idOrNull(s(fd, "ownerId")),
    start,
    end,
    rent: rent!,
    currency: (CURRENCIES as readonly string[]).includes(currency) ? (currency as Contract["currency"]) : "ARS",
    adjustIndex: (ADJUST_INDEXES as readonly string[]).includes(index) ? (index as Contract["adjustIndex"]) : "ICL",
    adjustEveryMonths: Math.max(0, Math.min(24, Number(s(fd, "adjustEveryMonths")) || 0)),
    payDay: Math.max(1, Math.min(28, Number(s(fd, "payDay")) || 10)),
    deposit: nOrNull(s(fd, "deposit")),
    notes: String(fd.get("notes") ?? "").slice(0, 2000),
    active: fd.get("active") === "on",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  await repo.put("contracts", contract);
  refresh();
  if (!existing) redirect("/panel/alquileres?creado=1");
  return { ok: true, message: "Contrato guardado." };
}

export async function deleteContract(fd: FormData) {
  await requireUser("admin");
  const id = s(fd, "id");
  if (id) await repo.remove("contracts", id);
  refresh();
  redirect("/panel/alquileres");
}

/* ───────────── Consultas → contactos ───────────── */

export async function convertLead(fd: FormData) {
  await requireUser();
  const lead = await repo.getLead(s(fd, "id"));
  if (!lead) redirect("/panel/consultas");
  const property = lead.propertyId ? await repo.getProperty(lead.propertyId) : null;
  // Si ya entró al CRM (consulta automática o contacto previo), se abre ese contacto.
  const contact = (await findContact(lead.phone, lead.email)) ?? (await contactFromLead(lead, property));
  if (lead.status === "nuevo") await repo.saveLead({ ...lead, status: "contactado" });
  refresh();
  redirect(`/panel/contactos/${contact.id}`);
}
