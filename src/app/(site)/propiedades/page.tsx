import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getNeighborhoodStats, searchProperties } from "@/lib/catalog";
import { countActiveFilters, filtersToQuery, parseFilters, type RawSearchParams } from "@/lib/filters";
import { formatMoney } from "@/lib/format";
import { operationLabel, typeLabel, typePlural } from "@/lib/labels";
import type { PropertyFilters } from "@/lib/types";
import { FilterPanel } from "@/components/listing/filter-panel";
import { SortSelect } from "@/components/listing/sort-select";
import { Icon } from "@/components/icon";
import { LeadForm } from "@/components/lead-form";
import { PropertyCard } from "@/components/property-card";
import { PropertyMap, type MapPoint } from "@/components/map/property-map";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

function heading(f: PropertyFilters): string {
  const what =
    f.type?.length === 1 ? typePlural[f.type[0]] : f.type?.length ? "Propiedades" : "Propiedades";
  const op =
    f.operation === "venta"
      ? " en venta"
      : f.operation === "alquiler"
        ? " en alquiler"
        : f.operation === "temporario"
          ? " en alquiler temporario"
          : "";
  const where = f.neighborhood?.length === 1 ? ` en ${f.neighborhood[0]}` : "";
  return `${what}${op}${where}`;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<RawSearchParams> }): Promise<Metadata> {
  const f = parseFilters(await searchParams);
  const title = heading(f);
  return {
    title,
    description: `${title}. Fichas completas con fotos, planos, ubicación y contacto directo con el asesor.`,
    alternates: { canonical: `/propiedades${filtersToQuery({ operation: f.operation, type: f.type, neighborhood: f.neighborhood })}` },
  };
}

export default async function ListingPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const view = sp.vista === "mapa" ? "mapa" : undefined;
  const page = Math.max(1, Number(sp.pagina) || 1);

  const [results, hoods] = await Promise.all([searchProperties(filters), getNeighborhoodStats()]);
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = view ? results : results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const activeCount = countActiveFilters(filters);

  const q = (patch: Partial<PropertyFilters>, extra: Record<string, string | undefined> = {}) =>
    `/propiedades${filtersToQuery({ ...filters, ...patch }, { vista: view, ...extra })}`;

  // Chips de filtros activos: cada uno se puede quitar con un clic.
  const chips: { label: string; href: string }[] = [];
  filters.type?.forEach((t) =>
    chips.push({ label: typeLabel[t], href: q({ type: filters.type!.filter((x) => x !== t) }) }),
  );
  filters.neighborhood?.forEach((n) =>
    chips.push({ label: n, href: q({ neighborhood: filters.neighborhood!.filter((x) => x !== n) }) }),
  );
  if (filters.minPrice || filters.maxPrice) {
    const cur = filters.currency ?? (filters.operation === "alquiler" ? "ARS" : "USD");
    const label = [
      filters.minPrice ? `desde ${formatMoney(filters.minPrice, cur)}` : "",
      filters.maxPrice ? `hasta ${formatMoney(filters.maxPrice, cur)}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    chips.push({ label: label.charAt(0).toUpperCase() + label.slice(1), href: q({ minPrice: undefined, maxPrice: undefined, currency: undefined }) });
  }
  if (filters.minRooms) chips.push({ label: `${filters.minRooms}+ ambientes`, href: q({ minRooms: undefined }) });
  if (filters.minBedrooms) chips.push({ label: `${filters.minBedrooms}+ dormitorios`, href: q({ minBedrooms: undefined }) });
  if (filters.minBathrooms) chips.push({ label: `${filters.minBathrooms}+ baños`, href: q({ minBathrooms: undefined }) });
  if (filters.minArea) chips.push({ label: `Desde ${filters.minArea} m²`, href: q({ minArea: undefined }) });
  if (filters.garage) chips.push({ label: "Con cochera", href: q({ garage: undefined }) });
  if (filters.mortgageEligible) chips.push({ label: "Apto crédito", href: q({ mortgageEligible: undefined }) });
  filters.amenities?.forEach((a) =>
    chips.push({ label: a, href: q({ amenities: filters.amenities!.filter((x) => x !== a) }) }),
  );
  if (filters.q) chips.push({ label: `“${filters.q}”`, href: q({ q: undefined }) });

  const points: MapPoint[] = results
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({
      id: p.id,
      lat: p.lat!,
      lng: p.lng!,
      title: p.title,
      href: `/propiedades/${p.slug}`,
      image: p.images[0]?.url,
      label:
        p.price == null
          ? "Consultar"
          : p.currency === "USD"
            ? `USD ${p.price >= 1_000_000 ? `${(p.price / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 2 })} M` : `${Math.round(p.price / 1000)} mil`}`
            : `$ ${p.price >= 1_000_000 ? `${(p.price / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} M` : `${Math.round(p.price / 1000)} mil`}`,
    }));

  const searchSummary = [heading(filters), ...chips.map((c) => c.label)].join(" · ");

  return (
    <div className={`listing ${view ? "listing--map" : ""}`}>
      <div className="listing__bar">
        <div className="wrap listing__bar-inner">
          <nav className="segmented" aria-label="Operación">
            <Link href={q({ operation: undefined }, { pagina: undefined })} aria-current={!filters.operation ? "page" : undefined}>
              Todas
            </Link>
            {(["venta", "alquiler", "temporario"] as const).map((o) => (
              <Link key={o} href={q({ operation: o, minPrice: undefined, maxPrice: undefined, currency: undefined })} aria-current={filters.operation === o ? "page" : undefined}>
                {o === "temporario" ? "Temporario" : operationLabel[o]}
              </Link>
            ))}
          </nav>
          <div className="listing__tools">
            <Suspense>
              <SortSelect value={filters.sort ?? "recientes"} />
            </Suspense>
            <div className="viewtoggle" role="group" aria-label="Vista">
              <Link href={q({}, { vista: undefined })} aria-current={!view ? "page" : undefined} aria-label="Ver en grilla">
                <Icon name="grid" size={18} /> <span>Grilla</span>
              </Link>
              <Link href={q({}, { vista: "mapa" })} aria-current={view ? "page" : undefined} aria-label="Ver en mapa">
                <Icon name="map" size={18} /> <span>Mapa</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap listing__body">
        <FilterPanel filters={filters} neighborhoods={hoods.map((h) => h.name).sort()} view={view} activeCount={activeCount} />

        <section className="listing__results" aria-labelledby="results-title">
          <header className="listing__head">
            <h1 id="results-title" className="h2">
              {heading(filters)}
            </h1>
            <p className="muted" aria-live="polite">
              {results.length === 0
                ? "Sin resultados"
                : `${results.length} ${results.length === 1 ? "propiedad" : "propiedades"}`}
            </p>
          </header>

          {chips.length > 0 && (
            <ul className="active-chips" aria-label="Filtros aplicados">
              {chips.map((c) => (
                <li key={c.label}>
                  <Link href={c.href} scroll={false} aria-label={`Quitar filtro ${c.label}`}>
                    {c.label} <Icon name="close" size={14} />
                  </Link>
                </li>
              ))}
              <li>
                <Link href={`/propiedades${filters.operation ? `?operacion=${filters.operation}` : ""}`} className="active-chips__clear">
                  Limpiar todo
                </Link>
              </li>
            </ul>
          )}

          {results.length === 0 ? (
            <div className="empty">
              <p className="h3">No encontramos propiedades con esos filtros.</p>
              <p className="muted">
                Probá ampliar el presupuesto o quitar algún filtro. También podés dejarnos tu búsqueda: muchas propiedades
                se venden antes de publicarse.
              </p>
              <Link className="btn btn--ghost" href={`/propiedades${filters.operation ? `?operacion=${filters.operation}` : ""}`}>
                Quitar filtros
              </Link>
            </div>
          ) : view ? (
            <div className="mapview">
              <h2 className="sr-only">Resultados</h2>
              <ul className="mapview__list">
                {shown.map((p, i) => (
                  <li key={p.id}>
                    <PropertyCard p={p} priority={i < 2} sizes="(max-width: 1000px) 100vw, 30vw" />
                  </li>
                ))}
              </ul>
              <div className="mapview__map">
                <PropertyMap points={points} />
              </div>
            </div>
          ) : (
            <>
              <h2 className="sr-only">Resultados</h2>
              <ul className="grid-cards">
                {shown.map((p, i) => (
                  <li key={p.id}>
                    <PropertyCard p={p} priority={i < 3} />
                  </li>
                ))}
              </ul>
              {pages > 1 && (
                <nav className="pager" aria-label="Paginación">
                  {current > 1 && (
                    <Link href={q({}, { pagina: String(current - 1) })} className="icon-btn" aria-label="Página anterior">
                      <Icon name="chevronLeft" size={18} />
                    </Link>
                  )}
                  {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                    <Link key={n} href={q({}, { pagina: n > 1 ? String(n) : undefined })} aria-current={n === current ? "page" : undefined} className="pager__n num">
                      {n}
                    </Link>
                  ))}
                  {current < pages && (
                    <Link href={q({}, { pagina: String(current + 1) })} className="icon-btn" aria-label="Página siguiente">
                      <Icon name="chevronRight" size={18} />
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}

          <aside className="alert-box">
            <div>
              <p className="eyebrow">Búsqueda personalizada</p>
              <h2 className="h3">¿No está lo que buscás? Te avisamos cuando entre.</h2>
              <p className="muted small">
                Guardamos tu búsqueda y un asesor te escribe apenas ingresa algo que coincida, antes de publicarlo.
              </p>
            </div>
            <LeadForm kind="consulta" defaultMessage={`Quiero recibir novedades de: ${searchSummary}`} submitLabel="Avisarme" />
          </aside>
        </section>
      </div>
    </div>
  );
}
