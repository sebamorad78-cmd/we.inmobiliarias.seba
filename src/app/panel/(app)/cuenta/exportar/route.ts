import { NextResponse, type NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { contactKindLabel, dealStageLabel, taskTypeLabel } from "@/lib/crm";
import { repo } from "@/lib/data";
import { leadKindLabel, leadStatusLabel, operationLabel, statusLabel, typeLabel } from "@/lib/labels";
import { site } from "@/site.config";
import { buildXlsx, type Cell } from "@/lib/xlsx";

const AR = "America/Argentina/Buenos_Aires";
const date = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("es-AR", { timeZone: AR, day: "2-digit", month: "2-digit", year: "numeric" }) : "";
const dateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("es-AR", { timeZone: AR, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
const ymd = (s: string | null | undefined) => (s ? s.split("-").reverse().join("/") : "");
/** Evita que Excel interprete un texto como fórmula. */
const txt = (v: string | null | undefined): Cell => {
  const s = v ?? "";
  return /^[=+\-@]/.test(s) ? `'${s}` : s;
};

/**
 * Descarga de todos los datos de la inmobiliaria.
 * - Por defecto: una planilla Excel con una hoja por tema.
 * - ?formato=json: copia completa en formato técnico, para migrar a otro sistema.
 */
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/panel/ingresar", req.url));
  if (user.role !== "admin") return NextResponse.redirect(new URL("/panel/cuenta", req.url));

  const [properties, leads, users, contacts, tasks, deals, activities, contracts] = await Promise.all([
    repo.listProperties(),
    repo.listLeads(),
    repo.listUsers(),
    repo.list("contacts"),
    repo.list("tasks"),
    repo.list("deals"),
    repo.list("activities"),
    repo.list("contracts"),
  ]);
  const stamp = new Date().toLocaleDateString("sv-SE", { timeZone: AR });
  const base = `${site.legalName} - datos ${stamp}`;

  if (req.nextUrl.searchParams.get("formato") === "json") {
    const team = users.map(({ passwordHash: _omit, ...u }) => u);
    const body = JSON.stringify(
      { exportedAt: new Date().toISOString(), site: site.legalName, properties, contacts, leads, tasks, deals, activities, contracts, team },
      null,
      2,
    );
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(base)}.json`,
        "Cache-Control": "no-store",
      },
    });
  }

  const prop = new Map(properties.map((p) => [p.id, p]));
  const contact = new Map(contacts.map((c) => [c.id, c]));
  const userName = new Map(users.map((u) => [u.id, u.name]));
  const propLabel = (id: string | null | undefined) => (id && prop.get(id) ? `${prop.get(id)!.code} · ${prop.get(id)!.title}` : "");
  const contactName = (id: string | null | undefined) => (id ? contact.get(id)?.name ?? "" : "");

  const file = buildXlsx([
    {
      name: "Propiedades",
      header: ["Código", "Título", "Operación", "Tipo", "Estado", "Precio", "Moneda", "Expensas", "Dirección", "Zona", "Localidad", "Sup. cubierta (m²)", "Sup. total (m²)", "Ambientes", "Dormitorios", "Baños", "Cocheras", "Antigüedad", "Propietario", "Autorización", "Vence autorización", "Comisión (%)", "Fotos", "Link en la web", "Descripción", "Alta", "Última modificación"],
      rows: properties.map((p) => [
        p.code, txt(p.title), operationLabel[p.operation], typeLabel[p.type], statusLabel[p.status],
        p.price, p.currency, p.expenses, txt(p.address), txt(p.neighborhood), txt(p.city),
        p.coveredArea, p.totalArea, p.rooms, p.bedrooms, p.bathrooms, p.garages, p.age,
        contactName(p.ownerContactId), p.mandate?.kind ?? "", ymd(p.mandate?.expires), p.mandate?.commissionPct ?? null,
        p.images.map((i) => (i.url.startsWith("/") ? site.url + i.url : i.url)).join("\n"),
        `${site.url}/propiedades/${p.slug}`, txt(p.description), date(p.createdAt), date(p.updatedAt),
      ]),
    },
    {
      name: "Contactos",
      header: ["Nombre", "Teléfono", "Email", "Tipo", "Origen", "Busca", "Zonas", "Presupuesto máx.", "Moneda", "Notas", "Responsable", "Último contacto", "Alta"],
      rows: contacts
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "es"))
        .map((c) => [
          txt(c.name), txt(c.phone), txt(c.email), c.kinds.map((k) => contactKindLabel[k]).join(", "), txt(c.source),
          c.search ? `${operationLabel[c.search.operation]}${c.search.types.length ? ` · ${c.search.types.map((t) => typeLabel[t]).join(", ")}` : ""}` : "",
          c.search?.zones.join(", ") ?? "", c.search?.maxPrice ?? null, c.search?.currency ?? "", txt(c.notes),
          c.assignedTo ? userName.get(c.assignedTo) ?? "" : "", date(c.lastContactAt), date(c.createdAt),
        ]),
    },
    {
      name: "Consultas web",
      header: ["Fecha", "Tipo", "Estado", "Nombre", "Teléfono", "Email", "Propiedad", "Mensaje", "Detalles", "Notas", "Responsable"],
      rows: leads
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((l) => [
          dateTime(l.createdAt), leadKindLabel[l.kind], leadStatusLabel[l.status], txt(l.name), txt(l.phone), txt(l.email),
          propLabel(l.propertyId), txt(l.message), Object.entries(l.details).map(([k, v]) => `${k}: ${v}`).join("\n"), txt(l.notes),
          l.assignedTo ? userName.get(l.assignedTo) ?? "" : "",
        ]),
    },
    {
      name: "Agenda",
      header: ["Fecha y hora", "Tipo", "Título", "Estado", "Contacto", "Propiedad", "Resultado", "Notas", "Responsable"],
      rows: tasks
        .slice()
        .sort((a, b) => b.dueAt.localeCompare(a.dueAt))
        .map((t) => [
          dateTime(t.dueAt), taskTypeLabel[t.type], txt(t.title), t.status.charAt(0).toUpperCase() + t.status.slice(1),
          contactName(t.contactId), propLabel(t.propertyId), txt(t.outcome), txt(t.notes), t.assignedTo ? userName.get(t.assignedTo) ?? "" : "",
        ]),
    },
    {
      name: "Negocios",
      header: ["Negocio", "Etapa", "Operación", "Valor", "Moneda", "Comisión (%)", "Contacto", "Propiedad", "Cierre estimado", "Motivo de pérdida", "Alta"],
      rows: deals.map((d) => [
        txt(d.title), dealStageLabel[d.stage], operationLabel[d.operation], d.value, d.currency, d.commissionPct,
        contactName(d.contactId), propLabel(d.propertyId), ymd(d.expectedClose), txt(d.lostReason), date(d.createdAt),
      ]),
    },
    {
      name: "Alquileres",
      header: ["Propiedad", "Inquilino", "Propietario", "Inicio", "Fin", "Alquiler", "Moneda", "Ajuste", "Cada (meses)", "Día de pago", "Depósito", "Vigente", "Notas"],
      rows: contracts.map((c) => [
        txt(c.propertyLabel || propLabel(c.propertyId)), contactName(c.tenantId), contactName(c.ownerId), ymd(c.start), ymd(c.end),
        c.rent, c.currency, c.adjustIndex, c.adjustEveryMonths, c.payDay, c.deposit, c.active ? "Sí" : "No", txt(c.notes),
      ]),
    },
    {
      name: "Historial",
      header: ["Fecha", "Tipo", "Detalle", "Contacto", "Propiedad", "Usuario"],
      rows: activities
        .slice()
        .sort((a, b) => b.at.localeCompare(a.at))
        .map((a) => [dateTime(a.at), a.kind.charAt(0).toUpperCase() + a.kind.slice(1), txt(a.text), contactName(a.contactId), propLabel(a.propertyId), a.userId ? userName.get(a.userId) ?? "" : ""]),
    },
  ]);

  return new NextResponse(file as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(base)}.xlsx`,
      "Cache-Control": "no-store",
    },
  });
}
