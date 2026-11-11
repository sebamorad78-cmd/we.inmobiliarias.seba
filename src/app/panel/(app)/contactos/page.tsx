import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { canSee, contactKindLabel, waNumber } from "@/lib/crm";
import { repo } from "@/lib/data";
import { formatMoney, formatRelative } from "@/lib/format";
import { operationLabel, typeLabel } from "@/lib/labels";
import { CONTACT_KINDS, type Contact, type ContactKind } from "@/lib/types";
import { Icon } from "@/components/icon";

export const metadata = { title: "Contactos" };

const PLURAL: Record<ContactKind, string> = {
  comprador: "Compradores",
  propietario: "Propietarios",
  inquilino: "Inquilinos",
  inversor: "Inversores",
  otro: "Otros",
};

type SP = { q?: string; tipo?: string; orden?: string };

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function searchSummary(c: Contact) {
  const s = c.search;
  if (!s) return null;
  return [
    operationLabel[s.operation],
    s.types.map((t) => typeLabel[t]).join(", "),
    s.zones.slice(0, 3).join(", "),
    s.maxPrice ? `hasta ${formatMoney(s.maxPrice, s.currency)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default async function Contacts({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [contacts, users, deals] = await Promise.all([repo.list("contacts"), repo.listUsers(), repo.list("deals")]);
  const uById = new Map(users.map((u) => [u.id, u]));
  const tipo = (CONTACT_KINDS as readonly string[]).includes(sp.tipo ?? "") ? (sp.tipo as ContactKind) : undefined;
  const q = sp.q ? norm(sp.q.trim()) : "";
  const now = Date.now();

  const visible = contacts.filter((c) => canSee(user, c.assignedTo));
  const rows = visible
    .filter((c) => !tipo || c.kinds.includes(tipo))
    .filter((c) => !q || norm(`${c.name} ${c.phone} ${c.phone.replace(/\D/g, "")} ${c.email} ${c.notes}`).includes(q))
    .sort((a, b) =>
      sp.orden === "nombre"
        ? a.name.localeCompare(b.name, "es")
        : sp.orden === "olvidados"
          ? (a.lastContactAt ?? a.createdAt).localeCompare(b.lastContactAt ?? b.createdAt)
          : (b.lastContactAt ?? b.createdAt).localeCompare(a.lastContactAt ?? a.createdAt),
    );

  const link = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    const s = p.toString();
    return `/panel/contactos${s ? `?${s}` : ""}`;
  };

  return (
    <div className="pmain">
      <header className="pmain__head">
        <div>
          <p className="eyebrow">Clientes</p>
          <h1 className="h2">Contactos</h1>
          <p className="muted small">
            {visible.length} contactos · {visible.filter((c) => c.search).length} con búsqueda activa
          </p>
        </div>
        <Link href="/panel/contactos/nuevo" className="btn btn--s">
          <Icon name="plus" size={16} /> Nuevo contacto
        </Link>
      </header>

      <div className="ptoolbar">
        <nav className="tabs" aria-label="Tipo">
          <Link href={link({ tipo: undefined })} aria-current={!tipo ? "page" : undefined}>
            Todos <span className="num">{visible.length}</span>
          </Link>
          {CONTACT_KINDS.map((k) => (
            <Link key={k} href={link({ tipo: k })} aria-current={tipo === k ? "page" : undefined}>
              {PLURAL[k]} <span className="num">{visible.filter((c) => c.kinds.includes(k)).length}</span>
            </Link>
          ))}
        </nav>
        <form className="ptoolbar__filters">
          {tipo && <input type="hidden" name="tipo" value={tipo} />}
          <select className="select select--s" name="orden" defaultValue={sp.orden ?? ""} aria-label="Ordenar">
            <option value="">Contacto más reciente</option>
            <option value="olvidados">Sin contacto hace más tiempo</option>
            <option value="nombre">Nombre</option>
          </select>
          <div className="psearch">
            <Icon name="search" size={18} />
            <input type="search" name="q" defaultValue={sp.q} placeholder="Nombre, teléfono o email" aria-label="Buscar contactos" />
          </div>
          <button className="btn btn--ghost btn--s">Aplicar</button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="empty">
          <p className="h3">Sin contactos para mostrar.</p>
          <p className="muted">Las consultas de la web se convierten en contactos automáticamente.</p>
        </div>
      ) : (
        <ul className="clist">
          {rows.map((c) => {
            const last = c.lastContactAt ?? c.createdAt;
            const idle = Math.floor((now - new Date(last).getTime()) / 86400000);
            const active = deals.filter((d) => d.contactId === c.id && d.stage !== "cerrada" && d.stage !== "perdida").length;
            const summary = searchSummary(c);
            return (
              <li key={c.id} className="clist__row">
                <Link href={`/panel/contactos/${c.id}`} className="clist__main">
                  <span className="clist__who">
                    <strong>{c.name}</strong>
                    <span className="clist__kinds">
                      {c.kinds.map((k) => (
                        <span key={k} className={`kchip kchip--${k}`}>
                          {contactKindLabel[k]}
                        </span>
                      ))}
                      {active > 0 && <span className="kchip kchip--deal">{active} en curso</span>}
                    </span>
                  </span>
                  <span className="clist__search">{summary ?? <span className="muted">{c.notes.slice(0, 80) || "Sin búsqueda cargada"}</span>}</span>
                  <span className="clist__meta">
                    <span className={idle >= 14 ? "is-late" : ""}>{formatRelative(last)}</span>
                    <span className="muted">{c.assignedTo ? uById.get(c.assignedTo)?.name.split(" ")[0] : "Sin asignar"}</span>
                  </span>
                </Link>
                <span className="clist__actions">
                  {c.phone && (
                    <>
                      <a className="iconlink" href={`tel:+${waNumber(c.phone)}`} aria-label={`Llamar a ${c.name}`}>
                        <Icon name="phone" size={16} />
                      </a>
                      <a className="iconlink" href={`https://wa.me/${waNumber(c.phone)}`} target="_blank" rel="noopener" aria-label={`WhatsApp a ${c.name}`}>
                        <Icon name="whatsapp" size={16} />
                      </a>
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
