import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatPrice, formatRelative } from "@/lib/format";
import { operationLabel, statusLabel, typeLabel } from "@/lib/labels";
import { PROPERTY_STATUSES, type PropertyStatus } from "@/lib/types";
import { Icon } from "@/components/icon";
import { StatusSelect } from "@/components/panel/status-select";

export const metadata = { title: "Propiedades" };

export default async function PanelProperties({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string; eliminada?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const [all, users] = await Promise.all([repo.listProperties(), repo.listUsers()]);
  const userName = new Map(users.map((u) => [u.id, u.name]));
  const estado = PROPERTY_STATUSES.includes(sp.estado as PropertyStatus) ? (sp.estado as PropertyStatus) : undefined;
  const q = sp.q?.trim().toLowerCase();

  const rows = all
    .filter((p) => !estado || p.status === estado)
    .filter((p) => !q || [p.title, p.code, p.neighborhood, p.address].join(" ").toLowerCase().includes(q))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const count = (s?: PropertyStatus) => (s ? all.filter((p) => p.status === s).length : all.length);

  return (
    <div className="pmain">
      <header className="pmain__head">
        <div>
          <h1 className="h2">Propiedades</h1>
          <p className="muted small">{all.length} en total</p>
        </div>
        <Link href="/panel/propiedades/nueva" className="btn"><Icon name="plus" size={18} /> Nueva propiedad</Link>
      </header>

      {sp.eliminada && <p className="notice notice--ok" style={{ marginBottom: 20 }}>La propiedad fue eliminada.</p>}

      <div className="ptoolbar">
        <nav className="tabs" aria-label="Estado">
          <Link href={`/panel/propiedades${q ? `?q=${encodeURIComponent(q)}` : ""}`} aria-current={!estado ? "page" : undefined}>Todas <span className="num">{count()}</span></Link>
          {PROPERTY_STATUSES.map((s) => (
            <Link key={s} href={`/panel/propiedades?estado=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`} aria-current={estado === s ? "page" : undefined}>
              {statusLabel[s]} <span className="num">{count(s)}</span>
            </Link>
          ))}
        </nav>
        <form className="psearch" role="search">
          {estado && <input type="hidden" name="estado" value={estado} />}
          <Icon name="search" size={18} />
          <input type="search" name="q" defaultValue={sp.q} placeholder="Buscar por título, código o barrio" aria-label="Buscar propiedades" />
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="empty"><p className="h3">Sin resultados</p><p className="muted">Probá con otra búsqueda o cargá una propiedad nueva.</p></div>
      ) : (
        <div className="ptable-wrap">
          <table className="ptable">
            <thead>
              <tr>
                <th>Propiedad</th>
                <th>Operación</th>
                <th>Precio</th>
                <th>Asesor</th>
                <th>Actualizada</th>
                <th>Estado</th>
                <th><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/panel/propiedades/${p.id}`} className="ptable__prop">
                      {p.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0].url.replace("w=2400", "w=160")} alt="" width={64} height={48} loading="lazy" />
                      ) : (
                        <span className="ptable__noimg" />
                      )}
                      <span>
                        <strong>{p.title}</strong>
                        <span className="tiny muted">{p.code} · {typeLabel[p.type]} · {p.neighborhood}{p.featured ? " · ★ Destacada" : ""}</span>
                      </span>
                    </Link>
                  </td>
                  <td>{operationLabel[p.operation]}</td>
                  <td className="num">{formatPrice(p)}</td>
                  <td>{p.agentId ? userName.get(p.agentId) ?? "—" : "—"}</td>
                  <td className="tiny muted">{formatRelative(p.updatedAt)}</td>
                  <td><StatusSelect id={p.id} status={p.status} /></td>
                  <td className="ptable__actions">
                    <Link href={`/panel/propiedades/${p.id}`} className="icon-btn" aria-label={`Editar ${p.code}`}><Icon name="edit" size={16} /></Link>
                    {(p.status === "publicada" || p.status === "reservada") && (
                      <a href={`/propiedades/${p.slug}`} target="_blank" rel="noopener" className="icon-btn" aria-label={`Ver ${p.code} en el sitio`}><Icon name="eye" size={16} /></a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
