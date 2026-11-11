"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "../icon";
import { AMENITIES, typeLabel } from "@/lib/labels";
import { PROPERTY_TYPES, type PropertyFilters } from "@/lib/types";

/**
 * Filtros como formulario GET real: funciona sin JavaScript y cada búsqueda
 * queda en la URL (se puede compartir, guardar o volver atrás).
 * Con JavaScript, se aplica al instante sin recargar.
 */
export function FilterPanel({
  filters,
  neighborhoods,
  view,
  activeCount,
}: {
  filters: PropertyFilters;
  neighborhoods: string[];
  view?: string;
  activeCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const currency = filters.currency ?? (filters.operation === "alquiler" ? "ARS" : "USD");

  function apply() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const p = new URLSearchParams();
    const multi: Record<string, string[]> = {};
    for (const [k, v] of fd.entries()) {
      const s = String(v).trim();
      if (!s) continue;
      if (k === "tipo" || k === "barrio" || k === "amenities") (multi[k] ??= []).push(s);
      else p.set(k, s);
    }
    for (const [k, arr] of Object.entries(multi)) p.set(k, arr.join(","));
    if (!p.get("desde") && !p.get("hasta")) p.delete("moneda");
    const qs = p.toString();
    startTransition(() => router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false }));
  }

  useEffect(() => {
    document.body.classList.toggle("filters-open", open);
    return () => document.body.classList.remove("filters-open");
  }, [open]);

  return (
    <>
      <button type="button" className="btn btn--ghost btn--s filters-toggle" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="filters">
        <Icon name="filter" size={18} /> Filtros {activeCount > 0 && <span className="pill num">{activeCount}</span>}
      </button>

      <aside id="filters" className={`filters ${open ? "is-open" : ""}`} aria-label="Filtros de búsqueda" aria-busy={pending}>
        <div className="filters__head">
          <p className="h3">Filtros</p>
          <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Cerrar filtros">
            <Icon name="close" size={18} />
          </button>
        </div>

        <form
          key={JSON.stringify(filters)}
          ref={formRef}
          method="get"
          action="/propiedades"
          className="filters__form"
          onChange={(e) => {
            const t = e.target as unknown as HTMLInputElement;
            if (t.type === "number" || t.type === "search") return; // se aplican al confirmar
            apply();
          }}
          onSubmit={(e) => {
            e.preventDefault();
            apply();
            setOpen(false);
          }}
        >
          {filters.operation && <input type="hidden" name="operacion" value={filters.operation} />}
          {filters.sort && <input type="hidden" name="orden" value={filters.sort} />}
          {view && <input type="hidden" name="vista" value={view} />}

          <label className="field">
            <span>Palabra clave o código</span>
            <input
              className="input"
              type="search"
              name="q"
              defaultValue={filters.q}
              placeholder="Ej.: pileta, RB-1041"
              onBlur={apply}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), apply())}
            />
          </label>

          <fieldset className="fgroup">
            <legend>Tipo de propiedad</legend>
            <div className="chips">
              {PROPERTY_TYPES.map((t) => (
                <label key={t} className="chip">
                  <input type="checkbox" name="tipo" value={t} defaultChecked={filters.type?.includes(t)} />
                  <span>{typeLabel[t]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="fgroup">
            <legend>Barrio</legend>
            <div className="chips">
              {neighborhoods.map((n) => (
                <label key={n} className="chip">
                  <input type="checkbox" name="barrio" value={n} defaultChecked={filters.neighborhood?.includes(n)} />
                  <span>{n}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="fgroup">
            <legend>Precio</legend>
            <div className="price-row">
              <select className="select" name="moneda" defaultValue={currency} aria-label="Moneda">
                <option value="USD">USD</option>
                <option value="ARS">$</option>
              </select>
              <input
                className="input"
                type="number"
                name="desde"
                min={0}
                step={1000}
                inputMode="numeric"
                placeholder="Desde"
                aria-label="Precio desde"
                defaultValue={filters.minPrice}
                onBlur={apply}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), apply())}
              />
              <input
                className="input"
                type="number"
                name="hasta"
                min={0}
                step={1000}
                inputMode="numeric"
                placeholder="Hasta"
                aria-label="Precio hasta"
                defaultValue={filters.maxPrice}
                onBlur={apply}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), apply())}
              />
            </div>
          </fieldset>

          <Steps name="ambientes" label="Ambientes" value={filters.minRooms} />
          <Steps name="dormitorios" label="Dormitorios" value={filters.minBedrooms} />
          <Steps name="banos" label="Baños" value={filters.minBathrooms} max={4} />

          <label className="field">
            <span>Superficie cubierta mínima</span>
            <select className="select" name="m2" defaultValue={filters.minArea ?? ""}>
              <option value="">Indistinta</option>
              {[40, 60, 80, 100, 150, 200, 300, 500].map((m) => (
                <option key={m} value={m}>
                  Desde {m} m²
                </option>
              ))}
            </select>
          </label>

          <fieldset className="fgroup">
            <legend>Condiciones</legend>
            <label className="check">
              <input type="checkbox" name="cochera" value="1" defaultChecked={filters.garage} /> Con cochera
            </label>
            <label className="check">
              <input type="checkbox" name="credito" value="1" defaultChecked={filters.mortgageEligible} /> Apto crédito
            </label>
          </fieldset>

          <details className="fgroup" open={!!filters.amenities?.length}>
            <summary>Comodidades</summary>
            <div className="chips" style={{ marginTop: 12 }}>
              {AMENITIES.map((a) => (
                <label key={a} className="chip">
                  <input type="checkbox" name="amenities" value={a} defaultChecked={filters.amenities?.includes(a)} />
                  <span>{a}</span>
                </label>
              ))}
            </div>
          </details>

          <div className="filters__foot">
            <a href={`/propiedades${filters.operation ? `?operacion=${filters.operation}` : ""}`} className="btn btn--ghost">
              Limpiar
            </a>
            <button type="submit" className="btn">
              {pending ? "Buscando…" : "Ver resultados"}
            </button>
          </div>
        </form>
      </aside>
      {open && <div className="filters-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
    </>
  );
}

function Steps({ name, label, value, max = 5 }: { name: string; label: string; value?: number; max?: number }) {
  const opts = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <fieldset className="fgroup">
      <legend>{label}</legend>
      <div className="steps">
        <label>
          <input type="radio" name={name} value="" defaultChecked={!value} />
          <span>Todos</span>
        </label>
        {opts.map((n) => (
          <label key={n}>
            <input type="radio" name={name} value={n} defaultChecked={value === n} />
            <span>
              {n}
              {n === max ? "+" : ""}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
