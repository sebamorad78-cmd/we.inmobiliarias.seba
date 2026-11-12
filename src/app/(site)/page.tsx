import Link from "next/link";
import { site } from "@/site.config";
import { getFeatured, getNeighborhoodStats, getPublishedProperties } from "@/lib/catalog";
import { HeroSearch } from "@/components/home/hero-search";
import { Img } from "@/components/img";
import { HoodIndex } from "@/components/home/hood-index";
import { ValuationInvite } from "@/components/home/valuation-invite";
import { formatMoney } from "@/lib/format";
import { PropertyCard } from "@/components/property-card";

export const dynamic = "force-dynamic";


const SERVICES = [
  {
    title: "Venta",
    text: "Tasación, fotos, publicación en la web y en redes, visitas acompañadas, reserva, boleto y escritura.",
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
  const [featured, hoods, all] = await Promise.all([getFeatured(6), getNeighborhoodStats(), getPublishedProperties()]);

  return (
    <>
      {/* ── Portada: buscador ── */}
      <section className="phero">
        <Img
          src="/img/quinta-general-piran/quinta-01-arboleda.jpg"
          alt=""
          fill
          preload
          fetchPriority="high"
          sizes="100vw"
          quality={80}
          className="phero__img"
        />
        <div className="phero__shade" />
        <div className="wrap phero__inner">
          <h1 className="phero__title">Encontrá tu próxima propiedad</h1>
          <p className="phero__sub">Casas, campos, quintas y departamentos en Ayacucho y la región.</p>
          <HeroSearch neighborhoods={[...new Set(all.map((p) => p.neighborhood))].sort((a, b) => a.localeCompare(b, "es"))} />
        </div>
      </section>

      {/* ── Destacadas ── */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2 className="h2">Propiedades destacadas</h2>
            <Link href="/propiedades" className="link">
              Ver todas ({all.length})
            </Link>
          </div>
          <ul className="grid-cards">
            {[...featured, ...all.filter((p) => !featured.some((f) => f.id === p.id))].slice(0, 6).map((p, i) => (
              <li key={p.id}>
                <PropertyCard p={p} priority={i < 3} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Barrios ── */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">Zonas</p>
              <h2 className="h2">Propiedades por zona</h2>
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
            <h2 className="h2">En qué te puedo ayudar</h2>
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
