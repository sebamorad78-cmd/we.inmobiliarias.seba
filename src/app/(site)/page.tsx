import Link from "next/link";
import { site } from "@/site.config";
import { getFeatured, getNeighborhoodStats, getPublishedProperties } from "@/lib/catalog";
import { HeroReel, type ReelSlide } from "@/components/home/hero-reel";
import { HoodIndex } from "@/components/home/hood-index";
import { ValuationInvite } from "@/components/home/valuation-invite";
import { formatArea, formatMoney, formatPrice } from "@/lib/format";
import { typeLabel } from "@/lib/labels";
import { Photo } from "@/components/photo";
import { PropertyCard } from "@/components/property-card";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

const HERO_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2880&q=85";

const SERVICES = [
  {
    title: "Venta",
    text: "Tasación, fotografía, publicación en portales, visitas acompañadas, reserva, boleto y escritura.",
    href: "/tasaciones#vender",
  },
  {
    title: "Alquiler",
    text: "Contratos según la ley vigente, verificación de garantías e inventario firmado en la entrega.",
    href: "/propiedades?operacion=alquiler",
  },
  {
    title: "Tasación",
    text: "Visita a la propiedad e informe escrito y firmado, con comparables de la zona.",
    href: "/tasaciones",
  },
  {
    title: "Administración",
    text: "Cobro de alquileres, liquidación mensual al propietario, mantenimiento y renovaciones.",
    href: "/contacto?motivo=administracion",
  },
];

const VALUER_IMAGE = "/img/quinta-general-piran/quinta-01-arboleda.jpg";

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
              <p className="eyebrow">Propiedades</p>
              <h2 className="h1">Recién ingresadas</h2>
            </div>
            <Link href="/propiedades" className="link">
              Ver todas ({all.length})
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
                    quality={80}
                  />
                  <div className="feature__lead-info">
                    <span className="tag tag--dark">{lead.code}</span>
                    <h3 className="h2">{lead.title}</h3>
                    <p>
                      {lead.neighborhood} · {formatArea(lead.coveredArea ?? lead.totalArea)} ·{" "}
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

      {/* ── Barrios ── */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">Zonas</p>
              <h2 className="h1">Barrios</h2>
              <p className="lead">
                Propiedades en cartera por zona. El valor indicado es el precio más bajo en venta publicado hoy.
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

      {/* ── Tasaciones ── */}
      <ValuationInvite image={VALUER_IMAGE} />

      {/* ── Servicios ── */}
      <section className="section">
        <div className="wrap svc">
          <div className="svc__head">
            <p className="eyebrow">Servicios</p>
            <h2 className="h1">En qué te puedo ayudar</h2>
          </div>
          <ul className="svc__list">
            {SERVICES.map((s) => (
              <li key={s.title}>
                <Link href={s.href} className="svc__row">
                  <span className="svc__title">{s.title}</span>
                  <span className="svc__text">{s.text}</span>
                  <span className="svc__more">Más información</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Oficina ── */}
      <section className="office">
        <div className="wrap office__inner">
          <div>
            <p className="eyebrow">Oficina</p>
            <p className="office__addr">
              {site.address.street}
              <br />
              {site.address.city}
            </p>
          </div>
          <dl className="office__data">
            <div>
              <dt>Teléfono</dt>
              <dd>
                <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`}>{site.phone}</a>
              </dd>
            </div>
            <div>
              <dt>WhatsApp</dt>
              <dd>
                <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener">
                  Escribir
                </a>
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </dd>
            </div>
            {site.hours && (
              <div>
                <dt>Horario</dt>
                <dd>{site.hours}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>
    </>
  );
}
