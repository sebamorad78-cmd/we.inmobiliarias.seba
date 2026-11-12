import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/site.config";
import { requireUser } from "@/lib/auth";
import { canSee, contactKindLabel, dealStageLabel, fmtAr, matchesFor, waNumber } from "@/lib/crm";
import { repo } from "@/lib/data";
import { formatPrice, formatRelative, imageAt } from "@/lib/format";
import type { Activity, Task } from "@/lib/types";
import { deleteContact } from "../../../crm-actions";
import { ActivityComposer, WhatsAppTemplates } from "@/components/panel/activity-composer";
import { ConfirmButton } from "@/components/panel/confirm-button";
import { ContactForm } from "@/components/panel/contact-form";
import { Card, Empty, money, TaskItem } from "@/components/panel/crm-ui";
import { DealButton, TaskButton } from "@/components/panel/shell/dialogs";
import { Icon, type IconName } from "@/components/icon";

export const metadata = { title: "Contacto" };

const actIcon: Record<Activity["kind"], IconName> = {
  nota: "note",
  llamado: "phone",
  whatsapp: "whatsapp",
  email: "mail",
  visita: "home",
  sistema: "inbox",
};

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [contacts, properties, users, tasks, activities, deals, contracts] = await Promise.all([
    repo.list("contacts"),
    repo.listProperties(),
    repo.listUsers(),
    repo.list("tasks"),
    repo.list("activities"),
    repo.list("deals"),
    repo.list("contracts"),
  ]);
  const zones = [...new Set(properties.flatMap((p) => [p.neighborhood, p.city]))].sort();
  const team = users.filter((u) => u.active).map((u) => ({ id: u.id, name: u.name }));

  if (id === "nuevo") {
    return (
      <div className="pmain pmain--form">
        <Link href="/panel/contactos" className="back">
          <Icon name="arrowLeft" size={16} /> Contactos
        </Link>
        <header className="pmain__head">
          <h1 className="h2">Nuevo contacto</h1>
        </header>
        <div className="pcard2">
          <ContactForm contact={null} users={team} zones={zones} canAssign={user.role === "admin"} />
        </div>
      </div>
    );
  }

  const c = contacts.find((x) => x.id === id);
  if (!c || !canSee(user, c.assignedTo)) notFound();

  const pById = new Map(properties.map((p) => [p.id, p]));
  const uById = new Map(users.map((u) => [u.id, u]));
  const myTasks = tasks.filter((t) => t.contactId === c.id);
  const pending = myTasks.filter((t) => t.status === "pendiente").sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const myDeals = deals.filter((d) => d.contactId === c.id);
  const owned = properties.filter((p) => p.ownerContactId === c.id);
  const myContracts = contracts.filter((k) => k.tenantId === c.id || k.ownerId === c.id);
  const matches = matchesFor(c, properties, 6);
  const phone = c.phone ? waNumber(c.phone) : "";
  const first = c.name.split(" ")[0];
  const me = user.name.split(" ")[0];

  type Entry = { at: string; icon: IconName; kind: string; text: string; who?: string; propertyId?: string | null };
  const timeline: Entry[] = [
    ...activities
      .filter((a) => a.contactId === c.id)
      .map((a) => ({ at: a.at, icon: actIcon[a.kind], kind: a.kind, text: a.text, who: a.userId ? uById.get(a.userId)?.name : undefined, propertyId: a.propertyId })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const templates = [
    { label: "Saludo y seguimiento", text: `Hola ${first}, ¿cómo estás? Te escribe ${me} de ${site.name}. ¿Pudiste pensar en lo que hablamos?` },
    ...(pending.find((t) => t.type === "visita")
      ? [
          {
            label: "Confirmar visita",
            text: (() => {
              const v = pending.find((t) => t.type === "visita")!;
              const p = v.propertyId ? pById.get(v.propertyId) : null;
              return `Hola ${first}, te confirmo la visita del ${fmtAr(v.dueAt, { weekday: "long", day: "numeric" })} a las ${fmtAr(v.dueAt, { hour: "2-digit", minute: "2-digit" })}${p ? ` a ${p.title}` : ""}. ¡Te esperamos!`;
            })(),
          },
        ]
      : []),
    ...(matches.length
      ? [
          {
            label: `Enviar ${matches.length} propiedades que coinciden`,
            text: `Hola ${first}, te comparto propiedades que coinciden con lo que buscás:\n${matches
              .slice(0, 4)
              .map((m) => `• ${m.p.title} (${formatPrice(m.p)}): ${site.url}/propiedades/${m.p.slug}`)
              .join("\n")}\n¿Te gustaría visitar alguna?`,
          },
        ]
      : []),
    { label: "Pedir documentación", text: `Hola ${first}, para avanzar necesitaríamos copia de DNI y constancia de CUIL/CUIT. ¿Me las podés enviar por acá? Gracias.` },
  ];

  const lastContact = c.lastContactAt ?? c.createdAt;

  return (
    <div className="pmain pmain--wide">
      <Link href="/panel/contactos" className="back">
        <Icon name="arrowLeft" size={16} /> Contactos
      </Link>

      <header className="chead">
        <div className="chead__main">
          <h1 className="h2">{c.name}</h1>
          <p className="chead__meta">
            {c.kinds.map((k) => (
              <span key={k} className={`kchip kchip--${k}`}>
                {contactKindLabel[k]}
              </span>
            ))}
            <span>{c.phone}</span>
            {c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}
            <span className="muted">Último contacto {formatRelative(lastContact)}</span>
          </p>
        </div>
        <div className="chead__actions">
          {phone && <WhatsAppTemplates contactId={c.id} phone={phone} templates={templates} />}
          {phone && (
            <a className="btn btn--ghost btn--s" href={`tel:+${phone}`}>
              <Icon name="phone" size={16} /> Llamar
            </a>
          )}
          <TaskButton prefill={{ type: "visita", contactId: c.id, propertyId: matches[0]?.p.id ?? null }} className="btn btn--ghost btn--s">
            <Icon name="calendar" size={16} /> Agendar
          </TaskButton>
          <DealButton prefill={{ contactId: c.id, propertyId: matches[0]?.p.id ?? null }} className="btn btn--ghost btn--s">
            <Icon name="kanban" size={16} /> Oportunidad
          </DealButton>
        </div>
      </header>

      <div className="pgrid2 pgrid2--contact">
        <div className="pstack">
          <Card title="Registrar">
            <ActivityComposer contactId={c.id} />
          </Card>

          {pending.length > 0 && (
            <Card title="Próximo">
              <ol className="tlist">
                {pending.map((t: Task) => (
                  <TaskItem key={t.id} t={t} showDay contact={c} property={t.propertyId ? pById.get(t.propertyId) : null} users={uById} />
                ))}
              </ol>
            </Card>
          )}

          <Card title="Historial">
            {timeline.length ? (
              <ol className="timeline">
                {timeline.map((e, i) => (
                  <li key={i} className={`timeline__item timeline__item--${e.kind}`}>
                    <span className="timeline__icon">
                      <Icon name={e.icon} size={14} />
                    </span>
                    <div>
                      <p className="timeline__text">{e.text}</p>
                      <p className="timeline__meta">
                        {fmtAr(e.at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {e.who && ` · ${e.who}`}
                        {e.propertyId && pById.get(e.propertyId) && (
                          <>
                            {" · "}
                            <Link href={`/panel/propiedades/${e.propertyId}`}>{pById.get(e.propertyId)!.code}</Link>
                          </>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <Empty>Todavía no hay historial.</Empty>
            )}
          </Card>
        </div>

        <div className="pstack">
          {c.search && (
            <Card title="Propiedades que coinciden">
              {matches.length ? (
                <ul className="mlist">
                  {matches.map(({ p, score }) => (
                    <li key={p.id}>
                      <Link href={`/panel/propiedades/${p.id}`} className="mlist__row">
                        <span className="mlist__img">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {p.images[0] && <img src={imageAt(p.images[0].url, 640)} alt="" loading="lazy" />}
                        </span>
                        <span className="mlist__main">
                          <strong>{p.title}</strong>
                          <span>
                            {p.code} · {p.neighborhood} · {formatPrice(p)}
                          </span>
                        </span>
                        <span className="score num">{score}%</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>Ninguna propiedad de la cartera coincide hoy con su búsqueda.</Empty>
              )}
            </Card>
          )}

          {myDeals.length > 0 && (
            <Card
              title="Oportunidades"
              action={
                <Link href="/panel/oportunidades" className="plink">
                  Tablero
                </Link>
              }
            >
              <ul className="plist2">
                {myDeals.map((d) => (
                  <li key={d.id} className="plist2__row">
                    <span className={`stage stage--${d.stage}`}>{dealStageLabel[d.stage]}</span>
                    <span className="plist2__main">
                      <strong>{d.title}</strong>
                      <span>{money(d.value, d.currency)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {(owned.length > 0 || myContracts.length > 0) && (
            <Card title="Propiedades y contratos">
              <ul className="plist2">
                {owned.map((p) => (
                  <li key={p.id}>
                    <Link href={`/panel/propiedades/${p.id}`} className="plist2__row">
                      <span className="kchip kchip--propietario">Propietario</span>
                      <span className="plist2__main">
                        <strong>{p.title}</strong>
                        <span>{p.code}</span>
                      </span>
                    </Link>
                  </li>
                ))}
                {myContracts.map((k) => (
                  <li key={k.id}>
                    <Link href={`/panel/alquileres/${k.id}`} className="plist2__row">
                      <span className="kchip kchip--inquilino">{k.tenantId === c.id ? "Inquilino" : "Locador"}</span>
                      <span className="plist2__main">
                        <strong>{k.propertyLabel}</strong>
                        <span>Vence {fmtAr(k.end + "T15:00:00Z", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title="Datos y búsqueda">
            <ContactForm contact={c} users={team} zones={zones} canAssign={user.role === "admin"} />
          </Card>

          {user.role === "admin" && (
            <form action={deleteContact} className="danger-zone">
              <input type="hidden" name="id" value={c.id} />
              <div>
                <p className="label">Eliminar contacto</p>
                <p className="tiny muted">Se borra el contacto. Su historial queda sin vincular.</p>
              </div>
              <ConfirmButton message={`¿Eliminar a ${c.name}?`}>
                <Icon name="trash" size={16} /> Eliminar
              </ConfirmButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
