import Link from "next/link";
import { site } from "@/site.config";
import { requireUser } from "@/lib/auth";
import { canSee, fmtAr, waNumber } from "@/lib/crm";
import { findContact } from "@/lib/crm-server";
import { repo } from "@/lib/data";
import { formatPrice, formatRelative, imageAt } from "@/lib/format";
import { leadKindLabel, leadStatusLabel } from "@/lib/labels";
import type { Lead } from "@/lib/types";
import { convertLead } from "../../crm-actions";
import { LeadEditor } from "@/components/panel/lead-editor";
import { InboxKeys } from "@/components/panel/inbox-keys";
import { TaskButton } from "@/components/panel/shell/dialogs";

export const metadata = { title: "Consultas" };

type SP = { carpeta?: string; id?: string; q?: string };

const FOLDERS: { id: string; label: string; test: (l: Lead, now: number) => boolean }[] = [
  { id: "nuevas", label: "Sin responder", test: (l) => l.status === "nuevo" },
  { id: "demoradas", label: "Esperando más de 2 h", test: (l, now) => l.status === "nuevo" && now - new Date(l.createdAt).getTime() > 2 * 3600000 },
  { id: "visitas", label: "Pedidos de visita", test: (l) => l.kind === "visita" && l.status !== "cerrado" && l.status !== "descartado" },
  { id: "tasaciones", label: "Tasaciones", test: (l) => l.kind === "tasacion" && l.status !== "cerrado" && l.status !== "descartado" },
  { id: "seguimiento", label: "En seguimiento", test: (l) => ["contactado", "visita agendada", "negociación"].includes(l.status) },
  { id: "todas", label: "Todas", test: () => true },
  { id: "archivo", label: "Cerradas y descartadas", test: (l) => l.status === "cerrado" || l.status === "descartado" },
];

export default async function Inbox({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [leads, props, users] = await Promise.all([repo.listLeads(), repo.listProperties(), repo.listUsers()]);
  const pById = new Map(props.map((p) => [p.id, p]));
  const uById = new Map(users.map((u) => [u.id, u]));
  const now = Date.now();

  const mine = leads.filter((l) => canSee(user, l.assignedTo));
  const folder = FOLDERS.find((f) => f.id === sp.carpeta) ?? FOLDERS[0];
  const q = sp.q?.trim().toLowerCase();
  const rows = mine
    .filter((l) => folder.test(l, now))
    .filter((l) => !q || [l.name, l.email, l.phone, l.message].join(" ").toLowerCase().includes(q))
    .sort((a, b) => (folder.id === "nuevas" || folder.id === "demoradas" ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)));
  // La consulta abierta se mantiene aunque, al cambiarle el estado, salga de la carpeta actual.
  const selected = (sp.id ? mine.find((l) => l.id === sp.id) : null) ?? rows[0] ?? null;
  const property = selected?.propertyId ? pById.get(selected.propertyId) : null;
  const contact = selected ? await findContact(selected.phone, selected.email) : null;

  const href = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/panel/consultas?${p.toString()}`;
  };

  const first = selected?.name.split(" ")[0] ?? "";
  const me = user.name.split(" ")[0];
  const replies = selected
    ? [
        {
          label: "Respuesta inicial",
          text: property
            ? `Hola ${first}, soy ${me}, de ${site.legalName}. Gracias por consultar por ${property.title} (${property.code}). ¿Cuándo te queda cómodo que hablemos o coordinar una visita?`
            : `Hola ${first}, soy ${me}, de ${site.legalName}. Gracias por escribirnos. ¿Me contás un poco más de lo que estás buscando?`,
        },
        ...(property
          ? [{ label: "Enviar la ficha", text: `Hola ${first}, te paso la ficha completa con fotos y ubicación: ${site.url}/propiedades/${property.slug}` }]
          : []),
        { label: "Proponer horarios de visita", text: `Hola ${first}, podemos visitarla mañana a las 11 o a las 17 h. ¿Qué horario te queda mejor?` },
      ]
    : [];

  const sla = (l: Lead) => {
    const h = (now - new Date(l.createdAt).getTime()) / 3600000;
    return l.status === "nuevo" && h > 2 ? "late" : l.status === "nuevo" ? "new" : "ok";
  };

  return (
    <div className="inbox">
      <InboxKeys ids={rows.map((r) => r.id)} current={selected?.id ?? null} base={href({ id: undefined })} />

      <nav className="inbox__folders" aria-label="Carpetas">
        <p className="inbox__h">Bandeja</p>
        {FOLDERS.map((f) => {
          const n = mine.filter((l) => f.test(l, now)).length;
          return (
            <Link key={f.id} href={`/panel/consultas?carpeta=${f.id}`} aria-current={folder.id === f.id ? "page" : undefined} className={f.id === "demoradas" && n ? "is-alert" : ""}>
              <span>{f.label}</span>
              <span className="num">{n}</span>
            </Link>
          );
        })}
        <a className="inbox__export" href="/panel/consultas/exportar">
          Exportar a Excel (CSV)
        </a>
      </nav>

      <section className="inbox__list" aria-label="Consultas">
        <form className="inbox__search">
          <input type="hidden" name="carpeta" value={folder.id} />
          <input type="search" name="q" defaultValue={sp.q} placeholder="Buscar en consultas" aria-label="Buscar" />
        </form>
        {rows.length === 0 ? (
          <p className="pempty" style={{ padding: "24px 18px" }}>
            No hay consultas en esta carpeta.
          </p>
        ) : (
          <ul>
            {rows.map((l) => {
              const p = l.propertyId ? pById.get(l.propertyId) : null;
              const s = sla(l);
              return (
                <li key={l.id}>
                  <Link href={href({ id: l.id })} className={`irow ${selected?.id === l.id ? "is-active" : ""} ${l.status === "nuevo" ? "is-unread" : ""}`} scroll={false}>
                    <span className="irow__top">
                      <strong>{l.name}</strong>
                      <span className={`irow__time irow__time--${s}`}>{formatRelative(l.createdAt).replace("hace ", "")}</span>
                    </span>
                    <span className="irow__kind">
                      {leadKindLabel[l.kind]}
                      {p ? ` · ${p.code}` : ""}
                    </span>
                    <span className="irow__msg">{l.message || "Sin mensaje"}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <p className="inbox__keys">
          <kbd>J</kbd> <kbd>K</kbd> moverse · <kbd>R</kbd> responder · <kbd>A</kbd> agendar
        </p>
      </section>

      <section className="inbox__detail" aria-label="Detalle">
        {!selected ? (
          <p className="pempty">Elegí una consulta.</p>
        ) : (
          <>
            <header className="idet__head">
              <div>
                <p className="idet__kind">
                  {leadKindLabel[selected.kind]} · {fmtAr(selected.createdAt, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                </p>
                <h1 className="idet__name">{selected.name}</h1>
                <p className="idet__contact">
                  {selected.phone && <span>{selected.phone}</span>}
                  {selected.email && <a href={`mailto:${selected.email}`}>{selected.email}</a>}
                  <span className={`idet__status idet__status--${sla(selected)}`}>{leadStatusLabel[selected.status]}</span>
                </p>
              </div>
              <div className="idet__actions">
                {contact ? (
                  <Link className="btn btn--ghost btn--s" href={`/panel/contactos/${contact.id}`}>
                    Ver contacto
                  </Link>
                ) : (
                  <form action={convertLead}>
                    <input type="hidden" name="id" value={selected.id} />
                    <button className="btn btn--ghost btn--s">Crear contacto</button>
                  </form>
                )}
                <TaskButton
                  className="btn btn--ghost btn--s"
                  prefill={{ type: selected.kind === "tasacion" ? "tasacion" : "visita", propertyId: selected.propertyId, contactId: contact?.id ?? null, title: `${selected.kind === "tasacion" ? "Tasación" : "Visita"} con ${selected.name}`, notes: selected.preferredDate ? `Día preferido: ${selected.preferredDate}` : "" }}
                >
                  <span data-key="a">Agendar</span>
                </TaskButton>
              </div>
            </header>

            <blockquote className="idet__msg">{selected.message || "El cliente no dejó mensaje."}</blockquote>

            {Object.keys(selected.details).length > 0 && (
              <dl className="idet__details">
                {Object.entries(selected.details).map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
                {selected.preferredDate && (
                  <div>
                    <dt>Día preferido</dt>
                    <dd>{selected.preferredDate}</dd>
                  </div>
                )}
              </dl>
            )}

            {property && (
              <Link href={`/panel/propiedades/${property.id}`} className="idet__prop">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {property.images[0] && <img src={imageAt(property.images[0].url, 640)} alt="" />}
                <span>
                  <strong>{property.title}</strong>
                  <span>
                    {property.code} · {property.neighborhood} · {formatPrice(property)}
                  </span>
                </span>
              </Link>
            )}

            {selected.phone && (
              <div className="idet__replies">
                <p className="idet__h">Responder por WhatsApp</p>
                {replies.map((r, i) => (
                  <a key={r.label} href={`https://wa.me/${waNumber(selected.phone)}?text=${encodeURIComponent(r.text)}`} target="_blank" rel="noopener" className="ireply" data-key={i === 0 ? "r" : undefined}>
                    <strong>{r.label}</strong>
                    <span>{r.text}</span>
                  </a>
                ))}
              </div>
            )}

            <div className="idet__manage">
              <p className="idet__h">Gestión</p>
              <LeadEditor key={selected.id} lead={selected} users={users.filter((u) => u.active).map((u) => ({ id: u.id, name: u.name }))} />
              <p className="tiny muted" style={{ marginTop: 8 }}>
                Asignada a {selected.assignedTo ? uById.get(selected.assignedTo)?.name : "nadie todavía"} · Origen: {selected.source ? "formulario web" : "—"}
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
