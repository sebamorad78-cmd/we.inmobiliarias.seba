"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { site } from "@/site.config";
import { Icon } from "../icon";
import { openSearch } from "../search/command-search";

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

function toDMS(v: number, pos: string, neg: string) {
  const a = Math.abs(v);
  const d = Math.floor(a);
  const m = Math.floor((a - d) * 60);
  const s = Math.round(((a - d) * 60 - m) * 60);
  return `${d}°${String(m).padStart(2, "0")}′${String(s).padStart(2, "0")}″${v < 0 ? neg : pos}`;
}

/** Hora de Buenos Aires: se pinta recién en el cliente para no generar diferencias de hidratación. */
function useBaTime() {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", hour12: false });
    const tick = () => setT(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);
  return t;
}

/**
 * Portada: recorrido por las propiedades destacadas.
 * Avance automático con barra de progreso real, pausa al pasar el mouse,
 * al cambiar de pestaña o si el usuario prefiere menos movimiento.
 */
export function HeroReel({ slides }: { slides: ReelSlide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0, 1]));
  const progress = useRef<HTMLSpanElement[]>([]);
  const touchX = useRef<number | null>(null);
  const elapsed = useRef(0);
  const time = useBaTime();
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
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Un solo requestAnimationFrame mueve la barra y decide el cambio: sin timers desfasados.
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
        if (el) el.style.transform = `scaleX(${k < i ? 1 : k === i ? p : 0})`;
      });
      if (p >= 1) go(i + 1);
      else raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [i, paused, reduced, n, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector("dialog[open]")) return;
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, go]);

  const s = slides[i];

  return (
    <section
      className="reel"
      aria-roledescription="carrusel"
      aria-label="Propiedades destacadas"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 45) go(i + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="reel__stage">
        {slides.map((sl, k) =>
          seen.has(k) ? (
            <div key={sl.href} className={`reel__slide ${k === i ? "is-active" : ""}`} aria-hidden={k !== i}>
              <Image src={sl.image} alt={sl.alt} fill priority={k === 0} sizes="100vw" quality={90} className="reel__img" />
            </div>
          ) : null,
        )}
        <div className="reel__shade" />
      </div>

      <div className="wrap reel__top">
        <p className="reel__meta">
          <span className="reel__coord">{toDMS(site.geo.lat, "N", "S")}</span>
          <span className="reel__coord">{toDMS(site.geo.lng, "E", "O")}</span>
          <span suppressHydrationWarning>{time ? `Buenos Aires ${time}` : "Buenos Aires"}</span>
        </p>
      </div>

      <div className="wrap reel__body">
        <div className="reel__intro">
          <p className="reel__kicker">Venta, alquiler y tasación de propiedades</p>
          <h1 className="reel__claim">
            Buenos Aires
            <br />
            y Zona Norte
          </h1>
          <button type="button" className="reel__search" onClick={openSearch}>
            <Icon name="search" size={18} />
            <span>Buscar por barrio, tipo o código</span>
            <kbd>Ctrl K</kbd>
          </button>
        </div>

        <div className="reel__card" key={s.href} aria-live="polite">
          <p className="reel__index num">
            {String(i + 1).padStart(2, "0")} <span>/ {String(n).padStart(2, "0")}</span>
          </p>
          <p className="reel__hood">{s.hood}</p>
          <h2 className="reel__title">
            <Link href={s.href}>{s.title}</Link>
          </h2>
          <p className="reel__facts">{s.facts}</p>
          <div className="reel__row">
            <span className="reel__price num">{s.price}</span>
            <Link href={s.href} className="reel__cta">
              Ver propiedad
            </Link>
          </div>
        </div>
      </div>

      {n > 1 && (
        <div className="wrap reel__nav">
          <div className="reel__bars" role="tablist" aria-label="Elegir propiedad">
            {slides.map((sl, k) => (
              <button
                key={sl.href}
                type="button"
                role="tab"
                aria-selected={k === i}
                aria-label={`${k + 1}: ${sl.title}`}
                className="reel__bar"
                onClick={() => go(k)}
              >
                <span className="reel__bar-fill" ref={(el) => void (el && (progress.current[k] = el))} />
                <span className="reel__bar-label">{sl.hood}</span>
              </button>
            ))}
          </div>
          <div className="reel__arrows">
            <button type="button" onClick={() => go(i - 1)} aria-label="Anterior">
              <Icon name="chevronLeft" size={20} />
            </button>
            <button type="button" onClick={() => go(i + 1)} aria-label="Siguiente">
              <Icon name="chevronRight" size={20} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
