import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/data";
import { toPublicAgent } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { deleteProperty } from "../../../actions";
import { ConfirmButton } from "@/components/panel/confirm-button";
import { Icon } from "@/components/icon";
import { PropertyForm } from "@/components/panel/property-form";
import { TaskItem } from "@/components/panel/crm-ui";
import { DealButton, TaskButton } from "@/components/panel/shell/dialogs";
import { arDayKey, canSee, daysBetween, interestedIn, waNumber } from "@/lib/crm";
import { signToken } from "@/lib/auth";
import { site } from "@/site.config";

export const metadata = { title: "Editar propiedad" };

export default async function EditProperty({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ creada?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const { creada } = await searchParams;
  const [p, users, props, leads, contacts, tasks, activities, deals] = await Promise.all([
    repo.getProperty(id),
    repo.listUsers(),
    repo.listProperties(),
    repo.listLeads(),
    repo.list("contacts"),
    repo.list("tasks"),
    repo.list("activities"),
    repo.list("deals"),
  ]);
  if (!p) notFound();
  const visibleContacts = contacts.filter((c) => canSee(user, c.assignedTo));
  const interested = interestedIn(p, visibleContacts, 6);
  const cById = new Map(contacts.map((c) => [c.id, c]));
  const uById = new Map(users.map((u) => [u.id, u]));
  const nextVisits = tasks.filter((t) => t.propertyId === p.id && t.status === "pendiente").sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 4);
  const doneVisits = tasks.filter((t) => t.propertyId === p.id && t.type === "visita" && t.status === "hecha");
  const history = activities.filter((a) => a.propertyId === p.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  const openDeals = deals.filter((d) => d.propertyId === p.id && d.stage !== "cerrada" && d.stage !== "perdida");
  const owner = p.ownerContactId ? cById.get(p.ownerContactId) : null;
  const reportUrl = `/informe/${encodeURIComponent(signToken(p.id))}`;
  const mandateDays = p.mandate?.expires ? daysBetween(arDayKey(), p.mandate.expires) : null;
  const leadCount = leads.filter((l) => l.propertyId === p.id).length;
  const visible = p.status === "publicada" || p.status === "reservada";

  return (
    <div className="pmain pmain--form">
      <Link href="/panel/propiedades" className="back"><Icon name="arrowLeft" size={16} /> Propiedades</Link>
      <header className="pmain__head">
        <div>
          <p className="eyebrow eyebrow--plain">{p.code}</p>
          <h1 className="h2">{p.title}</h1>
          <p className="tiny muted">Creada el {formatDate(p.createdAt)} · {leadCount} {leadCount === 1 ? "consulta" : "consultas"}</p>
        </div>
        <div className="row">
          {visible && (
            <a href={`/propiedades/${p.slug}`} target="_blank" rel="noopener" className="btn btn--ghost btn--s"><Icon name="eye" size={16} /> Ver en el sitio</a>
          )}
          {leadCount > 0 && (
            <Link href={`/panel/consultas?propiedad=${p.id}`} className="btn btn--ghost btn--s"><Icon name="inbox" size={16} /> Consultas</Link>
          )}
        </div>
      </header>
      {creada && <p className="notice notice--ok" style={{ marginBottom: 24 }}>Propiedad creada. Podés seguir completándola.</p>}

      <div className="pstrip">
        <div className="pstrip__item">
          <span className="pstrip__l">Consultas</span>
          <span className="pstrip__v num">{leadCount}</span>
        </div>
        <div className="pstrip__item">
          <span className="pstrip__l">Visitas hechas</span>
          <span className="pstrip__v num">{doneVisits.length}</span>
        </div>
        <div className="pstrip__item">
          <span className="pstrip__l">Negocios abiertos</span>
          <span className="pstrip__v num">{openDeals.length}</span>
        </div>
        <div className="pstrip__item">
          <span className="pstrip__l">Autorización</span>
          <span className={`pstrip__v ${mandateDays != null && mandateDays <= 30 ? "is-late" : ""}`}>
            {!p.mandate ? "Sin firmar" : mandateDays == null ? p.mandate.kind : mandateDays < 0 ? `Vencida (${-mandateDays} d)` : `${p.mandate.kind} · ${mandateDays} d`}
          </span>
        </div>
        <div className="pstrip__item">
          <span className="pstrip__l">Propietario</span>
          <span className="pstrip__v">{owner ? <Link href={`/panel/contactos/${owner.id}`}>{owner.name}</Link> : "Sin vincular"}</span>
        </div>
        <div className="pstrip__actions">
          <a href={reportUrl} target="_blank" rel="noopener" className="btn btn--ghost btn--s" title="Informe de gestión para el dueño: consultas, visitas, devoluciones y precio">
            Informe al propietario
          </a>
          {owner?.phone && (
            <a
              href={`https://wa.me/${waNumber(owner.phone)}?text=${encodeURIComponent(`Hola ${owner.name.split(" ")[0]}, te comparto el informe de gestión de tu propiedad (${p.code}): ${site.url}${reportUrl}`)}`}
              target="_blank"
              rel="noopener"
              className="btn btn--wa btn--s"
            >
              Enviar al dueño
            </a>
          )}
          <TaskButton prefill={{ type: "visita", propertyId: p.id }} className="btn btn--s">
            <Icon name="calendar" size={16} /> Agendar visita
          </TaskButton>
          <DealButton prefill={{ propertyId: p.id }} className="btn btn--ghost btn--s">
            Oportunidad
          </DealButton>
        </div>
      </div>

      <div className="pgrid2 pgrid2--prop">
        <section className="pcard2">
          <header className="pcard2__head">
            <h2 className="pcard2__title">Clientes que la están buscando</h2>
          </header>
          {interested.length ? (
            <ul className="plist2">
              {interested.map(({ c, score }) => (
                <li key={c.id}>
                  <Link href={`/panel/contactos/${c.id}`} className="plist2__row">
                    <span className="score num">{score}%</span>
                    <span className="plist2__main">
                      <strong>{c.name}</strong>
                      <span>{c.search?.notes || c.phone}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="pempty">Ningún contacto con búsqueda activa coincide con esta propiedad.</p>
          )}
        </section>
        <section className="pcard2">
          <header className="pcard2__head">
            <h2 className="pcard2__title">Agenda y actividad</h2>
          </header>
          {nextVisits.length > 0 && (
            <ol className="tlist tlist--compact">
              {nextVisits.map((t) => (
                <TaskItem key={t.id} t={t} showDay contact={t.contactId ? cById.get(t.contactId) : null} users={uById} />
              ))}
            </ol>
          )}
          {history.length ? (
            <ol className="timeline timeline--compact">
              {history.map((a) => (
                <li key={a.id} className="timeline__item">
                  <span className="timeline__icon">
                    <Icon name="note" size={13} />
                  </span>
                  <div>
                    <p className="timeline__text">{a.text}</p>
                    <p className="timeline__meta">
                      {formatDate(a.at)}
                      {a.contactId && cById.get(a.contactId) && (
                        <>
                          {" · "}
                          <Link href={`/panel/contactos/${a.contactId}`}>{cById.get(a.contactId)!.name}</Link>
                        </>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            !nextVisits.length && <p className="pempty">Sin actividad registrada todavía.</p>
          )}
        </section>
      </div>
      <PropertyForm
        property={p}
        agents={users.filter((u) => u.active).map(toPublicAgent)}
        neighborhoods={[...new Set(props.map((x) => x.neighborhood))].sort()}
        canChooseAgent={user.role === "admin"}
        owners={contacts.filter((c) => c.kinds.includes("propietario")).sort((a, b) => a.name.localeCompare(b.name, "es")).map((c) => ({ id: c.id, label: c.name }))}
      />
      {user.role === "admin" && (
        <form action={deleteProperty} className="danger-zone">
          <input type="hidden" name="id" value={p.id} />
          <div>
            <p className="label">Eliminar propiedad</p>
            <p className="tiny muted">Se borra definitivamente. Si se vendió, conviene marcarla como “Vendida / Alquilada” para conservar el historial.</p>
          </div>
          <ConfirmButton message={`¿Eliminar definitivamente ${p.code}? Esta acción no se puede deshacer.`}>
            <Icon name="trash" size={16} /> Eliminar
          </ConfirmButton>
        </form>
      )}
    </div>
  );
}
