import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { addDays, arDayKey, canSee, fmtAr, fromArLocal, hhmm, toArInput, weekStart } from "@/lib/crm";
import { repo } from "@/lib/data";
import { TASK_TYPES } from "@/lib/types";
import { taskTypeLabel } from "@/lib/crm";
import { Icon } from "@/components/icon";
import { Empty, TaskItem } from "@/components/panel/crm-ui";
import { TaskButton } from "@/components/panel/shell/dialogs";
import { WeekGrid, type GridEvent } from "@/components/panel/week-grid";

export const metadata = { title: "Agenda" };

type SP = { semana?: string; asesor?: string; tipo?: string };

export default async function Agenda({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [tasks, contacts, properties, users] = await Promise.all([repo.list("tasks"), repo.list("contacts"), repo.listProperties(), repo.listUsers()]);
  const cById = new Map(contacts.map((c) => [c.id, c]));
  const pById = new Map(properties.map((p) => [p.id, p]));
  const uById = new Map(users.map((u) => [u.id, u]));

  const today = arDayKey();
  const start = /^\d{4}-\d{2}-\d{2}$/.test(sp.semana ?? "") ? weekStart(sp.semana!) : weekStart(today);
  const end = addDays(start, 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const key = addDays(start, i);
    const iso = fromArLocal(key, "12:00").toISOString();
    return { key, label: fmtAr(iso, { weekday: "short" }).replace(".", ""), num: fmtAr(iso, { day: "numeric" }) };
  });

  const asesor = user.role === "admin" ? sp.asesor : undefined;
  const tipo = (TASK_TYPES as readonly string[]).includes(sp.tipo ?? "") ? sp.tipo : undefined;
  const visible = tasks.filter(
    (t) => canSee(user, t.assignedTo) && (!asesor || t.assignedTo === asesor) && (!tipo || t.type === tipo) && t.status !== "cancelada",
  );
  const week = visible.filter((t) => {
    const k = arDayKey(t.dueAt);
    return k >= start && k < end;
  });

  const events: GridEvent[] = week.map((t) => {
    const c = t.contactId ? cById.get(t.contactId) : null;
    const p = t.propertyId ? pById.get(t.propertyId) : null;
    const local = toArInput(t.dueAt);
    return {
      id: t.id,
      type: t.type,
      title: t.title,
      dueAt: t.dueAt,
      durationMin: t.durationMin,
      status: t.status,
      who: t.assignedTo ? uById.get(t.assignedTo)?.name ?? "" : "",
      contact: c?.name ?? "",
      property: p?.code ?? "",
      prefill: {
        id: t.id,
        type: t.type,
        title: t.title,
        day: local.slice(0, 10),
        time: local.slice(11, 16),
        durationMin: t.durationMin,
        contactId: t.contactId,
        propertyId: t.propertyId,
        assignedTo: t.assignedTo,
        notes: t.notes,
      },
    };
  });

  const q = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    const s = p.toString();
    return `/panel/agenda${s ? `?${s}` : ""}`;
  };

  const rangeLabel = `${fmtAr(fromArLocal(start, "12:00").toISOString(), { day: "numeric", month: "short" })} – ${fmtAr(
    fromArLocal(addDays(start, 6), "12:00").toISOString(),
    { day: "numeric", month: "short", year: "numeric" },
  )}`;
  const pendingWeek = week.filter((t) => t.status === "pendiente").length;
  const visits = week.filter((t) => t.type === "visita").length;

  return (
    <div className="pmain pmain--wide">
      <header className="pmain__head">
        <div>
          <p className="eyebrow">Agenda</p>
          <h1 className="h2">{rangeLabel}</h1>
          <p className="muted small">
            {week.length} eventos · {visits} {visits === 1 ? "visita" : "visitas"} · {pendingWeek} pendientes
          </p>
        </div>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <div className="pager2">
            <Link href={q({ semana: addDays(start, -7) })} className="iconlink" aria-label="Semana anterior">
              <Icon name="chevronLeft" size={18} />
            </Link>
            <Link href={q({ semana: undefined })} className="btn btn--ghost btn--s">
              Hoy
            </Link>
            <Link href={q({ semana: addDays(start, 7) })} className="iconlink" aria-label="Semana siguiente">
              <Icon name="chevronRight" size={18} />
            </Link>
          </div>
          <TaskButton prefill={{ type: "visita" }}>
            <Icon name="plus" size={16} /> Agendar
          </TaskButton>
        </div>
      </header>

      <div className="ptoolbar">
        <nav className="tabs" aria-label="Tipo">
          <Link href={q({ tipo: undefined })} aria-current={!tipo ? "page" : undefined}>
            Todo
          </Link>
          {TASK_TYPES.map((t) => (
            <Link key={t} href={q({ tipo: t })} aria-current={tipo === t ? "page" : undefined}>
              <span className={`dot dot--${t}`} /> {taskTypeLabel[t]}
            </Link>
          ))}
        </nav>
        {user.role === "admin" && (
          <nav className="tabs" aria-label="Asesor">
            <Link href={q({ asesor: undefined })} aria-current={!asesor ? "page" : undefined}>
              Todo el equipo
            </Link>
            {users
              .filter((u) => u.active && tasks.some((t) => t.assignedTo === u.id))
              .map((u) => (
                <Link key={u.id} href={q({ asesor: u.id })} aria-current={asesor === u.id ? "page" : undefined}>
                  {u.name.split(" ")[0]}
                </Link>
              ))}
          </nav>
        )}
      </div>

      <div className="agenda-desktop">
        <WeekGrid days={days} events={events} />
        <p className="tiny muted" style={{ marginTop: 10 }}>
          Hacé clic en un horario libre para agendar. Clic en un evento para editarlo; ✓ para registrar el resultado.
        </p>
      </div>

      <div className="agenda-mobile">
        {days.map((d) => {
          const list = week.filter((t) => arDayKey(t.dueAt) === d.key).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
          return (
            <section key={d.key} className={`aday ${d.key === today ? "is-today" : ""}`}>
              <h2 className="aday__title">
                {d.label} {d.num}
                {d.key === today && <span> · Hoy</span>}
              </h2>
              {list.length ? (
                <ol className="tlist">
                  {list.map((t) => (
                    <TaskItem key={t.id} t={t} contact={t.contactId ? cById.get(t.contactId) : null} property={t.propertyId ? pById.get(t.propertyId) : null} users={uById} />
                  ))}
                </ol>
              ) : (
                <Empty>Sin eventos.</Empty>
              )}
            </section>
          );
        })}
      </div>

      <p className="sr-only">Hora de referencia: {hhmm(new Date().toISOString())}</p>
    </div>
  );
}
