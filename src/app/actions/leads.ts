"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { repo } from "@/lib/data";
import { notifyNewLead } from "@/lib/notify";
import { contactFromLead } from "@/lib/crm-server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { LEAD_KINDS, type Lead } from "@/lib/types";

export interface FormState {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
}

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .optional()
    .transform((v) => v ?? "");

const schema = z
  .object({
    kind: z.enum(LEAD_KINDS),
    name: z.string().trim().min(2, "Ingresá tu nombre").max(80),
    email: text(120).refine((v) => !v || z.email().safeParse(v).success, "Revisá el email"),
    phone: text(30).refine((v) => !v || v.replace(/\D/g, "").length >= 8, "Revisá el teléfono"),
    message: text(2000),
    propertyId: text(60),
    preferredDate: text(40),
    source: text(300),
  })
  .refine((d) => d.email || d.phone, { message: "Dejanos un email o un teléfono", path: ["phone"] });

const DETAIL_FIELDS: Record<string, string> = {
  address: "Ubicación",
  neighborhood: "Zona",
  propertyType: "Tipo de propiedad",
  area: "Superficie",
  rooms: "Ambientes",
  purpose: "Objetivo",
  preferredTime: "Franja horaria",
  topic: "Motivo",
};

export async function submitLead(_prev: FormState, formData: FormData): Promise<FormState> {
  // Anti-spam 1: campo trampa invisible. Un bot lo completa; una persona no lo ve.
  if (formData.get("website")) return { ok: true, message: "¡Gracias! Recibimos tu mensaje." };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, message: "Revisá los campos marcados.", errors };
  }
  const d = parsed.data;

  // Anti-spam 2: un formulario válido completado en menos de 2,5 s no lo escribió una persona.
  const startedAt = Number(formData.get("_t"));
  if (startedAt && Date.now() - startedAt < 2500) return { ok: true, message: "¡Gracias! Recibimos tu mensaje." };

  // Límite por IP (solo cuenta envíos válidos: corregir un error de tipeo no penaliza).
  const ip = await clientIp();
  if (!rateLimit(`lead:${ip}`, 6, 10 * 60 * 1000)) {
    return { ok: false, message: "Recibimos varios mensajes seguidos. Probá de nuevo en unos minutos o escribinos por WhatsApp." };
  }


  const details: Record<string, string> = {};
  for (const [field, label] of Object.entries(DETAIL_FIELDS)) {
    const v = String(formData.get(field) ?? "").trim().slice(0, 200);
    if (v) details[label] = v;
  }

  const property = d.propertyId ? await repo.getProperty(d.propertyId) : null;

  const lead: Lead = {
    id: `lead_${randomUUID()}`,
    createdAt: new Date().toISOString(),
    kind: d.kind,
    status: "nuevo",
    name: d.name,
    email: d.email.toLowerCase(),
    phone: d.phone,
    message: d.message,
    propertyId: property?.id ?? null,
    preferredDate: d.preferredDate || null,
    details,
    assignedTo: property?.agentId ?? null,
    notes: "",
    source: d.source,
  };

  try {
    await repo.saveLead(lead);
  } catch (err) {
    console.error("[leads] error al guardar", err);
    return { ok: false, message: "No pudimos enviar tu mensaje. Probá de nuevo o escribinos por WhatsApp." };
  }

  // Entra al CRM: contacto, historial y tarea de respuesta. Un fallo acá nunca afecta al cliente.
  try {
    await contactFromLead(lead, property);
  } catch (err) {
    console.error("[leads] no se pudo registrar en el CRM", err);
  }

  await notifyNewLead(lead, property);

  const firstName = d.name.split(" ")[0];
  const reply =
    d.kind === "tasacion"
      ? `Gracias, ${firstName}. Un tasador te va a contactar dentro de las próximas 24 h hábiles.`
      : d.kind === "visita"
        ? `Gracias, ${firstName}. Te confirmamos la visita a la brevedad.`
        : `Gracias, ${firstName}. Te respondemos a la brevedad.`;
  return { ok: true, message: reply };
}
