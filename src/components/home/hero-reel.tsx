"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Img as Image } from "@/components/img";
import { PROPERTY_TYPES } from "@/lib/types";
import { typeLabel } from "@/lib/labels";

export interface ReelSlide {
  href: string;
  image: string;
  alt: string;
  title: string;
  hood: string;
  facts: string;
  price: string;
  code: string;
}

const DURATION = 7000;

/**
 * Portada: la foto de fondo recorre las propiedades destacadas y abajo queda
 * la tira con todas ellas (miniatura, zona y precio). Al pasar por una tarjeta
 * se muestra su foto; al tocarla se abre la ficha.
 */
export function HeroReel({ slides, zones }: { slides: ReelSlide[]; zones: string[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0, 1]));
  const progress = useRef<HTMLSpanElement[]>([]);
  const strip = useRef<HTMLOListElement>(null);
  const touchX = useRef<number | null>(null);
  const elapsed = useRef(0);
  const n = slides.length;

  const go = useCallback(
    (to: number) => {
      const next = (to + n) % n;
      elapsed.current = 0;
      setI(next);
      setSeen((s) => new Set(s).add(next).add((next + 1) % n));
    },
    [n],
  );

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Un solo requestAnimationFrame mueve la barra de la tarjeta activa y decide el cambio.
  useEffect(() => {
    if (n < 2 || reduced) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      if (!paused) elapsed.current += dt;
      const p = Math.min(1, elapsed.current / DURATION);
      progress.current.forEach((el, k) => {
        if (el) el.style.transform = `scaleX(${k === i ? p : 0})`;
      });
      if (p >= 1) go(i + 1);
      else raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [i, paused, reduced, n, go]);

  // En el celular, la tarjeta activa se mantiene a la vista dentro de la tira (sin mover la página).
  useEffect(() => {
    const list = strip.current;
    const card = list?.children[i] as HTMLElement | undefined;
    if (!list || !card || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: card.offsetLeft - 16, behavior: reduced ? "auto" : "smooth" });
  }, [i, reduced]);

  return (
    <section
      className="reel"
      aria-roledescription="carrusel"
      aria-label="Propiedades destacadas"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 45 && (e.target as HTMLElement).closest(".reel__stage")) go(i + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="reel__stage">
        {slides.map((sl, k) =>
          seen.has(k) ? (
            <div key={sl.href} className={`reel__slide ${k === i ? "is-active" : ""}`} aria-hidden={k !== i}>
              <Image
                src={sl.image}
                alt={sl.alt}
                fill
                preload={k === 0}
                fetchPriority={k === 0 ? "high" : "low"}
                loading={k === 0 ? "eager" : "lazy"}
                sizes="100vw"
                quality={80}
                className="reel__img"
              />
            </div>
          ) : null,
        )}
        <div className="reel__shade" />
      </div>

      <div className="wrap reel__body">
        <div className="reel__intro">
          <p className="reel__kicker">Venta, alquiler y tasación</p>
          <h1 className="reel__claim">
            Casas, campos
            <br />
            y departamentos
          </h1>
          <Finder zones={zones} />
        </div>
      </div>

      {n > 0 && (
        <div className="wrap reel__stripwrap" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <ol className="rstrip" ref={strip} aria-label="Propiedades destacadas">
            {slides.map((sl, k) => (
              <li key={sl.href}>
                <Link
                  href={sl.href}
                  className={`rcard ${k === i ? "is-active" : ""}`}
                  aria-current={k === i ? "true" : undefined}
                  onMouseEnter={() => k !== i && go(k)}
                  onFocus={() => k !== i && go(k)}
                >
                  <span className="rcard__bar" aria-hidden="true">
                    <span ref={(el) => void (el && (progress.current[k] = el))} />
                  </span>
                  <span className="rcard__thumb">
                    <Image src={sl.image} alt="" fill sizes="80px" quality={70} />
                  </span>
                  <span className="rcard__text">
                    <span className="rcard__title">{sl.title}</span>
                    <span className="rcard__meta">
                      {sl.hood}
                      {/^\D*\d/.test(sl.price) ? ` · ${sl.price}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

/** Buscador de la portada: operación, tipo y zona. Lleva al listado ya filtrado. */
function Finder({ zones }: { zones: string[] }) {
  const router = useRouter();
  const [op, setOp] = useState("venta");
  const [type, setType] = useState("");
  const [zone, setZone] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams({ operacion: op });
    if (type) p.set("tipo", type);
    if (zone) p.set("barrio", zone);
    router.push(`/propiedades?${p.toString()}`);
  }

  return (
    <form className="hfind" onSubmit={onSubmit} role="search" aria-label="Buscar propiedades">
      <label className="hfind__f">
        <span>Busco</span>
        <select value={op} onChange={(e) => setOp(e.target.value)}>
          <option value="venta">Comprar</option>
          <option value="alquiler">Alquilar</option>
        </select>
      </label>
      <label className="hfind__f">
        <span>Tipo</span>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Todos</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {typeLabel[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="hfind__f hfind__f--grow">
        <span>Zona</span>
        <select value={zone} onChange={(e) => setZone(e.target.value)}>
          <option value="">Todas</option>
          {zones.map((z) => (
            <option key={z}>{z}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="hfind__go">
        Buscar
      </button>
    </form>
  );
}
