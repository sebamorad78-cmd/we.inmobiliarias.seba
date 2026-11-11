import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/site.config";
import { getAgent, getPublicProperty, getSimilar } from "@/lib/catalog";
import { formatArea, formatMoney, formatPrice, pricePerM2, whatsappLink } from "@/lib/format";
import { operationLabel, typeLabel } from "@/lib/labels";
import type { Property } from "@/lib/types";
import { ContactBox } from "@/components/property/contact-box";
import { Gallery } from "@/components/property/gallery";
import { MortgageCalculator } from "@/components/property/mortgage-calculator";
import { PrintButton, ShareButton } from "@/components/property/share-button";
import { Icon, type IconName } from "@/components/icon";
import { PropertyCard } from "@/components/property-card";
import { PropertyMap } from "@/components/map/property-map";
import { CompareButton, FavoriteButton } from "@/components/shortlist-buttons";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPublicProperty((await params).slug);
  if (!p) return { title: "Propiedad no encontrada" };
  const title = `${p.title} · ${p.neighborhood}`;
  const description = `${typeLabel[p.type]} en ${operationLabel[p.operation].toLowerCase()} en ${p.neighborhood}. ${formatPrice(p)}. ${[
    formatArea(p.coveredArea ?? p.totalArea),
    p.rooms && `${p.rooms} ambientes`,
    p.bedrooms && `${p.bedrooms} dormitorios`,
  ]
    .filter(Boolean)
    .join(" · ")}. Ref. ${p.code}.`;
  return {
    title,
    description,
    alternates: { canonical: `/propiedades/${p.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      images: p.images.slice(0, 1).map((i) => ({ url: i.url.replace("w=2400", "w=1200"), width: 1200, height: 800, alt: i.alt })),
    },
  };
}

function youtubeEmbed(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0` : null;
}

function facts(p: Property): { icon: IconName; label: string; value: string }[] {
  const rows: ({ icon: IconName; label: string; value: string | null | false } | null)[] = [
    { icon: "area", label: "Sup. cubierta", value: formatArea(p.coveredArea) },
    { icon: "area", label: "Sup. total", value: formatArea(p.totalArea) },
    { icon: "rooms", label: "Ambientes", value: p.rooms ? String(p.rooms) : null },
    { icon: "bed", label: "Dormitorios", value: p.bedrooms ? String(p.bedrooms) : null },
    { icon: "bath", label: "Baños", value: p.bathrooms ? String(p.bathrooms) : null },
    { icon: "car", label: "Cocheras", value: p.garages ? String(p.garages) : null },
    { icon: "calendar", label: "Antigüedad", value: p.age == null ? null : p.age === 0 ? "A estrenar" : `${p.age} años` },
  ];
  return rows.filter((r): r is { icon: IconName; label: string; value: string } => !!r?.value);
}

export default async function PropertyPage({ params }: Props) {
  const p = await getPublicProperty((await params).slug);
  if (!p) notFound();
  const [agent, similar] = await Promise.all([getAgent(p.agentId), getSimilar(p)]);

  const url = `${site.url}/propiedades/${p.slug}`;
  const video = youtubeEmbed(p.videoUrl);
  const ppm = pricePerM2(p);
  const details: [string, string][] = (
    [
      ["Código", p.code],
      ["Operación", operationLabel[p.operation]],
      ["Tipo", typeLabel[p.type]],
      ["Piso", p.floor],
      ["Orientación", p.orientation],
      ["Expensas", p.expenses ? `${formatMoney(p.expenses, "ARS")} /mes` : null],
      ["Apto crédito", p.operation === "venta" ? (p.mortgageEligible ? "Sí" : "Consultar") : null],
      ["Apto profesional", p.professionalUse ? "Sí" : null],
      ["Valor por m²", ppm],
    ] as [string, string | null][]
  ).filter((r): r is [string, string] => !!r[1]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.title,
    url,
    datePosted: p.createdAt,
    image: p.images.map((i) => i.url),
    description: p.description.slice(0, 500),
    offers: p.price
      ? {
          "@type": "Offer",
          price: p.price,
          priceCurrency: p.currency,
          availability: p.status === "reservada" ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock",
          businessFunction: p.operation === "venta" ? "http://purl.org/goodrelations/v1#Sell" : "http://purl.org/goodrelations/v1#LeaseOut",
        }
      : undefined,
    about: {
      "@type": p.type === "casa" || p.type === "quinta" ? "SingleFamilyResidence" : p.type === "departamento" || p.type === "ph" ? "Apartment" : "Place",
      numberOfRooms: p.rooms ?? undefined,
      numberOfBedrooms: p.bedrooms ?? undefined,
      numberOfBathroomsTotal: p.bathrooms ?? undefined,
      floorSize: p.coveredArea ? { "@type": "QuantitativeValue", value: p.coveredArea, unitCode: "MTK" } : undefined,
      address: { "@type": "PostalAddress", addressLocality: p.neighborhood, addressRegion: p.city, addressCountry: "AR" },
      geo: p.lat && p.lng ? { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng } : undefined,
    },
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: site.url },
      { "@type": "ListItem", position: 2, name: "Propiedades", item: `${site.url}/propiedades` },
      { "@type": "ListItem", position: 3, name: p.neighborhood, item: `${site.url}/propiedades?barrio=${encodeURIComponent(p.neighborhood)}` },
      { "@type": "ListItem", position: 4, name: p.title, item: url },
    ],
  };

  return (
    <article className="pdetail">
      <div className="wrap">
        <nav className="crumbs" aria-label="Ruta">
          <Link href="/propiedades">Propiedades</Link>
          <Icon name="chevronRight" size={14} />
          <Link href={`/propiedades?operacion=${p.operation}`}>{operationLabel[p.operation]}</Link>
          <Icon name="chevronRight" size={14} />
          <Link href={`/propiedades?operacion=${p.operation}&barrio=${encodeURIComponent(p.neighborhood)}`}>{p.neighborhood}</Link>
        </nav>

        <header className="pdetail__head">
          <div>
            <div className="row" style={{ flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              <span className="tag tag--line">{operationLabel[p.operation]}</span>
              <span className="tag tag--line">{typeLabel[p.type]}</span>
              {p.status === "reservada" && <span className="tag tag--clay">Reservada</span>}
            </div>
            <h1 className="h1">{p.title}</h1>
            <p className="pdetail__where">
              <Icon name="pin" size={18} />
              {p.showExactLocation && p.address ? `${p.address}, ` : ""}
              {p.neighborhood}, {p.city}
            </p>
          </div>
          <div className="pdetail__price">
            <p className="pdetail__amount num">{formatPrice(p)}</p>
            {p.expenses ? <p className="muted small num">+ {formatMoney(p.expenses, "ARS")} de expensas</p> : null}
            <p className="tiny muted">Ref. {p.code}</p>
          </div>
        </header>

        <Gallery images={p.images} title={p.title} />

        <div className="pdetail__actions">
          <FavoriteButton id={p.id} title={p.title} variant="text" />
          <CompareButton id={p.id} variant="text" />
          <ShareButton title={p.title} />
          <PrintButton />
          {p.tourUrl && (
            <a className="btn btn--ghost btn--s" href={p.tourUrl} target="_blank" rel="noopener">
              <Icon name="cube" size={18} /> Recorrido 360°
            </a>
          )}
        </div>

        <div className="pdetail__layout">
          <div className="pdetail__main">
            <ul className="keyfacts">
              {facts(p).map((f) => (
                <li key={f.label}>
                  <Icon name={f.icon} size={22} />
                  <span className="keyfacts__v num">{f.value}</span>
                  <span className="keyfacts__l">{f.label}</span>
                </li>
              ))}
            </ul>

            <section className="pblock">
              <h2 className="h3">Descripción</h2>
              <div className="prose">
                {p.description.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>

            {p.amenities.length > 0 && (
              <section className="pblock">
                <h2 className="h3">Comodidades</h2>
                <ul className="amenities">
                  {p.amenities.map((a) => (
                    <li key={a}>
                      <Icon name="check" size={16} /> {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="pblock">
              <h2 className="h3">Ficha técnica</h2>
              <dl className="specs">
                {details.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd className="num">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {video && (
              <section className="pblock">
                <h2 className="h3">Video</h2>
                <div className="video">
                  <iframe src={video} title={`Video de ${p.title}`} loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen />
                </div>
              </section>
            )}

            {p.lat != null && p.lng != null && (
              <section className="pblock">
                <h2 className="h3">Ubicación</h2>
                {!p.showExactLocation && (
                  <p className="muted small" style={{ marginBottom: 14 }}>
                    Por seguridad del propietario mostramos una zona aproximada. La dirección exacta se informa al coordinar la visita.
                  </p>
                )}
                <PropertyMap
                  single
                  className="pmap--detail"
                  points={[{ id: p.id, lat: p.lat, lng: p.lng, label: p.neighborhood, title: p.title, href: "#", approximate: !p.showExactLocation }]}
                />
              </section>
            )}

            {p.operation === "venta" && p.price && p.type !== "local" && p.type !== "oficina" && (
              <section className="pblock">
                <h2 className="h3">Simulá tu crédito</h2>
                <MortgageCalculator price={p.price} currency={p.currency} />
              </section>
            )}
          </div>

          <aside className="pdetail__aside">
            <ContactBox propertyId={p.id} code={p.code} title={p.title} agent={agent} url={url} />
          </aside>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="section section--surface no-print">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="eyebrow">También te puede interesar</p>
                <h2 className="h2">Propiedades similares</h2>
              </div>
              <Link className="link" href={`/propiedades?operacion=${p.operation}&tipo=${p.type}`}>
                Ver más <Icon name="arrowRight" size={18} />
              </Link>
            </div>
            <ul className="grid-cards">
              {similar.map((s) => (
                <li key={s.id}>
                  <PropertyCard p={s} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div className="mbar no-print">
        <div>
          <p className="mbar__price num">{formatPrice(p)}</p>
          <p className="tiny muted">Ref. {p.code}</p>
        </div>
        <a className="btn btn--wa btn--s" href={whatsappLink(agent?.phone || site.whatsapp, `Hola, me interesa la propiedad ${p.code} (${p.title}). ${url}`)} target="_blank" rel="noopener">
          <Icon name="whatsapp" size={18} /> WhatsApp
        </a>
        <a className="btn btn--s" href="#contacto">
          Consultar
        </a>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }} />
    </article>
  );
}
