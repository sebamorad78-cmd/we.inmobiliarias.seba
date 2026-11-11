import Link from "next/link";
import { site } from "@/site.config";
import { getFeatured, getNeighborhoodStats, getPublishedProperties } from "@/lib/catalog";
import { HeroSearch } from "@/components/home/hero-search";
import { Icon } from "@/components/icon";
import { Photo } from "@/components/photo";
import { PropertyCard } from "@/components/property-card";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

const HERO_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2880&q=85";

const SERVICES = [
  {
    n: "01",
    title: "Comprar",
    text: "Filtramos el mercado por vos. Te mostramos solo lo que vale la pena visitar y te acompañamos en la negociación y la escritura.",
    href: "/propiedades?operacion=venta",
    cta: "Ver propiedades en venta",
  },
  {
    n: "02",
    title: "Vender",
    text: "Tasación con datos de cierre reales, fotografía profesional, difusión en los principales portales y reportes semanales de cada visita.",
    href: "/tasaciones#vender",
    cta: "Cómo vendemos",
  },
  {
    n: "03",
    title: "Alquilar",
    text: "Contratos claros según la normativa vigente, verificación de garantías y propiedades listas para entrar a vivir.",
    href: "/propiedades?operacion=alquiler",
    cta: "Ver alquileres",
  },
  {
    n: "04",
    title: "Administrar",
    text: "Cobro, liquidación, mantenimiento y renovaciones. El propietario recibe su renta y un informe mensual, sin ocuparse de nada.",
    href: "/contacto?motivo=administracion",
    cta: "Consultar",
  },
];

const PROCESS = [
  ["Escuchamos", "Una primera reunión para entender qué buscás, en qué plazos y con qué presupuesto real."],
  ["Seleccionamos", "Visitamos antes que vos. Te llegan pocas opciones, todas con informe y documentación revisada."],
  ["Negociamos", "Precio, plazos y condiciones. Con datos de operaciones cerradas, no de avisos publicados."],
  ["Escrituramos", "Coordinamos escribanía, certificados y entrega de llaves. Seguimos ahí después de la firma."],
];

export default async function HomePage() {
  const [featured, hoods, all] = await Promise.all([getFeatured(5), getNeighborhoodStats(), getPublishedProperties()]);
  const [lead, ...rest] = featured;

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero">
        <Photo
          className="hero__bg"
          src={HERO_IMAGE}
          alt="Casa contemporánea con jardín y pileta al atardecer"
          fill
          priority
          sizes="100vw"
          quality={90}
          label=""
        />
        <div className="hero__shade" />
        <div className="wrap hero__content">
          <p className="eyebrow hero__eyebrow">Buenos Aires · Zona Norte</p>
          <h1 className="display hero__title">
            Propiedades
            <br />
            con criterio.
          </h1>
          <p className="hero__sub">
            Una cartera chica, elegida a mano. Asesores que conocen cada cuadra y responden en el día.
          </p>
          <HeroSearch neighborhoods={hoods.map((h) => h.name)} />
          <p className="hero__quick">
            <span>Búsquedas frecuentes:</span>
            <Link href="/propiedades?operacion=venta&tipo=casa&barrio=San%20Isidro">Casas en San Isidro</Link>
            <Link href="/propiedades?operacion=venta&credito=1">Apto crédito</Link>
            <Link href="/propiedades?operacion=alquiler&barrio=Palermo">Alquiler en Palermo</Link>
          </p>
        </div>
      </section>

      {/* ── Selección ── */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">Selección</p>
              <h2 className="h1">
                Esta semana, en cartera
              </h2>
            </div>
            <Link href="/propiedades" className="link">
              Ver las {all.length} propiedades
            </Link>
          </div>

          {lead && (
            <div className="feature">
              <Reveal className="feature__lead">
                <Link href={`/propiedades/${lead.slug}`} className="feature__lead-link">
                  <Photo
                    className="feature__lead-media"
                    src={lead.images[0]?.url ?? HERO_IMAGE}
                    alt={lead.images[0]?.alt ?? lead.title}
                    fill
                    sizes="(max-width: 1000px) 100vw, 60vw"
                    quality={85}
                  />
                  <div className="feature__lead-info">
                    <span className="tag tag--dark">{lead.code}</span>
                    <h3 className="h2">{lead.title}</h3>
                    <p>
                      {lead.neighborhood} · {lead.coveredArea ?? lead.totalArea} m² ·{" "}
                      {lead.bedrooms ? `${lead.bedrooms} dormitorios` : ""}
                    </p>
                    <span className="link">
                      Ver propiedad
                    </span>
                  </div>
                </Link>
              </Reveal>
              <div className="feature__grid">
                {rest.slice(0, 4).map((p, i) => (
                  <Reveal key={p.id} delay={i * 80}>
                    <PropertyCard p={p} sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 20vw" />
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Cifras ── */}
      <section className="stats" aria-label="Ribera en números">
        <div className="wrap stats__inner">
          {site.stats.map((s) => (
            <div key={s.label} className="stats__item">
              <p className="stats__value num">{s.value}</p>
              <p className="stats__label">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Barrios ── */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">Dónde trabajamos</p>
              <h2 className="h1">
                Conocemos cada barrio
              </h2>
              <p className="lead">
                Precios por metro reales, colegios, accesos, ruidos y proyectos en camino. Lo que no aparece en un aviso.
              </p>
            </div>
          </div>
          <ul className="hoods">
            {hoods.slice(0, 7).map((h, i) => (
              <Reveal as="li" key={h.name} delay={(i % 4) * 70}>
                <Link href={`/propiedades?barrio=${encodeURIComponent(h.name)}`} className="hood">
                  {h.image && (
                    <Photo className="hood__media" src={h.image} alt="" fill sizes="(max-width: 700px) 50vw, 25vw" quality={70} label={h.name} />
                  )}
                  <span className="hood__shade" />
                  <span className="hood__text">
                    <span className="hood__name">{h.name}</span>
                    <span className="hood__count">
                      {h.count} {h.count === 1 ? "propiedad" : "propiedades"}
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Servicios ── */}
      <section className="section section--surface">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">Servicios</p>
              <h2 className="h1">
                Todo lo que pasa entre
                <br />
                la búsqueda y las llaves
              </h2>
            </div>
          </div>
          <ol className="services">
            {SERVICES.map((s) => (
              <Reveal as="li" key={s.n} className="service">
                <span className="service__n num">{s.n}</span>
                <h3 className="h2 service__title">{s.title}</h3>
                <p className="service__text">{s.text}</p>
                <Link href={s.href} className="link service__cta">
                  {s.cta}
                </Link>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Vender ── */}
      <section className="section section--ink sell">
        <div className="wrap sell__inner">
          <div className="sell__text">
            <p className="eyebrow">Para propietarios</p>
            <h2 className="h1">
              ¿Cuánto vale hoy
              <br />
              tu propiedad?
            </h2>
            <p className="lead" style={{ color: "rgb(230 237 232 / 0.8)" }}>
              Un tasador matriculado visita la propiedad y en 48 horas te entrega un informe con comparables de
              operaciones cerradas en la zona. Sin costo y sin compromiso.
            </p>
            <div className="row" style={{ flexWrap: "wrap", marginTop: 32 }}>
              <Link href="/tasaciones" className="btn btn--clay">
                Pedir tasación
              </Link>
              <Link href="/tasaciones#vender" className="btn btn--outline-light">
                Cómo vendemos
              </Link>
            </div>
          </div>
          <ol className="process">
            {PROCESS.map(([t, d], i) => (
              <li key={t}>
                <span className="process__n num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="h3">{t}</h3>
                  <p>{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Contacto ── */}
      <section className="section--tight">
        <div className="wrap closing">
          <h2 className="h2">
            ¿Buscás algo que no está publicado? Preguntanos.
          </h2>
          <p className="muted">
            Muchas de nuestras mejores operaciones se cierran antes de salir a los portales.
          </p>
          <div className="row" style={{ flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/contacto" className="btn">
              Contarnos qué buscás
            </Link>
            <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`} className="btn btn--ghost">
              <Icon name="phone" size={18} /> {site.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
