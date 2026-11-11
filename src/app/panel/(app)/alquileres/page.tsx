import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { arDayKey, contractAlerts, daysBetween, fmtAr } from "@/lib/crm";
import { repo } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { Icon } from "@/components/icon";

export const metadata = { title: "Alquileres" };

const d = (day: string) => fmtAr(day + "T15:00:00Z", { day: "numeric", month: "short", year: "numeric" });

export default async function Rentals({ searchParams }: { searchParams: Promise<{ creado?: string; ver?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const [contracts, contacts] = await Promise.all([repo.list("contracts"), repo.list("contacts")]);
  const cById = new Map(contacts.map((c) => [c.id, c]));
  const today = arDayKey();
  const showAll = sp.ver === "todos";

  const rows = contracts
    .filter((c) => showAll || c.active)
    .map((c) => ({ c, a: contractAlerts(c, today) }))
    .sort((x, y) => (x.a.toAdjustment ?? 9999) - (y.a.toAdjustment ?? 9999) || x.a.toEnd - y.a.toEnd);

  const active = contracts.filter((c) => c.active);
  const adjSoon = active.filter((c) => contractAlerts(c, today).adjustSoon).length;
  const ending = active.filter((c) => contractAlerts(c, today).endingSoon || contractAlerts(c, today).expired).length;
  const ars = active.filter((c) => c.currency === "ARS").reduce((s, c) => s + c.rent, 0);
  const usd = active.filter((c) => c.currency === "USD").reduce((s, c) => s + c.rent, 0);

  // Cobros de los próximos 7 días según el día de pago.
  const dom = Number(today.slice(8, 10));
  const dueSoon = active
    .map((c) => ({ c, inDays: (c.payDay - dom + 31) % 31 }))
    .filter((x) => x.inDays <= 7)
    .sort((a, b) => a.inDays - b.inDays);

  return (
    <div className="pmain">
      <header className="pmain__head">
        <div>
          <p className="eyebrow">Administración</p>
          <h1 className="h2">Alquileres</h1>
          <p className="muted small">Contratos administrados, actualizaciones y vencimientos.</p>
        </div>
        <Link href="/panel/alquileres/nuevo" className="btn btn--s">
          <Icon name="plus" size={16} /> Nuevo contrato
        </Link>
      </header>
      {sp.creado && <p className="notice notice--ok" style={{ marginBottom: 20 }}>Contrato creado.</p>}

      <div className="pkpis">
        <div className="pkpi">
          <span className="pkpi__v num">{active.length}</span>
          <span className="pkpi__l">Contratos vigentes</span>
        </div>
        <div className={`pkpi ${adjSoon ? "pkpi--alert" : ""}`}>
          <span className="pkpi__v num">{adjSoon}</span>
          <span className="pkpi__l">Actualizan en 30 días</span>
        </div>
        <div className={`pkpi ${ending ? "pkpi--alert" : ""}`}>
          <span className="pkpi__v num">{ending}</span>
          <span className="pkpi__l">Vencen en 90 días</span>
        </div>
        <div className="pkpi">
          <span className="pkpi__v pkpi__v--s num">{[ars ? formatMoney(ars, "ARS") : null, usd ? formatMoney(usd, "USD") : null].filter(Boolean).join(" + ") || "—"}</span>
          <span className="pkpi__l">Facturación mensual administrada</span>
        </div>
      </div>

      {dueSoon.length > 0 && (
        <section className="pcard2" style={{ marginBottom: 20 }}>
          <header className="pcard2__head">
            <h2 className="pcard2__title">Cobros de los próximos 7 días</h2>
          </header>
          <ul className="plist2">
            {dueSoon.map(({ c, inDays }) => (
              <li key={c.id}>
                <Link href={`/panel/alquileres/${c.id}`} className="plist2__row">
                  <span className="sla">{inDays === 0 ? "Hoy" : `${inDays} d`}</span>
                  <span className="plist2__main">
                    <strong>{c.propertyLabel}</strong>
                    <span>
                      {c.tenantId ? cById.get(c.tenantId)?.name : "Sin inquilino"} · día {c.payDay} · {formatMoney(c.rent, c.currency)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="ptoolbar">
        <nav className="tabs">
          <Link href="/panel/alquileres" aria-current={!showAll ? "page" : undefined}>
            Vigentes
          </Link>
          <Link href="/panel/alquileres?ver=todos" aria-current={showAll ? "page" : undefined}>
            Todos
          </Link>
        </nav>
      </div>

      {rows.length === 0 ? (
        <div className="empty">
          <p className="h3">Todavía no hay contratos cargados.</p>
          <Link href="/panel/alquileres/nuevo" className="btn btn--s">
            Cargar el primero
          </Link>
        </div>
      ) : (
        <div className="ptable-wrap">
          <table className="ptable">
            <thead>
              <tr>
                <th>Propiedad</th>
                <th>Inquilino / Propietario</th>
                <th>Alquiler</th>
                <th>Próxima actualización</th>
                <th>Vencimiento</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, a }) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/panel/alquileres/${c.id}`} className="ptable__lead">
                      <strong>{c.propertyLabel}</strong>
                      <span className="tiny muted">
                        {d(c.start)} → {d(c.end)}
                      </span>
                    </Link>
                  </td>
                  <td className="small">
                    {c.tenantId ? <Link href={`/panel/contactos/${c.tenantId}`}>{cById.get(c.tenantId)?.name}</Link> : <span className="muted">—</span>}
                    <br />
                    <span className="muted">{c.ownerId ? cById.get(c.ownerId)?.name : "—"}</span>
                  </td>
                  <td className="num">
                    {formatMoney(c.rent, c.currency)}
                    <br />
                    <span className="tiny muted">
                      {c.adjustIndex}
                      {c.adjustEveryMonths ? ` · cada ${c.adjustEveryMonths} m` : ""}
                    </span>
                  </td>
                  <td>
                    {a.adjustment ? (
                      <span className={`due ${a.toAdjustment! <= 7 ? "due--red" : a.toAdjustment! <= 30 ? "due--amber" : ""}`}>
                        {d(a.adjustment)}
                        <span className="tiny">en {a.toAdjustment} d</span>
                      </span>
                    ) : (
                      <span className="muted small">—</span>
                    )}
                  </td>
                  <td>
                    <span className={`due ${a.expired ? "due--red" : a.toEnd <= 60 ? "due--red" : a.toEnd <= 90 ? "due--amber" : ""}`}>
                      {a.expired ? "Vencido" : `${daysBetween(today, c.end)} días`}
                      <span className="tiny">{d(c.end)}</span>
                    </span>
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
