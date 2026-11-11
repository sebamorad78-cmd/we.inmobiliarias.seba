import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/site.config";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatDate, formatPrice, whatsappLink } from "@/lib/format";
import { leadKindLabel } from "@/lib/labels";
import { Icon } from "@/components/icon";
import { LeadEditor } from "@/components/panel/lead-editor";

export const metadata = { title: "Consulta" };

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const lead = await repo.getLead(id);
  if (!lead) notFound();
  if (user.role === "agente" && lead.assignedTo && lead.assignedTo !== user.id) notFound();
  const [property, users, all] = await Promise.all([lead.propertyId ? repo.getProperty(lead.propertyId) : null, repo.listUsers(), repo.listLeads()]);
  const history = all.filter((l) => l.id !== lead.id && ((lead.email && l.email === lead.email) || (lead.phone && l.phone === lead.phone)));

  const first = lead.name.split(" ")[0];
  const waText = property
    ? `Hola ${first}, te escribo de ${site.name} por tu consulta sobre ${property.title} (${property.code}).`
    : `Hola ${first}, te escribo de ${site.name} por tu consulta.`;

  return (
    <div className="pmain pmain--form">
      <Link href="/panel/consultas" className="back"><Icon name="arrowLeft" size={16} /> Consultas</Link>
      <header className="pmain__head">
        <div>
          <p className="eyebrow eyebrow--plain">{leadKindLabel[lead.kind]}</p>
          <h1 className="h2">{lead.name}</h1>
          <p className="tiny muted">Recibida el {formatDate(lead.createdAt, { dateStyle: "full", timeStyle: "short" })}</p>
        </div>
        <div className="row" style={{ flexWrap: "wrap" }}>
          {lead.phone && (
            <a className="btn btn--wa btn--s" href={whatsappLink(lead.phone.replace(/^0/, "54"), waText)} target="_blank" rel="noopener"><Icon name="whatsapp" size={16} /> Responder por WhatsApp</a>
          )}
          {lead.phone && <a className="btn btn--ghost btn--s" href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}><Icon name="phone" size={16} /> Llamar</a>}
          {lead.email && (
            <a className="btn btn--ghost btn--s" href={`mailto:${lead.email}?subject=${encodeURIComponent(`Tu consulta en ${site.name}${property ? ` · ${property.code}` : ""}`)}`}><Icon name="mail" size={16} /> Email</a>
          )}
        </div>
      </header>

      <div className="pgrid pgrid--lead">
        <section className="pcardbox">
          <dl className="specs specs--single">
            <div><dt>Teléfono</dt><dd>{lead.phone || "—"}</dd></div>
            <div><dt>Email</dt><dd>{lead.email || "—"}</dd></div>
            {lead.preferredDate && <div><dt>Fecha preferida</dt><dd>{lead.preferredDate}</dd></div>}
            {Object.entries(lead.details).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          {lead.message && (
            <>
              <p className="label" style={{ marginTop: 24 }}>Mensaje</p>
              <blockquote className="lead-msg">{lead.message}</blockquote>
            </>
          )}
          {lead.source && <p className="tiny muted" style={{ marginTop: 16, wordBreak: "break-all" }}>Origen: {lead.source}</p>}
        </section>

        <div className="pstack">
          {property && (
            <section className="pcardbox">
              <p className="label">Propiedad consultada</p>
              <Link href={`/panel/propiedades/${property.id}`} className="plist__row" style={{ padding: "10px 0" }}>
                <span className="plist__main"><strong>{property.title}</strong><span className="tiny muted">{property.code} · {formatPrice(property)}</span></span>
                <Icon name="chevronRight" size={16} />
              </Link>
            </section>
          )}
          <section className="pcardbox">
            <LeadEditor lead={lead} users={users.filter((u) => u.active).map((u) => ({ id: u.id, name: u.name }))} />
          </section>
          {history.length > 0 && (
            <section className="pcardbox">
              <p className="label">Otras consultas de este cliente</p>
              <ul className="plist">
                {history.map((h) => (
                  <li key={h.id}><Link href={`/panel/consultas/${h.id}`} className="plist__row"><span className="plist__main"><strong>{leadKindLabel[h.kind]}</strong><span className="tiny muted">{formatDate(h.createdAt)}</span></span></Link></li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
