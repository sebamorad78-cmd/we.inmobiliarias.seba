import Link from "next/link";
import { dayLabel, hhmm, isOverdue, taskTypeLabel, waNumber } from "@/lib/crm";
import { formatMoney, formatRelative } from "@/lib/format";
import type { Contact, Currency, Property, Task, TeamUser } from "@/lib/types";
import { Icon, type IconName } from "../icon";
import { DoneButton, TaskButton } from "./shell/dialogs";

export const taskIcon: Record<Task["type"], IconName> = {
  visita: "home",
  llamado: "phone",
  tasacion: "chart",
  firma: "doc",
  reunion: "users",
  tarea: "check",
};

export function money(v: number | null, c: Currency) {
  return v == null ? "Sin valor" : formatMoney(v, c);
}

/** Fila de agenda / tarea, con acciones rápidas. */
export function TaskItem({
  t,
  contact,
  property,
  users,
  showDay = false,
}: {
  t: Task;
  contact?: Contact | null;
  property?: Property | null;
  users?: Map<string, TeamUser>;
  showDay?: boolean;
}) {
  const overdue = isOverdue(t);
  const done = t.status !== "pendiente";
  const who = t.assignedTo && users?.get(t.assignedTo);
  return (
    <li className={`titem titem--${t.type} ${overdue ? "is-overdue" : ""} ${done ? "is-done" : ""}`}>
      <div className="titem__time num">
        {showDay && <span className="titem__day">{dayLabel(t.dueAt)}</span>}
        <span>{hhmm(t.dueAt)}</span>
      </div>
      <div className="titem__body">
        <p className="titem__kind">
          <Icon name={taskIcon[t.type]} size={14} /> {taskTypeLabel[t.type]}
          {overdue && <span className="titem__flag">Vencida</span>}
          {t.status === "cancelada" && <span className="titem__flag titem__flag--muted">Cancelada</span>}
        </p>
        <p className="titem__title">{t.title}</p>
        <p className="titem__meta">
          {contact && <Link href={`/panel/contactos/${contact.id}`}>{contact.name}</Link>}
          {property && <Link href={`/panel/propiedades/${property.id}`}>{property.code}</Link>}
          {who && <span>{who.name.split(" ")[0]}</span>}
          {t.durationMin >= 60 && <span>{t.durationMin / 60} h</span>}
        </p>
        {t.notes && !done && <p className="titem__notes">{t.notes}</p>}
        {t.outcome && <p className="titem__outcome">{t.outcome}</p>}
      </div>
      <div className="titem__actions">
        {contact?.phone && !done && (
          <>
            <a className="iconlink" href={`tel:+${waNumber(contact.phone)}`} aria-label={`Llamar a ${contact.name}`} title="Llamar">
              <Icon name="phone" size={16} />
            </a>
            <a className="iconlink" href={`https://wa.me/${waNumber(contact.phone)}`} target="_blank" rel="noopener" aria-label={`WhatsApp a ${contact.name}`} title="WhatsApp">
              <Icon name="whatsapp" size={16} />
            </a>
          </>
        )}
        {!done && (
          <TaskButton
            className="iconlink"
            prefill={{
              id: t.id,
              type: t.type,
              title: t.title,
              dueAt: t.dueAt,
              durationMin: t.durationMin,
              contactId: t.contactId,
              propertyId: t.propertyId,
              assignedTo: t.assignedTo,
              notes: t.notes,
            }}
          >
            <Icon name="edit" size={16} />
          </TaskButton>
        )}
        {!done && <DoneButton task={{ id: t.id, title: t.title, type: t.type }} />}
      </div>
    </li>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="pempty">{children}</p>;
}

export function Since({ iso }: { iso: string }) {
  return <span className="num">{formatRelative(iso)}</span>;
}

export function Card({ title, action, children, className = "" }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`pcard2 ${className}`}>
      <header className="pcard2__head">
        <h2 className="pcard2__title">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}
