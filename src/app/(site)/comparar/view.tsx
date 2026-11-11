"use client";

import Link from "next/link";
import { clear, toggle, useHydrated, useList } from "@/lib/shortlist";
import { usePropertiesByIds } from "@/lib/use-properties";
import { formatArea, formatMoney, formatPrice, pricePerM2 } from "@/lib/format";
import { operationLabel, typeLabel } from "@/lib/labels";
import type { Property } from "@/lib/types";
import { Icon } from "@/components/icon";
import { Photo } from "@/components/photo";

const ROWS: { label: string; get: (p: Property) => string | null; best?: "min" | "max"; num?: (p: Property) => number | null }[] = [
  { label: "Precio", get: formatPrice, best: "min", num: (p) => p.price },
  { label: "Valor por m²", get: pricePerM2, best: "min", num: (p) => (p.price && (p.coveredArea ?? p.totalArea) ? p.price / (p.coveredArea ?? p.totalArea)! : null) },
  { label: "Expensas", get: (p) => (p.expenses ? formatMoney(p.expenses, "ARS") : "—"), best: "min", num: (p) => p.expenses },
  { label: "Operación", get: (p) => operationLabel[p.operation] },
  { label: "Tipo", get: (p) => typeLabel[p.type] },
  { label: "Barrio", get: (p) => p.neighborhood },
  { label: "Sup. cubierta", get: (p) => formatArea(p.coveredArea), best: "max", num: (p) => p.coveredArea },
  { label: "Sup. total", get: (p) => formatArea(p.totalArea), best: "max", num: (p) => p.totalArea },
  { label: "Ambientes", get: (p) => (p.rooms ? String(p.rooms) : null), best: "max", num: (p) => p.rooms },
  { label: "Dormitorios", get: (p) => (p.bedrooms ? String(p.bedrooms) : null), best: "max", num: (p) => p.bedrooms },
  { label: "Baños", get: (p) => (p.bathrooms ? String(p.bathrooms) : null), best: "max", num: (p) => p.bathrooms },
  { label: "Cocheras", get: (p) => (p.garages ? String(p.garages) : "—"), best: "max", num: (p) => p.garages },
  { label: "Antigüedad", get: (p) => (p.age == null ? null : p.age === 0 ? "A estrenar" : `${p.age} años`), best: "min", num: (p) => p.age },
  { label: "Apto crédito", get: (p) => (p.operation === "venta" ? (p.mortgageEligible ? "Sí" : "No") : "—") },
  { label: "Comodidades", get: (p) => p.amenities.join(", ") || "—" },
];

export function CompareView() {
  const hydrated = useHydrated();
  const ids = useList("compare");
  const items = usePropertiesByIds(ids);

  if (!hydrated || items === null) {
    return <div className="wrap page-pad"><div className="skeleton-card" style={{ height: 420 }} aria-busy="true" /></div>;
  }

  return (
    <div className="wrap page-pad">
      <header className="page-head">
        <p className="eyebrow">Comparador</p>
        <h1 className="h1">Comparar propiedades</h1>
        <p className="lead">Hasta cuatro propiedades lado a lado. Resaltamos el mejor valor de cada fila.</p>
      </header>

      {items.length < 2 ? (
        <div className="empty">
          <Icon name="compare" size={28} />
          <p className="h3">{items.length === 1 ? "Sumá al menos una propiedad más." : "No hay propiedades para comparar."}</p>
          <p className="muted">Usá el botón de comparar en las tarjetas o en cada ficha.</p>
          <Link href="/propiedades" className="btn">Explorar propiedades</Link>
        </div>
      ) : (
        <>
          <div className="compare-scroll">
            <table className="compare">
              <thead>
                <tr>
                  <th scope="col"><span className="sr-only">Característica</span></th>
                  {items.map((p) => (
                    <th key={p.id} scope="col">
                      <div className="compare__card">
                        <Link href={`/propiedades/${p.slug}`} className="compare__media">
                          {p.images[0] && <Photo src={p.images[0].url} alt={p.images[0].alt} fill sizes="280px" quality={70} />}
                        </Link>
                        <Link href={`/propiedades/${p.slug}`} className="compare__title">{p.title}</Link>
                        <span className="tiny muted">{p.code}</span>
                        <button type="button" className="compare__remove" onClick={() => toggle("compare", p.id)}>
                          <Icon name="close" size={14} /> Quitar
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => {
                  const nums = row.num ? items.map(row.num) : [];
                  const valid = nums.filter((n): n is number => n != null && n > 0);
                  const target = row.best && valid.length > 1 && new Set(valid).size > 1 ? (row.best === "min" ? Math.min(...valid) : Math.max(...valid)) : null;
                  // Precios en distintas monedas u operaciones no se comparan.
                  const comparable = !["Precio", "Valor por m²"].includes(row.label) || (new Set(items.map((p) => p.currency)).size === 1 && new Set(items.map((p) => p.operation)).size === 1);
                  return (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      {items.map((p, i) => (
                        <td key={p.id} className={comparable && target != null && nums[i] === target ? "is-best" : undefined}>
                          {row.get(p) ?? "—"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn btn--ghost" style={{ marginTop: 24 }} onClick={() => clear("compare")}>
            Vaciar comparador
          </button>
        </>
      )}
    </div>
  );
}
