import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/site.config";
import { verifyToken } from "@/lib/auth";
import { fmtAr } from "@/lib/crm";
import { formatMoney, formatPrice } from "@/lib/format";
import { operationLabel, typeLabel } from "@/lib/labels";
import { buildOwnerReport } from "@/lib/owner-report";
import { repo } from "@/lib/data";
import { LogoMark } from "@/components/site-header";
import { PrintButton } from "@/components/property/share-button";
import "@/styles/report.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Informe de gestión", robots: { index: false, follow: false } };

export default async function OwnerReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const id = verifyToken(decodeURIComponent(token));
  if (!id) notFound();
  const r = await buildOwnerReport(id);
  if (!r) notFound();
  const p = r.property;
  const agent = p.agentId ? await repo.getUser(p.agentId) : null;
  const owner = p.ownerContactId ? await repo.get("contacts", p.ownerContactId) : null;
  const max = Math.max(1, ...r.perWeek.map((w) => w.n));
  const today = new Date().toISOString();
  const pct = r.pricePerM2 && r.zonePerM2 ? Math.round((r.pricePerM2 / r.zonePerM2 - 1) * 100) : null;

  return (
    <main className="rep">
      <div className="rep__tools">
        <PrintButton />
      </div>
      <article className="rep__doc">
        <header className="rep__head">
          <div className="rep__brand">
            <LogoMark size={40} />
            <div>
              <p className="rep__brandname">{site.name}</p>
              <p className="rep__brandtag">{site.tagline}</p>
            </div>
          </div>
          <div className="rep__meta">
            <p>Informe de gestión</p>
            <p>{fmtAr(today, { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </header>

        <section className="rep__intro">
          {owner && <p className="rep__to">Para {owner.name}</p>}
          <h1 className="rep__title">{p.title}</h1>
          <p className="rep__sub">
            {typeLabel[p.type]} en {operationLabel[p.operation].toLowerCase()} · {p.neighborhood}, {p.city} · {formatPrice(p)} · Ref. {p.code}
          </p>
        </section>

        <dl className="rep__kpis">
          <div>
            <dt>Consultas · últimos {r.periodDays} días</dt>
            <dd>{r.inquiriesPeriod}</dd>
            <span>{r.inquiries} desde la publicación</span>
          </div>
          <div>
            <dt>Visitas realizadas</dt>
            <dd>{r.visitsPeriod}</dd>
            <span>{r.visitsDone} en total · {r.upcomingVisits} agendadas</span>
          </div>
          <div>
            <dt>Clientes con búsqueda compatible</dt>
            <dd>{r.interested}</dd>
            <span>En nuestra base de interesados</span>
          </div>
          <div>
            <dt>Días publicada</dt>
            <dd>{r.daysOnMarket}</dd>
            <span>{r.openNegotiations ? `${r.openNegotiations} negociación en curso` : "Sin negociaciones abiertas"}</span>
          </div>
        </dl>

        <section className="rep__block">
          <h2>Consultas por semana</h2>
          <div className="rep__bars" role="img" aria-label={`Consultas por semana: ${r.perWeek.map((w) => w.n).join(", ")}`}>
            {r.perWeek.map((w) => (
              <div key={w.week} className="rep__bar">
                <span className="rep__barv">{w.n}</span>
                <span className="rep__barf" style={{ height: `${(w.n / max) * 100}%` }} />
                <span className="rep__barl">{fmtAr(w.week + "T15:00:00Z", { day: "numeric", month: "short" })}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rep__block">
          <h2>Devolución de las visitas</h2>
          {r.feedback.length ? (
            <ul className="rep__quotes">
              {r.feedback.map((f, i) => (
                <li key={i}>
                  <p>“{f.text}”</p>
                  <span>{fmtAr(f.at, { day: "numeric", month: "long" })}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rep__muted">Todavía no hay visitas con devolución registrada en este período.</p>
          )}
        </section>

        {r.pricePerM2 && (
          <section className="rep__block">
            <h2>Precio comparado con la zona</h2>
            <div className="rep__compare">
              <div>
                <span>Su propiedad</span>
                <strong>{formatMoney(Math.round(r.pricePerM2), p.currency)} /m²</strong>
              </div>
              <div>
                <span>Comparables en la zona{r.zoneSample ? ` (${r.zoneSample})` : ""}</span>
                <strong>{r.zonePerM2 ? `${formatMoney(Math.round(r.zonePerM2), p.currency)} /m²` : "Sin comparables suficientes"}</strong>
              </div>
              {pct != null && (
                <div>
                  <span>Diferencia</span>
                  <strong>{pct > 0 ? `+${pct}` : pct} %</strong>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="rep__block">
          <h2>Recomendaciones</h2>
          <ol className="rep__recs">
            {r.recommendations.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </section>

        <footer className="rep__foot">
          <div>
            <p className="rep__sign">{site.name}</p>
            <p>{site.license}</p>
            {agent && agent.name !== site.name && <p>Asesor a cargo: {agent.name}</p>}
          </div>
          <div className="rep__contact">
            <p>{site.phone}</p>
            <p>{site.email}</p>
            <p>
              {site.address.street}, {site.address.city}
            </p>
          </div>
        </footer>
      </article>
    </main>
  );
}
