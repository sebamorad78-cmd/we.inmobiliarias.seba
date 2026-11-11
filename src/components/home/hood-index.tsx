"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface HoodRow {
  name: string;
  city: string;
  count: number;
  image: string | null;
  from: string | null;
}

const hoodHref = (name: string) => `/propiedades?barrio=${encodeURIComponent(name)}`;

/**
 * Guía de barrios: lista a la izquierda y un panel fijo a la derecha con la foto
 * y los datos del barrio seleccionado (hover o foco con teclado). Nada se superpone al texto.
 */
export function HoodIndex({ hoods }: { hoods: HoodRow[] }) {
  const [active, setActive] = useState(0);
  const cur = hoods[active];
  if (!cur) return null;

  return (
    <div className="hguide">
      <ol className="hguide__list">
        {hoods.map((h, k) => (
          <li key={h.name}>
            <Link
              href={hoodHref(h.name)}
              className="hguide__row"
              aria-current={k === active ? "true" : undefined}
              onPointerEnter={() => setActive(k)}
              onFocus={() => setActive(k)}
            >
              <span className="hguide__name">{h.name}</span>
              <span className="hguide__city">{h.city}</span>
              <span className="hguide__count num">{h.count}</span>
            </Link>
          </li>
        ))}
      </ol>

      <aside className="hguide__panel" aria-live="polite">
        <div className="hguide__media">
          {hoods.map((h, k) =>
            h.image ? (
              <Image
                key={h.name}
                src={h.image}
                alt=""
                fill
                sizes="(max-width: 900px) 0px, 40vw"
                quality={80}
                className={k === active ? "is-on" : ""}
              />
            ) : null,
          )}
        </div>
        <div className="hguide__info">
          <p className="hguide__title">{cur.name}</p>
          <dl className="hguide__data">
            <div>
              <dt>Zona</dt>
              <dd>{cur.city}</dd>
            </div>
            <div>
              <dt>En cartera</dt>
              <dd className="num">
                {cur.count} {cur.count === 1 ? "propiedad" : "propiedades"}
              </dd>
            </div>
            {cur.from && (
              <div>
                <dt>Venta desde</dt>
                <dd className="num">{cur.from}</dd>
              </div>
            )}
          </dl>
          <Link href={hoodHref(cur.name)} className="link">
            Ver propiedades en {cur.name}
          </Link>
        </div>
      </aside>
    </div>
  );
}
