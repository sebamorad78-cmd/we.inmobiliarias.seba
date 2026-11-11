import Link from "next/link";
import { site } from "@/site.config";
import { getFeatured, getNeighborhoodStats, getPublishedProperties } from "@/lib/catalog";
import { HeroReel, type ReelSlide } from "@/components/home/hero-reel";
import { HoodIndex } from "@/components/home/hood-index";
import { InstantValuation } from "@/components/home/instant-valuation";
import { formatArea, formatMoney, formatPrice } from "@/lib/format";
import { typeLabel } from "@/lib/labels";
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

const VALUER_IMAGE = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85";

export default async function HomePage() {
  const [featured, hoods, all] = await Promise.all([getFeatured(5), getNeighborhoodStats(), getPublishedProperties()]);
  // "Selección" muestra lo recién ingresado; la portada ya recorre las destacadas.
  const shownInReel = new Set(featured.map((p) => p.id));
  const fresh = all.filter((p) => !shownInReel.has(p.id) && p.status === "publicada");
  const [lead, ...rest] = fresh.length >= 3 ? fresh : all;

  const slides: ReelSlide[] = (featured.length ? featured : all.slice(0, 5)).map((p) => ({
    href: `/propiedades/${p.slug}`,
    image: p.images[0]?.url ?? HERO_IMAGE,
    alt: p.images[0]?.alt ?? p.title,
    title: p.title,
    hood: p.neighborhood,
    facts: [typeLabel[p.type], formatArea(p.coveredArea ?? p.totalArea), p.bedrooms ? `${p.bedrooms} dormitorios` : null]
      .filter(Boolean)
      .join(" · "),
    price: formatPrice(p),
    code: p.code,
  }));

  return (
    <>
      {/* ── Portada ── */}
      <HeroReel slides={slides} />

      {/* ── Selección ── */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">01 — Selección</p>
              <h2 className="h1">
                Recién ingresadas
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
              <p className="eyebrow">02 — Dónde trabajamos</p>
              <h2 className="h1">
                Conocemos cada barrio
              </h2>
              <p className="lead">
                Precios por metro reales, colegios, accesos, ruidos y proyectos en camino. Lo que no aparece en un aviso.
              </p>
            </div>
          </div>
          <HoodIndex
            hoods={hoods.slice(0, 8).map((h) => ({
              name: h.name,
              city: h.city,
              count: h.count,
              image: h.image,
              from: h.minSaleUsd ? formatMoney(h.minSaleUsd, "USD") : null,
            }))}
          />
        </div>
      </section>

      {/* ── Servicios ── */}
      <section className="section section--surface">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">03 — Servicios</p>
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

      {/* ── Tasador instantáneo ── */}
      <InstantValuation image={VALUER_IMAGE} listingsByHood={Object.fromEntries(hoods.map((h) => [h.name, h.count]))} />

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
