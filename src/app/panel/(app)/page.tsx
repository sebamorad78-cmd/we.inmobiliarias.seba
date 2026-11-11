import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatRelative } from "@/lib/format";
import { leadKindLabel, leadStatusLabel, operationLabel } from "@/lib/labels";
import { Icon } from "@/components/icon";

export const metadata = { title: "Resumen" };

export default async function Dashboard() {
  const user = await requireUser();
  const [props, leads] = await Promise.all([repo.listProperties(), repo.listLeads()]);
  const mine = (l: (typeof leads)[number]) => user.role === "admin" || !l.assignedTo || l.assignedTo === user.id;
  const myLeads = leads.filter(mine).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const weekAgo = Date.now() - 7 * 86400000;
  const propById = new Map(props.map((p) => [p.id, p]));

  const kpis = [
    { label: "Publicadas", value: props.filter((p) => p.status === "publicada").length, href: "/panel/propiedades?estado=publicada" },
    { label: "Reservadas", value: props.filter((p) => p.status === "reservada").length, href: "/panel/propiedades?estado=reservada" },
    { label: "Consultas nuevas", value: myLeads.filter((l) => l.status === "nuevo").length, href: "/panel/consultas?estado=nuevo", accent: true },
    { label: "Consultas (7 días)", value: myLeads.filter((l) => new Date(l.createdAt).getTime() > weekAgo).length, href: "/panel/consultas" },
  ];

  // Propiedades con más consultas: muestra qué se mueve y qué no.
  const counts = new Map<string, number>();
  for (const l of leads) if (l.propertyId) counts.set(l.propertyId, (counts.get(l.propertyId) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => ({ p: propById.get(id), n })).filter((x) => x.p);

  // Avisos de calidad: lo que le falta a cada publicación para rendir mejor.
  const issues = props
    .filter((p) => p.status === "publicada")
    .map((p) => ({
      p,
      missing: [
        p.images.length < 5 && "menos de 5 fotos",
        p.lat == null && "sin ubicación en mapa",
        p.description.length < 300 && "descripción corta",
        p.price == null && "sin precio",
      ].filter(Boolean) as string[],
    }))
    .filter((x) => x.missing.length);

  return (
    <div className="pmain">
      <header className="pmain__head">
        <div>
          <p className="eyebrow">Hola, {user.name.split(" ")[0]}</p>
          <h1 className="h2">Resumen</h1>
        </div>
        <Link href="/panel/propiedades/nueva" className="btn"><Icon name="plus" size={18} /> Nueva propiedad</Link>
      </header>

      <div className="kpis">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className={`kpi ${k.accent && k.value ? "kpi--accent" : ""}`}>
            <span className="kpi__v num">{k.value}</span>
            <span className="kpi__l">{k.label}</span>
          </Link>
        ))}
      </div>

      <div className="pgrid">
        <section className="pcardbox">
          <div className="pcardbox__head">
            <h2 className="h3">Últimas consultas</h2>
            <Link href="/panel/consultas" className="link small">Ver todas</Link>
          </div>
          {myLeads.length === 0 ? (
            <p className="muted small">Todavía no hay consultas. Llegan acá apenas un cliente completa un formulario en el sitio.</p>
          ) : (
            <ul className="plist">
              {myLeads.slice(0, 8).map((l) => {
                const p = l.propertyId ? propById.get(l.propertyId) : null;
                return (
                  <li key={l.id}>
                    <Link href={`/panel/consultas/${l.id}`} className="plist__row">
                      <span className={`dot dot--${l.status === "nuevo" ? "new" : "seen"}`} aria-hidden="true" />
                      <span className="plist__main">
                        <strong>{l.name}</strong>
                        <span className="tiny muted">{leadKindLabel[l.kind]}{p ? ` · ${p.code}` : ""}</span>
                      </span>
                      <span className="tiny muted">{formatRelative(l.createdAt)}</span>
                      <span className={`status status--${l.status.replace(/\s/g, "-")}`}>{leadStatusLabel[l.status]}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="pstack">
          <section className="pcardbox">
            <div className="pcardbox__head"><h2 className="h3">Más consultadas</h2></div>
            {top.length === 0 ? (
              <p className="muted small">Sin datos todavía.</p>
            ) : (
              <ol className="plist plist--ranked">
                {top.map(({ p, n }) => (
                  <li key={p!.id}>
                    <Link href={`/panel/propiedades/${p!.id}`} className="plist__row">
                      <span className="plist__main">
                        <strong>{p!.title}</strong>
                        <span className="tiny muted">{p!.code} · {operationLabel[p!.operation]}</span>
                      </span>
                      <span className="num">{n}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="pcardbox">
            <div className="pcardbox__head"><h2 className="h3">Para mejorar</h2></div>
            {issues.length === 0 ? (
              <p className="muted small">Todas las publicaciones están completas.</p>
            ) : (
              <ul className="plist">
                {issues.slice(0, 6).map(({ p, missing }) => (
                  <li key={p.id}>
                    <Link href={`/panel/propiedades/${p.id}`} className="plist__row">
                      <span className="plist__main">
                        <strong>{p.code}</strong>
                        <span className="tiny muted">{missing.join(" · ")}</span>
                      </span>
                      <Icon name="chevronRight" size={16} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
