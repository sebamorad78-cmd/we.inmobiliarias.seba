import "server-only";
import { site } from "@/site.config";
import { leadKindLabel } from "./labels";
import type { Lead, Property } from "./types";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Avisa por email cada consulta nueva (si RESEND_API_KEY está configurada).
 * Nunca hace fallar la consulta del cliente: la consulta ya quedó guardada en el panel.
 */
export async function notifyNewLead(lead: Lead, property: Property | null) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEADS_NOTIFY_EMAIL;
  if (!key || !to) return;

  const rows: [string, string][] = [
    ["Tipo", leadKindLabel[lead.kind]],
    ["Nombre", lead.name],
    ["Teléfono", lead.phone || "—"],
    ["Email", lead.email || "—"],
    ...(property ? ([["Propiedad", `${property.code} · ${property.title}`]] as [string, string][]) : []),
    ...(lead.preferredDate ? ([["Fecha preferida", lead.preferredDate]] as [string, string][]) : []),
    ...Object.entries(lead.details),
    ["Mensaje", lead.message || "—"],
  ];

  const html = `<table style="font-family:system-ui,sans-serif;font-size:14px;border-collapse:collapse">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#6b665c;vertical-align:top">${esc(k)}</td><td style="padding:6px 0">${esc(v).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("")}</table><p style="font-family:system-ui;font-size:13px"><a href="${site.url}/panel/consultas/${lead.id}">Abrir en el panel</a></p>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.LEADS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`,
        to: to.split(",").map((s) => s.trim()),
        reply_to: lead.email || undefined,
        subject: `Nueva ${leadKindLabel[lead.kind].toLowerCase()} · ${lead.name}${property ? ` · ${property.code}` : ""}`,
        html,
      }),
      signal: AbortSignal.timeout(6000),
    });
  } catch (err) {
    console.error("[notify] no se pudo enviar el aviso de consulta", err);
  }
}
