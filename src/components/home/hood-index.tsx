"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface HoodRow {
  name: string;
  city: string;
  count: number;
  image: string | null;
  from: string | null;
}

/**
 * Índice de barrios: lista tipográfica grande. En escritorio, la foto del barrio
 * sigue al cursor con inercia (interpolación por cuadro, sin librerías).
 */
export function HoodIndex({ hoods }: { hoods: HoodRow[] }) {
  const [active, setActive] = useState<number | null>(null);
  const float = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (active == null) return;
    let raf = 0;
    const loop = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.16;
      pos.current.y += (target.current.y - pos.current.y) * 0.16;
      if (float.current) float.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <div
      className="hindex"
      onPointerMove={(e) => {
        target.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerLeave={() => setActive(null)}
    >
      <ol className="hindex__list">
        {hoods.map((h, k) => (
          <li key={h.name}>
            <Link
              href={`/propiedades?barrio=${encodeURIComponent(h.name)}`}
              className={`hindex__row ${active != null && active !== k ? "is-dim" : ""}`}
              onPointerEnter={(e) => {
                if (e.pointerType !== "mouse") return;
                if (active == null) pos.current = { x: e.clientX, y: e.clientY };
                target.current = { x: e.clientX, y: e.clientY };
                setActive(k);
              }}
              onFocus={() => setActive(null)}
            >
              <span className="hindex__n num">{String(k + 1).padStart(2, "0")}</span>
              <span className="hindex__name">{h.name}</span>
              <span className="hindex__city">{h.city}</span>
              <span className="hindex__count num">
                {h.count} {h.count === 1 ? "propiedad" : "propiedades"}
              </span>
              <span className="hindex__from num">{h.from ? `desde ${h.from}` : ""}</span>
            </Link>
          </li>
        ))}
      </ol>
      <div ref={float} className={`hindex__float ${active != null ? "is-on" : ""}`} aria-hidden="true">
        {hoods.map((h, k) =>
          h.image ? (
            <Image key={h.name} src={h.image} alt="" fill sizes="340px" quality={70} className={k === active ? "is-on" : ""} />
          ) : null,
        )}
      </div>
    </div>
  );
}
