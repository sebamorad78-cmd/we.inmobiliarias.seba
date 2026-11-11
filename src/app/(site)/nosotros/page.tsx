import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/site.config";
import { getPublicTeam } from "@/lib/catalog";
import { whatsappLink } from "@/lib/format";
import { Icon } from "@/components/icon";

export const metadata: Metadata = {
  title: "Nosotros",
  description: `Conocé al equipo de ${site.name}: corredores matriculados y asesores especializados por zona.`,
  alternates: { canonical: "/nosotros" },
};

export const dynamic = "force-dynamic";

const VALUES = [
  ["Pocas propiedades, bien trabajadas", "Tomamos solo lo que podemos vender. Cada propiedad tiene un asesor responsable de principio a fin."],
  ["Información sin maquillaje", "Te decimos lo que vale, lo que tarda y lo que hay que resolver. Aunque no sea lo que querías escuchar."],
  ["Respuesta en el día", "Toda consulta recibe respuesta dentro del mismo día hábil, por el canal que prefieras."],
];

export default async function AboutPage() {
  const team = await getPublicTeam();
  return (
    <>
      <section className="wrap page-pad">
        <header className="page-head page-head--wide">
          <p className="eyebrow">Nosotros</p>
          <h1 className="display" style={{ fontSize: "clamp(44px, 6vw, 88px)" }}>
            Una inmobiliaria <em>de barrio</em>,<br />con estándar internacional.
          </h1>
          <p className="lead">
            Desde nuestra oficina en {site.address.city} acompañamos a familias, inversores y empresas en la compra, venta y
            alquiler de propiedades. Somos un equipo chico a propósito: el que te atiende es el que conoce la propiedad.
          </p>
        </header>
        <ol className="values">
          {VALUES.map(([t, d], i) => (
            <li key={t}>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="h3">{t}</h2>
              <p className="muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section section--surface">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">Equipo</p>
              <h2 className="h1">Las personas <em>detrás de cada operación</em></h2>
            </div>
          </div>
          <ul className="team">
            {team.map((a) => (
              <li key={a.id} className="member">
                <span className="avatar avatar--l" aria-hidden="true">
                  {a.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </span>
                <h3 className="h3">{a.name}</h3>
                <p className="member__title">{a.title}</p>
                {a.license && <p className="tiny muted">Mat. {a.license}</p>}
                <p className="muted small">{a.bio}</p>
                <div className="row" style={{ marginTop: "auto", paddingTop: 12 }}>
                  {a.phone && (
                    <a className="icon-btn" href={whatsappLink(a.phone, `Hola ${a.name.split(" ")[0]}, te escribo desde la web de ${site.name}.`)} target="_blank" rel="noopener" aria-label={`WhatsApp de ${a.name}`}>
                      <Icon name="whatsapp" size={18} />
                    </a>
                  )}
                  <a className="icon-btn" href={`mailto:${a.email}`} aria-label={`Email a ${a.name}`}>
                    <Icon name="mail" size={18} />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section--tight">
        <div className="wrap closing">
          <h2 className="h2">¿Querés trabajar con nosotros?</h2>
          <p className="muted">Buscamos asesores con experiencia y ganas de hacer las cosas bien.</p>
          <Link href="/contacto?motivo=trabajo" className="btn btn--ghost">Escribinos</Link>
        </div>
      </section>
    </>
  );
}
