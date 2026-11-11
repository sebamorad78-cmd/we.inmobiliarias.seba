import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatDate, formatRelative } from "@/lib/format";
import { leadKindLabel, leadStatusLabel } from "@/lib/labels";
import { LEAD_KINDS, LEAD_STATUSES, type LeadKind, type LeadStatus } from "@/lib/types";
import { Icon } from "@/components/icon";

export const metadata = { title: "Consultas" };

type SP = { estado?: string; tipo?: string; propiedad?: string; q?: string; mias?: string };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [leads, props, users] = await Promise.all([repo.listLeads(), repo.listProperties(), repo.listUsers()]);
  const propById = new Map(props.map((p) => [p.id, p]));
  const userById = new Map(users.map((u) => [u.id, u]));

  const estado = LEAD_STATUSES.includes(sp.estado as LeadStatus) ? (sp.estado as LeadStatus) : undefined;
  const tipo = LEAD_KINDS.includes(sp.tipo as LeadKind) ? (sp.tipo as LeadKind) : undefined;
  const onlyMine = user.role === "agente" || sp.mias === "1";
  const q = sp.q?.trim().toLowerCase();

  const visible = leads.filter((l) => !onlyMine || !l.assignedTo || l.assignedTo === user.id);
  const rows = visible
    .filter((l) => !estado || l.status === estado)
    .filter((l) => !tipo || l.kind === tipo)
    .filter((l) => !sp.propiedad || l.propertyId === sp.propiedad)
    .filter((l) => !q || [l.name, l.email, l.phone, l.message].join(" ").toLowerCase().includes(q))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const link = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    const s = p.toString();
    return `/panel/consultas${s ? `?${s}` : ""}`;
  };

  // Exportación CSV para planillas o CRM externos.
  const csvHref = `/panel/consultas/exportar${link({}).replace("/panel/consultas", "")}`;

  return (
    <div className="pmain">
      <header className="pmain__head">
        <div>
          <h1 className="h2">Consultas</h1>
          <p className="muted small">{rows.length} {rows.length === 1 ? "resultado" : "resultados"}</p>
        </div>
        <a href={csvHref} className="btn btn--ghost btn--s"><Icon name="doc" size={16} /> Exportar CSV</a>
      </header>

      <div className="ptoolbar">
        <nav className="tabs" aria-label="Estado">
          <Link href={link({ estado: undefined })} aria-current={!estado ? "page" : undefined}>Todas <span className="num">{visible.length}</span></Link>
          {LEAD_STATUSES.map((s) => (
            <Link key={s} href={link({ estado: s })} aria-current={estado === s ? "page" : undefined}>
              {leadStatusLabel[s]} <span className="num">{visible.filter((l) => l.status === s).length}</span>
            </Link>
          ))}
        </nav>
        <form className="ptoolbar__filters">
          {estado && <input type="hidden" name="estado" value={estado} />}
          <select className="select select--s" name="tipo" defaultValue={tipo ?? ""} aria-label="Tipo de consulta">
            <option value="">Todos los tipos</option>
            {LEAD_KINDS.map((k) => <option key={k} value={k}>{leadKindLabel[k]}</option>)}
          </select>
          {user.role === "admin" && (
            <label className="check small"><input type="checkbox" name="mias" value="1" defaultChecked={sp.mias === "1"} /> Solo mías</label>
          )}
          <div className="psearch">
            <Icon name="search" size={18} />
            <input type="search" name="q" defaultValue={sp.q} placeholder="Nombre, email, teléfono" aria-label="Buscar consultas" />
          </div>
          <button className="btn btn--s">Filtrar</button>
        </form>
      </div>

      {sp.propiedad && propById.get(sp.propiedad) && (
        <p className="notice notice--ok" style={{ marginBottom: 16 }}>
          Mostrando consultas de {propById.get(sp.propiedad)!.code}. <Link href={link({ propiedad: undefined })} style={{ textDecoration: "underline" }}>Ver todas</Link>
        </p>
      )}

      {rows.length === 0 ? (
        <div className="empty"><Icon name="inbox" size={28} /><p className="h3">No hay consultas con estos filtros.</p></div>
      ) : (
        <div className="ptable-wrap">
          <table className="ptable">
            <thead>
              <tr><th>Cliente</th><th>Tipo</th><th>Propiedad</th><th>Asignada a</th><th>Recibida</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {rows.map((l) => {
                const p = l.propertyId ? propById.get(l.propertyId) : null;
                return (
                  <tr key={l.id} className={l.status === "nuevo" ? "is-new" : undefined}>
                    <td>
                      <Link href={`/panel/consultas/${l.id}`} className="ptable__lead">
                        <strong>{l.name}</strong>
                        <span className="tiny muted">{[l.phone, l.email].filter(Boolean).join(" · ")}</span>
                      </Link>
                    </td>
                    <td className="small">{leadKindLabel[l.kind]}</td>
                    <td className="small">{p ? <Link href={`/panel/propiedades/${p.id}`}>{p.code}</Link> : "—"}</td>
                    <td className="small">{l.assignedTo ? userById.get(l.assignedTo)?.name ?? "—" : <span className="muted">Sin asignar</span>}</td>
                    <td className="tiny muted" title={formatDate(l.createdAt, { dateStyle: "full", timeStyle: "short" })}>{formatRelative(l.createdAt)}</td>
                    <td><span className={`status status--${l.status.replace(/\s/g, "-")}`}>{leadStatusLabel[l.status]}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
