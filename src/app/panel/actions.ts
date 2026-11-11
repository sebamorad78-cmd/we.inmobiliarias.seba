"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authenticate, createSession, destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { repo } from "@/lib/data";
import { slugify } from "@/lib/format";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  CURRENCIES,
  LEAD_STATUSES,
  OPERATIONS,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  USER_ROLES,
  type Property,
  type TeamUser,
} from "@/lib/types";

export interface ActionState {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
}

function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) out[String(i.path[0])] ??= i.message;
  return out;
}

/* ───────────── Sesión ───────────── */

export async function login(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const ip = await clientIp();
  if (!rateLimit(`login:${ip}`, 8, 15 * 60 * 1000)) {
    return { ok: false, message: "Demasiados intentos. Esperá 15 minutos y volvé a probar." };
  }
  if (!email || !password) return { ok: false, message: "Completá email y contraseña." };
  const user = await authenticate(email, password);
  if (!user) return { ok: false, message: "Email o contraseña incorrectos." };
  try {
    await createSession(user.id);
  } catch (err) {
    console.error("[login]", err);
    return { ok: false, message: "El panel no está configurado: falta la variable SESSION_SECRET en el servidor." };
  }
  const next = String(fd.get("next") ?? "");
  redirect(next.startsWith("/panel") ? next : "/panel");
}

export async function logout() {
  await destroySession();
  redirect("/panel/ingresar");
}

/* ───────────── Propiedades ───────────── */

const optInt = z.preprocess(
  (v) => (v === "" || v == null ? null : Number(String(v).replace(/\./g, "").replace(",", "."))),
  z.number().int("Debe ser un número entero").min(0, "No puede ser negativo").nullable(),
);
const optFloat = z.preprocess(
  (v) => (v === "" || v == null ? null : Number(String(v).replace(",", "."))),
  z.number().finite().nullable(),
);
const optText = z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : null), z.string().max(300).nullable());
const bool = z.preprocess((v) => v === "on" || v === "true" || v === "1", z.boolean());

const propertySchema = z.object({
  title: z.string().trim().min(6, "Escribí un título de al menos 6 caracteres").max(120),
  code: z.string().trim().max(20).optional(),
  operation: z.enum(OPERATIONS),
  type: z.enum(PROPERTY_TYPES),
  status: z.enum(PROPERTY_STATUSES),
  featured: bool,
  price: optInt,
  currency: z.enum(CURRENCIES),
  expenses: optInt,
  neighborhood: z.string().trim().min(2, "Indicá el barrio").max(60),
  city: z.string().trim().min(2, "Indicá la localidad o zona").max(60),
  address: z.string().trim().max(160).default(""),
  showExactLocation: bool,
  lat: optFloat.refine((v) => v == null || (v >= -90 && v <= 90), "Latitud inválida"),
  lng: optFloat.refine((v) => v == null || (v >= -180 && v <= 180), "Longitud inválida"),
  coveredArea: optInt,
  totalArea: optInt,
  rooms: optInt,
  bedrooms: optInt,
  bathrooms: optInt,
  garages: optInt,
  age: optInt,
  floor: optText,
  orientation: optText,
  mortgageEligible: bool,
  professionalUse: bool,
  description: z.string().trim().min(40, "La descripción es muy corta (mínimo 40 caracteres)").max(8000),
  videoUrl: optText.refine((v) => v == null || /^https:\/\//.test(v), "Debe ser un enlace https://"),
  tourUrl: optText.refine((v) => v == null || /^https:\/\//.test(v), "Debe ser un enlace https://"),
  agentId: optText,
});

const imagesSchema = z
  .array(z.object({ url: z.string().min(1).max(1000), alt: z.string().max(160) }))
  .max(60, "Máximo 60 fotos");

export async function saveProperty(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(fd.get("id") ?? "");
  const parsed = propertySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: "Revisá los campos marcados.", errors: fieldErrors(parsed.error) };

  let images: Property["images"];
  try {
    images = imagesSchema.parse(JSON.parse(String(fd.get("images") ?? "[]")));
  } catch {
    return { ok: false, message: "No se pudieron leer las fotos.", errors: { images: "Error en las fotos" } };
  }
  const d = parsed.data;
  if (d.status === "publicada" && images.length === 0) {
    return { ok: false, message: "Para publicar, cargá al menos una foto.", errors: { images: "Cargá al menos una foto" } };
  }

  const amenities = fd.getAll("amenities").map(String).filter(Boolean).slice(0, 40);
  const all = await repo.listProperties();
  const existing = id ? all.find((p) => p.id === id) : undefined;
  if (id && !existing) return { ok: false, message: "La propiedad ya no existe." };

  // Código: el cargado, o el siguiente correlativo.
  let code = d.code?.toUpperCase() || existing?.code || "";
  if (!code) {
    const max = all.reduce((m, p) => Math.max(m, Number(p.code.replace(/\D/g, "")) || 0), 1000);
    code = `RB-${max + 1}`;
  }
  if (all.some((p) => p.code === code && p.id !== existing?.id)) {
    return { ok: false, message: "Ese código ya está en uso.", errors: { code: "Código repetido" } };
  }

  // Slug único y estable: no cambia al editar, para no romper enlaces ya compartidos.
  let slug = existing?.slug ?? "";
  if (!slug) {
    const base = slugify(`${d.title} ${d.neighborhood}`) || "propiedad";
    slug = base;
    let n = 2;
    while (all.some((p) => p.slug === slug)) slug = `${base}-${n++}`;
  }

  const now = new Date().toISOString();
  const property: Property = {
    ...d,
    id: existing?.id ?? `prop_${randomUUID().slice(0, 12)}`,
    slug,
    code,
    address: d.address ?? "",
    amenities,
    images,
    agentId: d.agentId ?? (user.role === "agente" ? user.id : null),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await repo.saveProperty(property);
  revalidatePath("/", "layout");
  if (!existing) redirect(`/panel/propiedades/${property.id}?creada=1`);
  return { ok: true, message: "Cambios guardados." };
}

export async function deleteProperty(fd: FormData) {
  await requireUser("admin");
  const id = String(fd.get("id") ?? "");
  if (id) await repo.deleteProperty(id);
  revalidatePath("/", "layout");
  redirect("/panel/propiedades?eliminada=1");
}

export async function setPropertyStatus(fd: FormData) {
  await requireUser();
  const id = String(fd.get("id") ?? "");
  const status = z.enum(PROPERTY_STATUSES).safeParse(fd.get("status"));
  const p = id ? await repo.getProperty(id) : null;
  if (!p || !status.success) return;
  await repo.saveProperty({ ...p, status: status.data, updatedAt: new Date().toISOString() });
  revalidatePath("/", "layout");
}

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function uploadImages(fd: FormData): Promise<{ urls: string[]; error?: string }> {
  await requireUser();
  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { urls: [], error: "No se recibieron archivos." };
  if (files.length > 20) return { urls: [], error: "Subí hasta 20 fotos por vez." };
  for (const f of files) {
    if (!ALLOWED_IMAGE_TYPES.has(f.type)) return { urls: [], error: `Formato no admitido: ${f.name}. Usá JPG, PNG o WebP.` };
    if (f.size > 10 * 1024 * 1024) return { urls: [], error: `${f.name} supera los 10 MB.` };
  }
  try {
    const urls = await Promise.all(files.map((f) => repo.uploadImage(f, "propiedades")));
    return { urls };
  } catch (err) {
    console.error("[upload]", err);
    return { urls: [], error: "No se pudieron subir las fotos. Probá de nuevo." };
  }
}

/* ───────────── Consultas ───────────── */

export async function updateLead(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const id = String(fd.get("id") ?? "");
  const lead = await repo.getLead(id);
  if (!lead) return { ok: false, message: "La consulta no existe." };
  const status = z.enum(LEAD_STATUSES).safeParse(fd.get("status"));
  const assignedTo = String(fd.get("assignedTo") ?? "") || null;
  const notes = String(fd.get("notes") ?? "").slice(0, 5000);
  await repo.saveLead({ ...lead, status: status.success ? status.data : lead.status, assignedTo, notes });
  revalidatePath("/panel", "layout");
  return { ok: true, message: "Consulta actualizada." };
}

/* ───────────── Equipo ───────────── */

const userSchema = z.object({
  name: z.string().trim().min(2, "Ingresá el nombre").max(80),
  email: z.email("Email inválido").trim().toLowerCase(),
  phone: z.string().trim().max(30).default(""),
  role: z.enum(USER_ROLES),
  title: z.string().trim().max(80).default(""),
  license: optText,
  bio: z.string().trim().max(400).default(""),
  active: bool,
  public: bool,
  password: z.string().max(200).optional(),
});

export async function saveUser(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser("admin");
  const id = String(fd.get("id") ?? "");
  const parsed = userSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: "Revisá los campos marcados.", errors: fieldErrors(parsed.error) };
  const { password, ...d } = parsed.data;

  const existing = id ? await repo.getUser(id) : null;
  const sameEmail = await repo.getUserByEmail(d.email);
  if (sameEmail && sameEmail.id !== existing?.id) {
    return { ok: false, message: "Ya existe un usuario con ese email.", errors: { email: "Email en uso" } };
  }
  if (password && password.length < 10) {
    return { ok: false, message: "La contraseña debe tener al menos 10 caracteres.", errors: { password: "Mínimo 10 caracteres" } };
  }
  if (!existing && !password) {
    return { ok: false, message: "Definí una contraseña inicial.", errors: { password: "Obligatoria para usuarios nuevos" } };
  }
  if (existing?.id === me.id && (!d.active || d.role !== "admin")) {
    return { ok: false, message: "No podés quitarte el acceso de administrador a vos mismo." };
  }

  const user: TeamUser = {
    ...d,
    phone: d.phone.replace(/[^\d]/g, ""),
    id: existing?.id ?? `usr_${randomUUID().slice(0, 8)}`,
    passwordHash: password ? await hashPassword(password) : (existing?.passwordHash ?? ""),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  await repo.saveUser(user);
  revalidatePath("/", "layout");
  if (!existing) redirect("/panel/equipo?creado=1");
  return { ok: true, message: "Usuario guardado." };
}

export async function changeOwnPassword(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (!(await verifyPassword(current, me.passwordHash))) {
    return { ok: false, message: "La contraseña actual no es correcta.", errors: { current: "Incorrecta" } };
  }
  if (next.length < 10) return { ok: false, message: "Usá al menos 10 caracteres.", errors: { next: "Mínimo 10 caracteres" } };
  if (next !== confirm) return { ok: false, message: "Las contraseñas no coinciden.", errors: { confirm: "No coincide" } };
  await repo.saveUser({ ...me, passwordHash: await hashPassword(next) });
  return { ok: true, message: "Contraseña actualizada." };
}
