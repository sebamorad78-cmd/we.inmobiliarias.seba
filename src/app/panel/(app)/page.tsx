import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  addDays,
  arDayKey,
  canSee,
  contractAlerts,
  daysBetween,
  dealStageLabel,
  fmtAr,
  isOverdue,
  matchScore,
  stageProbability,
} from "@/lib/crm";
import { repo } from "@/lib/data";
import { formatMoney, formatRelative } from "@/lib/format";
import { leadKindLabel } from "@/lib/labels";
import { DEAL_STAGES } from "@/lib/types";
import { Icon } from "@/components/icon";
import { Card, Empty, TaskItem } from "@/components/panel/crm-ui";
import { TaskButton } from "@/components/panel/shell/dialogs";

export const metadata = { title: "Hoy" };

export default async function Today() {
  const user = await requireUser();
  const [tasks, contacts, properties, leads, deals, contracts, users] = await Promise.all([
    repo.list("tasks"),
    repo.list("contacts"),
    repo.listProperties(),
    repo.listLeads(),
    repo.list("deals"),
    repo.list("contracts"),
    repo.listUsers(),
  ]);
  const cById = new Map(contacts.map((c) => [c.id, c]));
  const pById = new Map(properties.map((p) => [p.id, p]));
  const uById = new Map(users.map((u) => [u.id, u]));
  const today = arDayKey();
  const now = Date.now();

  const mine = tasks.filter((t) => canSee(user, t.assignedTo));
  const todays = mine.filter((t) => arDayKey(t.dueAt) === today && t.status !== "cancelada").sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const overdue = mine.filter((t) => isOverdue(t) && arDayKey(t.dueAt) < today).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const upcoming = mine
    .filter((t) => t.status === "pendiente" && arDayKey(t.dueAt) > today && arDayKey(t.dueAt) <= addDays(today, 4))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const pendingToday = todays.filter((t) => t.status === "pendiente").length;

  const unanswered = leads
    .filter((l) => l.status === "nuevo" && canSee(user, l.assignedTo))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // Embudo
  const openDeals = deals.filter((d) => canSee(user, d.assignedTo) && d.stage !== "cerrada" && d.stage !== "perdida");
  const fee = (d: (typeof deals)[number]) => ((d.value ?? 0) * d.commissionPct) / 100;
  const weightedUsd = openDeals.filter((d) => d.currency === "USD").reduce((s, d) => s + fee(d) * stageProbability[d.stage], 0);
  const monthStart = today.slice(0, 8) + "01";
  const wonMonthUsd = deals
    .filter((d) => d.stage === "cerrada" && d.currency === "USD" && arDayKey(d.updatedAt) >= monthStart && canSee(user, d.assignedTo))
    .reduce((s, d) => s + fee(d), 0);
  const stages = DEAL_STAGES.filter((s) => s !== "cerrada" && s !== "perdida").map((s) => ({
    s,
    n: openDeals.filter((d) => d.stage === s).length,
  }));
  const maxN = Math.max(1, ...stages.map((x) => x.n));

  // Alertas
  type Alert = { tone: "red" | "amber"; text: string; href: string };
  const alerts: Alert[] = [];
  for (const p of properties) {
    if (!p.mandate?.expires || p.status === "vendida") continue;
    const d = daysBetween(today, p.mandate.expires);
    if (d < 0) alerts.push({ tone: "red", text: `Autorización vencida hace ${-d} días · ${p.code}`, href: `/panel/propiedades/${p.id}` });
    else if (d <= 30) alerts.push({ tone: "amber", text: `Autorización vence en ${d} días · ${p.code}`, href: `/panel/propiedades/${p.id}` });
  }
  for (const c of contracts) {
    const a = contractAlerts(c);
    if (a.expired) alerts.push({ tone: "red", text: `Contrato vencido · ${c.propertyLabel}`, href: `/panel/alquileres/${c.id}` });
    else if (a.endingSoon) alerts.push({ tone: "amber", text: `Contrato vence en ${a.toEnd} días · ${c.propertyLabel}`, href: `/panel/alquileres/${c.id}` });
    if (a.adjustSoon && a.adjustment)
      alerts.push({
        tone: a.toAdjustment! <= 7 ? "red" : "amber",
        text: `Actualización ${c.adjustIndex} el ${fmtAr(a.adjustment + "T15:00:00Z", { day: "numeric", month: "short" })} · ${c.propertyLabel}`,
        href: `/panel/alquileres/${c.id}`,
      });
  }
  for (const d of openDeals) {
    const c = d.contactId ? cById.get(d.contactId) : null;
    if (!c) continue;
    const last = c.lastContactAt ?? c.createdAt;
    const days = Math.floor((now - new Date(last).getTime()) / 86400000);
    if (days >= 7) alerts.push({ tone: "amber", text: `${c.name} sin contacto hace ${days} días (${dealStageLabel[d.stage]})`, href: `/panel/contactos/${c.id}` });
  }

  // Coincidencias: propiedades de los últimos 14 días que sirven a clientes con búsqueda.
  const fresh = properties.filter((p) => now - new Date(p.createdAt).getTime() < 14 * 86400000);
  const matches = fresh
    .flatMap((p) =>
      contacts
        .filter((c) => c.search && canSee(user, c.assignedTo))
        .map((c) => ({ c, p, score: matchScore(c.search!, p) }))
        .filter((m) => m.score != null),
    )
    .sort((a, b) => b.score! - a.score!)
    .slice(0, 5);

  const dateTitle = (() => {
    const t = fmtAr(new Date().toISOString(), { weekday: "long", day: "numeric", month: "long" });
    return t.charAt(0).toUpperCase() + t.slice(1);
  })();
  const summary = [
    pendingToday ? `${pendingToday} ${pendingToday === 1 ? "pendiente" : "pendientes"} hoy` : "Sin pendientes hoy",
    overdue.length ? `${overdue.length} ${overdue.length === 1 ? "vencida" : "vencidas"}` : null,
    unanswered.length ? `${unanswered.length} ${unanswered.length === 1 ? "consulta sin responder" : "consultas sin responder"}` : null,
  ].filter(Boolean);

  return (
    <div className="pmain">
      <header className="phero">
        <div>
          <p className="phero__kicker">{user.name}</p>
          <h1 className="phero__title">{dateTitle}</h1>
          <p className="phero__sub">{summary.join(" · ")}</p>
        </div>
        <div className="phero__actions">
          <TaskButton prefill={{ type: "visita" }} className="btn btn--s">
            Agendar visita
          </TaskButton>
          <TaskButton prefill={{ type: "llamado" }} className="btn btn--ghost btn--s">
            Agendar llamado
          </TaskButton>
        </div>
      </header>

      <div className="pkpis">
        <Link href="/panel/agenda" className="pkpi">
          <span className="pkpi__v num">{todays.length}</span>
          <span className="pkpi__l">Eventos hoy</span>
        </Link>
        <Link href="/panel/consultas?estado=nuevo" className={`pkpi ${unanswered.length ? "pkpi--alert" : ""}`}>
          <span className="pkpi__v num">{unanswered.length}</span>
          <span className="pkpi__l">Consultas sin responder</span>
        </Link>
        <Link href="/panel/oportunidades" className="pkpi">
          <span className="pkpi__v num">{openDeals.length}</span>
          <span className="pkpi__l">Negocios en curso</span>
        </Link>
        <Link href="/panel/reportes" className="pkpi">
          <span className="pkpi__v num">{formatMoney(Math.round(weightedUsd), "USD")}</span>
          <span className="pkpi__l">Honorarios proyectados</span>
        </Link>
      </div>

      <div className="pgrid2">
        <div className="pstack">
          <Card
            title="Agenda de hoy"
            action={
              <Link href="/panel/agenda" className="plink">
                Ver semana
              </Link>
            }
          >
            {todays.length ? (
              <ol className="tlist">
                {todays.map((t) => (
                  <TaskItem key={t.id} t={t} contact={t.contactId ? cById.get(t.contactId) : null} property={t.propertyId ? pById.get(t.propertyId) : null} users={uById} />
                ))}
              </ol>
            ) : (
              <Empty>No tenés nada agendado para hoy.</Empty>
            )}
          </Card>

          {overdue.length > 0 && (
            <Card title={`Vencidas (${overdue.length})`} className="pcard2--alert">
              <ol className="tlist">
                {overdue.map((t) => (
                  <TaskItem key={t.id} t={t} showDay contact={t.contactId ? cById.get(t.contactId) : null} property={t.propertyId ? pById.get(t.propertyId) : null} users={uById} />
                ))}
              </ol>
            </Card>
          )}

          <Card title="Próximos días">
            {upcoming.length ? (
              <ol className="tlist tlist--compact">
                {upcoming.map((t) => (
                  <TaskItem key={t.id} t={t} showDay contact={t.contactId ? cById.get(t.contactId) : null} property={t.propertyId ? pById.get(t.propertyId) : null} users={uById} />
                ))}
              </ol>
            ) : (
              <Empty>Sin eventos en los próximos días.</Empty>
            )}
          </Card>
        </div>

        <div className="pstack">
          <Card
            title="Consultas sin responder"
            action={
              <Link href="/panel/consultas" className="plink">
                Todas
              </Link>
            }
          >
            {unanswered.length ? (
              <ul className="plist2">
                {unanswered.slice(0, 6).map((l) => {
                  const hours = (now - new Date(l.createdAt).getTime()) / 3600000;
                  const p = l.propertyId ? pById.get(l.propertyId) : null;
                  return (
                    <li key={l.id}>
                      <Link href={`/panel/consultas/${l.id}`} className="plist2__row">
                        <span className={`sla ${hours > 2 ? "sla--late" : ""}`} title="Tiempo sin responder">
                          {formatRelative(l.createdAt).replace("hace ", "")}
                        </span>
                        <span className="plist2__main">
                          <strong>{l.name}</strong>
                          <span>
                            {leadKindLabel[l.kind]}
                            {p ? ` · ${p.code}` : ""}
                          </span>
                        </span>
                        <Icon name="chevronRight" size={16} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty>Todas las consultas están respondidas.</Empty>
            )}
          </Card>

          <Card title="Alertas">
            {alerts.length ? (
              <ul className="alerts">
                {alerts.slice(0, 8).map((a, i) => (
                  <li key={i}>
                    <Link href={a.href} className={`alert alert--${a.tone}`}>
                      <Icon name="bell" size={15} />
                      <span>{a.text}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Sin alertas. Autorizaciones y contratos al día.</Empty>
            )}
          </Card>

          <Card
            title="Embudo de negocios"
            action={
              <Link href="/panel/oportunidades" className="plink">
                Tablero
              </Link>
            }
          >
            <ul className="funnel">
              {stages.map(({ s, n }) => (
                <li key={s}>
                  <span className="funnel__label">{dealStageLabel[s]}</span>
                  <span className="funnel__bar">
                    <span style={{ width: `${(n / maxN) * 100}%` }} />
                  </span>
                  <span className="funnel__n num">{n}</span>
                </li>
              ))}
            </ul>
            <dl className="mini-stats">
              <div>
                <dt>Ponderado por etapa</dt>
                <dd className="num">{formatMoney(Math.round(weightedUsd), "USD")}</dd>
              </div>
              <div>
                <dt>Cobrado este mes</dt>
                <dd className="num">{formatMoney(Math.round(wonMonthUsd), "USD")}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Coincidencias nuevas">
            {matches.length ? (
              <ul className="plist2">
                {matches.map(({ c, p, score }) => (
                  <li key={c.id + p.id}>
                    <Link href={`/panel/contactos/${c.id}`} className="plist2__row">
                      <span className="score num" title="Coincidencia con su búsqueda">
                        {score}%
                      </span>
                      <span className="plist2__main">
                        <strong>{c.name}</strong>
                        <span>
                          {p.code} · {p.title}
                        </span>
                      </span>
                      <Icon name="chevronRight" size={16} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Cuando ingrese una propiedad que sirva a un cliente, aparece acá.</Empty>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
