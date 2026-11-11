import { NextResponse, type NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { repo } from "@/lib/data";
import { leadKindLabel, leadStatusLabel } from "@/lib/labels";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  // Evita inyección de fórmulas al abrir en Excel / Sheets.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/panel/ingresar", req.url));
  const sp = req.nextUrl.searchParams;
  const [leads, props, users] = await Promise.all([repo.listLeads(), repo.listProperties(), repo.listUsers()]);
  const propById = new Map(props.map((p) => [p.id, p]));
  const userById = new Map(users.map((u) => [u.id, u]));
  const onlyMine = user.role === "agente" || sp.get("mias") === "1";

  const rows = leads
    .filter((l) => !onlyMine || !l.assignedTo || l.assignedTo === user.id)
    .filter((l) => !sp.get("estado") || l.status === sp.get("estado"))
    .filter((l) => !sp.get("tipo") || l.kind === sp.get("tipo"))
    .filter((l) => !sp.get("propiedad") || l.propertyId === sp.get("propiedad"))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const header = ["Fecha", "Tipo", "Estado", "Nombre", "Teléfono", "Email", "Propiedad", "Asignada a", "Fecha preferida", "Mensaje", "Detalles", "Notas"];
  const lines = rows.map((l) =>
    [
      new Date(l.createdAt).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }),
      leadKindLabel[l.kind],
      leadStatusLabel[l.status],
      l.name,
      l.phone,
      l.email,
      l.propertyId ? propById.get(l.propertyId)?.code ?? "" : "",
      l.assignedTo ? userById.get(l.assignedTo)?.name ?? "" : "",
      l.preferredDate ?? "",
      l.message,
      Object.entries(l.details).map(([k, v]) => `${k}: ${v}`).join(" | "),
      l.notes,
    ]
      .map(cell)
      .join(";"),
  );
  const csv = "﻿" + [header.map(cell).join(";"), ...lines].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="consultas-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
