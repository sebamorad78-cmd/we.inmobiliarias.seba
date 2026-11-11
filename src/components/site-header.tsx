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

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`logo ${light ? "logo--light" : ""}`}>
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true" className="logo__mark">
        <path d="M4 27V12L16 4l12 8v15" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4 21c4-2.6 8-2.6 12 0s8 2.6 12 0" fill="none" stroke="var(--clay)" strokeWidth="1.6" />
        <path d="M4 26c4-2.6 8-2.6 12 0s8 2.6 12 0" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
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
