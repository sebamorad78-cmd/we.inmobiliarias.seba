import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { addDays, arDayKey, fmtAr, fromArLocal, weekStart } from "@/lib/crm";
import { repo } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { leadKindLabel } from "@/lib/labels";
import { LEAD_KINDS } from "@/lib/types";

export const metadata = { title: "Reportes" };

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

/** Barras horizontales de una sola serie: valor siempre visible, sin depender del color. */
function Bars({ rows, format = (n: number) => String(n) }: { rows: { label: string; value: number; note?: string }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="hbars">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}: ${format(r.value)}${r.note ? ` · ${r.note}` : ""}`}>
          <span className="hbars__label">{r.label}</span>
          <span className="hbars__track">
            <span className="hbars__fill" style={{ width: `${Math.max(r.value ? 2 : 0, (r.value / max) * 100)}%` }} />
          </span>
          <span className="hbars__value num">
            {format(r.value)}
            {r.note && <span className="hbars__note">{r.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function Reports({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [leads, contacts, tasks, deals, properties, users, activities] = await Promise.all([
    repo.listLeads(),
    repo.list("contacts"),
    repo.list("tasks"),
    repo.list("deals"),
    repo.listProperties(),
    repo.listUsers(),
    repo.list("activities"),
  ]);

  const days = sp.periodo === "90" ? 90 : sp.periodo === "365" ? 365 : 30;
  const today = arDayKey();
  const from = addDays(today, -days);
  const inRange = (iso: string) => arDayKey(iso) >= from;

  const L = leads.filter((l) => inRange(l.createdAt));
  const C = contacts.filter((c) => inRange(c.createdAt));
  const visits = tasks.filter((t) => t.type === "visita" && t.status === "hecha" && t.completedAt && inRange(t.completedAt));
  const D = deals.filter((d) => inRange(d.createdAt) || inRange(d.updatedAt));
  const won = deals.filter((d) => d.stage === "cerrada" && inRange(d.updatedAt));
  const fee = (d: (typeof deals)[number]) => ((d.value ?? 0) * d.commissionPct) / 100;
  const wonUsd = won.filter((d) => d.currency === "USD").reduce((s, d) => s + fee(d), 0);

  // Tiempo de respuesta: de la consulta a la primera gestión registrada sobre ese contacto.
  const responseHours = L.map((l) => {
    const c = contacts.find((x) => (l.email && x.email === l.email) || (l.phone && x.phone.replace(/\D/g, "").endsWith(l.phone.replace(/\D/g, "").slice(-8))));
    if (!c) return null;
    const first = activities
      .filter((a) => a.contactId === c.id && a.kind !== "sistema" && a.at >= l.createdAt)
      .sort((a, b) => a.at.localeCompare(b.at))[0];
    return first ? (new Date(first.at).getTime() - new Date(l.createdAt).getTime()) / 3600000 : null;
  }).filter((h): h is number => h != null);
  const avgResponse = responseHours.length ? responseHours.reduce((a, b) => a + b, 0) / responseHours.length : null;

  // Embudo
  const funnel = [
    { label: "Consultas web", value: L.length },
    { label: "Contactos nuevos", value: C.length },
    { label: "Visitas realizadas", value: visits.length },
    { label: "Oportunidades", value: D.length },
    { label: "Operaciones cerradas", value: won.length },
  ];

  // Origen de los contactos
  const sources = new Map<string, number>();
  for (const c of C.length ? C : contacts) sources.set(c.source || "Otro", (sources.get(c.source || "Otro") ?? 0) + 1);
  const sourceRows = [...sources.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));

  // Consultas por semana (8 semanas)
  const ws = weekStart(today);
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(ws, -7 * (7 - i)));
  const perWeek = weeks.map((w) => ({
    w,
    n: leads.filter((l) => {
      const k = arDayKey(l.createdAt);
      return k >= w && k < addDays(w, 7);
    }).length,
  }));
  const maxWeek = Math.max(1, ...perWeek.map((x) => x.n));

  // Por tipo de consulta
  const byKind = LEAD_KINDS.map((k) => ({ label: leadKindLabel[k], value: L.filter((l) => l.kind === k).length }));

  // Equipo
  const team = users
    .filter((u) => u.active)
    .map((u) => ({
      u,
      leads: L.filter((l) => l.assignedTo === u.id).length,
      visits: visits.filter((t) => t.assignedTo === u.id).length,
      open: deals.filter((d) => d.assignedTo === u.id && d.stage !== "cerrada" && d.stage !== "perdida").length,
      won: won.filter((d) => d.assignedTo === u.id).length,
      fees: won.filter((d) => d.assignedTo === u.id && d.currency === "USD").reduce((s, d) => s + fee(d), 0),
    }))
    .filter((r) => r.leads || r.visits || r.open || r.won)
    .sort((a, b) => b.fees - a.fees || b.open - a.open);

  // Propiedades más consultadas
  const now = Date.now();
  const propRows = properties
    .filter((p) => p.status === "publicada" || p.status === "reservada")
    .map((p) => ({
      p,
      leads: leads.filter((l) => l.propertyId === p.id).length + activities.filter((a) => a.propertyId === p.id && a.kind === "sistema").length,
      visits: tasks.filter((t) => t.propertyId === p.id && t.type === "visita" && t.status === "hecha").length,
      dom: Math.floor((now - new Date(p.createdAt).getTime()) / 86400000),
    }))
    .sort((a, b) => b.leads - a.leads || b.visits - a.visits)
    .slice(0, 8);

  const periods = [
    ["30", "30 días"],
    ["90", "90 días"],
    ["365", "12 meses"],
  ];

  return (
    <div className="pmain">
      <header className="pmain__head">
        <div>
          <p className="eyebrow">Gestión</p>
          <h1 className="h2">Reportes</h1>
          <p className="muted small">Desde el {fmtAr(fromArLocal(from, "12:00").toISOString(), { day: "numeric", month: "long", year: "numeric" })}.</p>
        </div>
        <nav className="tabs" aria-label="Período">
          {periods.map(([v, l]) => (
            <Link key={v} href={`/panel/reportes${v === "30" ? "" : `?periodo=${v}`}`} aria-current={String(days) === v ? "page" : undefined}>
              {l}
            </Link>
          ))}
        </nav>
      </header>

      <div className="pkpis">
        <div className="pkpi">
          <span className="pkpi__v num">{formatMoney(Math.round(wonUsd), "USD")}</span>
          <span className="pkpi__l">Honorarios de operaciones cerradas</span>
        </div>
        <div className="pkpi">
          <span className="pkpi__v num">{won.length}</span>
          <span className="pkpi__l">Operaciones cerradas</span>
        </div>
        <div className="pkpi">
          <span className="pkpi__v num">{L.length}</span>
          <span className="pkpi__l">Consultas recibidas</span>
        </div>
        <div className="pkpi">
          <span className="pkpi__v num">{avgResponse == null ? "—" : avgResponse < 1 ? `${Math.round(avgResponse * 60)} min` : `${avgResponse.toFixed(1)} h`}</span>
          <span className="pkpi__l">Tiempo medio de respuesta</span>
        </div>
      </div>

      <div className="pgrid2">
        <section className="pcard2">
          <header className="pcard2__head">
            <h2 className="pcard2__title">Embudo de conversión</h2>
          </header>
          <Bars
            rows={funnel.map((f, i) => ({
              ...f,
              note:
                i > 0 && funnel[i - 1].value && f.value <= funnel[i - 1].value ? `${pct(f.value, funnel[i - 1].value)}% del paso anterior` : undefined,
            }))}
          />
        </section>

        <section className="pcard2">
          <header className="pcard2__head">
            <h2 className="pcard2__title">Consultas por semana</h2>
          </header>
          <div className="vbars" role="img" aria-label={`Consultas por semana: ${perWeek.map((x) => x.n).join(", ")}`}>
            {perWeek.map((x) => (
              <div key={x.w} className="vbars__col" title={`Semana del ${fmtAr(fromArLocal(x.w, "12:00").toISOString(), { day: "numeric", month: "short" })}: ${x.n} consultas`}>
                <span className="vbars__value num">{x.n || ""}</span>
                <span className="vbars__bar" style={{ height: `${(x.n / maxWeek) * 100}%` }} />
                <span className="vbars__label">{fmtAr(fromArLocal(x.w, "12:00").toISOString(), { day: "numeric", month: "numeric" })}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="pcard2">
          <header className="pcard2__head">
            <h2 className="pcard2__title">Origen de los contactos</h2>
          </header>
          <Bars rows={sourceRows} />
        </section>

        <section className="pcard2">
          <header className="pcard2__head">
            <h2 className="pcard2__title">Tipo de consulta</h2>
          </header>
          <Bars rows={byKind} />
        </section>
      </div>

      <section className="pcard2" style={{ marginTop: 20 }}>
        <header className="pcard2__head">
          <h2 className="pcard2__title">Equipo</h2>
        </header>
        <div className="ptable-wrap ptable-wrap--flat">
          <table className="ptable">
            <thead>
              <tr>
                <th>Asesor</th>
                <th>Consultas</th>
                <th>Visitas</th>
                <th>Negocios en curso</th>
                <th>Cerradas</th>
                <th>Honorarios</th>
              </tr>
            </thead>
            <tbody>
              {team.map((r) => (
                <tr key={r.u.id}>
                  <td>
                    <strong>{r.u.name}</strong>
                  </td>
                  <td className="num">{r.leads}</td>
                  <td className="num">{r.visits}</td>
                  <td className="num">{r.open}</td>
                  <td className="num">{r.won}</td>
                  <td className="num">{formatMoney(Math.round(r.fees), "USD")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="pcard2" style={{ marginTop: 20 }}>
        <header className="pcard2__head">
          <h2 className="pcard2__title">Propiedades: interés y tiempo en el mercado</h2>
        </header>
        <div className="ptable-wrap ptable-wrap--flat">
          <table className="ptable">
            <thead>
              <tr>
                <th>Propiedad</th>
                <th>Consultas</th>
                <th>Visitas</th>
                <th>Días publicada</th>
              </tr>
            </thead>
            <tbody>
              {propRows.map(({ p, leads: n, visits: v, dom }) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/panel/propiedades/${p.id}`} className="ptable__lead">
                      <strong>{p.title}</strong>
                      <span className="tiny muted">
                        {p.code} · {p.neighborhood}
                      </span>
                    </Link>
                  </td>
                  <td className="num">{n}</td>
                  <td className="num">{v}</td>
                  <td className={`num ${dom > 90 ? "is-late" : ""}`}>{dom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tiny muted" style={{ marginTop: 12 }}>
          Más de 90 días publicada con pocas visitas suele indicar precio por encima del mercado.
        </p>
      </section>
    </div>
  );
}
