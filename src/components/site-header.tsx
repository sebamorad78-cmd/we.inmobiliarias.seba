"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@/site.config";
import { useList } from "@/lib/shortlist";
import { whatsappLink } from "@/lib/format";
import { Icon } from "./icon";
import { openSearch } from "./search/command-search";

const NAV = [
  { href: "/propiedades?operacion=venta", label: "Comprar", match: "venta" },
  { href: "/propiedades?operacion=alquiler", label: "Alquilar", match: "alquiler" },
  { href: "/tasaciones", label: "Tasaciones" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

/** Monograma de la marca: "1" dorado, "B" y el techo de la casa (redibujado en vector). */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="logo__mark">
      {/* "1" dorado */}
      <path d="M6.5 15.5l4-2.2V33" fill="none" stroke="var(--gold)" strokeWidth="3.2" strokeLinecap="square" />
      {/* techo con chimenea */}
      <path d="M13.5 13.5L24.5 5l11 8.5M31 8.6V5.2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
      {/* B */}
      <path
        d="M15.5 16.5v16.5h8.2c3.2 0 5.3-1.9 5.3-4.6 0-2-1.2-3.4-3.1-3.9 1.5-.6 2.4-1.9 2.4-3.6 0-2.6-2-4.4-5-4.4z M19 19.4h3.9c1.5 0 2.4.8 2.4 2s-.9 2-2.4 2H19z M19 26.2h4.4c1.6 0 2.6.9 2.6 2.1 0 1.3-1 2.1-2.6 2.1H19z"
        fill="currentColor"
        fillRule="evenodd"
      />
      {/* paredes de la casa */}
      <path d="M33.5 15.5V33" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`logo ${light ? "logo--light" : ""}`}>
      <LogoMark />
      <span className="logo__text">
        <span className="logo__name">{site.name}</span>
        <span className="logo__tag">{site.tagline}</span>
      </span>
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const overlay = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const op = useSearchParams().get("operacion");
  const favs = useList("favorites");

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      // Se oculta al bajar y reaparece apenas el usuario sube: más pantalla para las fotos.
      if (Math.abs(y - lastY) > 6) {
        setHidden(y > lastY && y > 320);
        lastY = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname, op]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = !overlay || scrolled || open;

  const isActive = (item: (typeof NAV)[number]) =>
    item.match ? pathname.startsWith("/propiedades") && op === item.match : pathname.startsWith(item.href);

  return (
    <header className={`header ${solid ? "header--solid" : "header--overlay"} ${hidden && !open ? "is-hidden" : ""}`}>
      <div className="wrap header__inner">
        <Link href="/" className="header__logo" aria-label={`${site.name}, inicio`}>
          <Logo light={!solid} />
        </Link>

        <nav className="header__nav" aria-label="Principal">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="header__link" aria-current={isActive(item) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header__tools">
          <button type="button" className="header__search" onClick={openSearch} aria-label="Buscar (Ctrl K)">
            <Icon name="search" size={19} />
            <span>Buscar</span>
          </button>
          <Link href="/favoritos" className="header__fav" aria-label={`Favoritos (${favs.length})`}>
            <Icon name="heart" size={20} />
            {favs.length > 0 && <span className="header__badge num">{favs.length}</span>}
          </Link>
          <a
            className={`btn btn--s ${solid ? "" : "btn--light"} header__cta`}
            href={whatsappLink(site.whatsapp, `Hola ${site.name}, quisiera hacer una consulta.`)}
            target="_blank"
            rel="noopener"
          >
            <Icon name="whatsapp" size={18} />
            WhatsApp
          </a>
          <button
            type="button"
            className="header__burger"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "close" : "menu"} size={24} />
          </button>
        </div>
      </div>

      <div id="mobile-nav" className={`mnav ${open ? "is-open" : ""}`} hidden={!open}>
        <nav className="wrap mnav__inner" aria-label="Móvil">
          {NAV.map((item, i) => (
            <Link key={item.href} href={item.href} className="mnav__link" style={{ transitionDelay: `${i * 40}ms` }}>
              {item.label}
              <Icon name="arrowRight" size={20} />
            </Link>
          ))}
          <Link href="/favoritos" className="mnav__link">
            Favoritos {favs.length > 0 && `(${favs.length})`}
            <Icon name="heart" size={20} />
          </Link>
          <div className="mnav__contact">
            <a className="btn btn--wa btn--block" href={whatsappLink(site.whatsapp, `Hola ${site.name}, quisiera hacer una consulta.`)} target="_blank" rel="noopener">
              <Icon name="whatsapp" /> WhatsApp
            </a>
            <a className="btn btn--ghost btn--block" href={`tel:${site.phone.replace(/[^\d+]/g, "")}`}>
              <Icon name="phone" /> {site.phone}
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
