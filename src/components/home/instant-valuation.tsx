"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { site } from "@/site.config";

const TYPES = [
  { id: "departamento", label: "departamento" },
  { id: "casa", label: "casa" },
  { id: "ph", label: "PH" },
  { id: "oficina", label: "oficina" },
] as const;

const fmt = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
const round5k = (n: number) => Math.round(n / 5000) * 5000;

/** Número que se desliza suavemente hacia su nuevo valor (sin librerías). */
function useTween(value: number, ms = 550) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - t, 3);
      const v = a + (value - a) * e;
      setShown(v);
      from.current = v;
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}

/**
 * Tasador instantáneo: una frase editable que devuelve un rango de referencia
 * a partir de valores por m² de cada barrio (editables en site.config).
 */
export function InstantValuation({ image, listingsByHood }: { image: string; listingsByHood: Record<string, number> }) {
  const hoods = Object.keys(site.valuation.usdPerM2).sort((a, b) => a.localeCompare(b, "es"));
  const [type, setType] = useState<(typeof TYPES)[number]["id"]>("departamento");
  const [area, setArea] = useState(85);
  const [hood, setHood] = useState(hoods.includes("Palermo") ? "Palermo" : hoods[0]);

  const { low, high, perM2 } = useMemo(() => {
    const base = site.valuation.usdPerM2[hood] ?? 2500;
    const perM2 = Math.round(base * (site.valuation.typeFactor[type] ?? 1));
    const mid = perM2 * Math.max(20, Math.min(area, 2000));
    return { low: round5k(mid * (1 - site.valuation.spread)), high: round5k(mid * (1 + site.valuation.spread)), perM2 };
  }, [hood, type, area]);

  const lowT = useTween(low);
  const highT = useTween(high);
  const comps = listingsByHood[hood] ?? 0;
  const typeLabel = TYPES.find((t) => t.id === type)!.label;
  const href = `/tasaciones?tipo=${type}&m2=${area}&barrio=${encodeURIComponent(hood)}`;

  return (
    <section className="valuer" aria-labelledby="valuer-title">
      <div className="valuer__media">
        <Image src={image} alt="" fill sizes="(max-width: 1000px) 100vw, 45vw" quality={90} />
        <p className="valuer__caption">Tasación profesional sin cargo · Informe en 48 h</p>
      </div>

      <div className="valuer__body">
        <p className="eyebrow">04 — Para propietarios</p>
        <h2 id="valuer-title" className="h1 valuer__title">¿Cuánto vale hoy tu propiedad?</h2>

        <p className="valuer__sentence">
          Tengo {type === "casa" || type === "oficina" ? "una" : "un"}{" "}
          <label className="valuer__slot">
            <span className="sr-only">Tipo de propiedad</span>
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              {TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>{" "}
          de{" "}
          <label className="valuer__slot valuer__slot--num">
            <span className="sr-only">Superficie cubierta en metros cuadrados</span>
            <input
              type="number"
              inputMode="numeric"
              min={20}
              max={2000}
              step={5}
              value={area}
              onChange={(e) => setArea(Math.max(0, Number(e.target.value) || 0))}
              onBlur={() => setArea((a) => Math.max(20, Math.min(a, 2000)))}
            />
          </label>{" "}
          m² en{" "}
          <label className="valuer__slot">
            <span className="sr-only">Barrio</span>
            <select value={hood} onChange={(e) => setHood(e.target.value)}>
              {hoods.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
          </label>
          .
        </p>

        <div className="valuer__result" aria-live="polite">
          <p className="valuer__label">Valor de referencia</p>
          <p className="valuer__range num">
            <span>USD {fmt(lowT)}</span>
            <span className="valuer__dash" aria-hidden="true" />
            <span>{fmt(highT)}</span>
          </p>
          <dl className="valuer__stats">
            <div>
              <dt>Valor por m²</dt>
              <dd className="num">USD {fmt(perM2)}</dd>
            </div>
            <div>
              <dt>En cartera en {hood}</dt>
              <dd className="num">{comps ? `${comps} ${comps === 1 ? "propiedad" : "propiedades"}` : "—"}</dd>
            </div>
            <div>
              <dt>Tipo</dt>
              <dd>{typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}</dd>
            </div>
          </dl>
        </div>

        <div className="valuer__actions">
          <Link href={href} className="btn btn--clay">
            Pedir tasación profesional
          </Link>
          <Link href="/tasaciones#vender" className="link">
            Cómo vendemos
          </Link>
        </div>
        <p className="valuer__note">
          Referencia orientativa para una propiedad usada en buen estado. El valor final depende de piso, vista,
          amenities, estado y documentación: lo define un tasador matriculado en la visita.
        </p>
      </div>
    </section>
  );
}
