"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "../icon";

const MAIN: { href: string; label: string; icon: IconName; exact?: boolean }[] = [
  { href: "/panel", label: "Hoy", icon: "today", exact: true },
  { href: "/panel/agenda", label: "Agenda", icon: "calendar" },
  { href: "/panel/contactos", label: "Contactos", icon: "contact" },
  { href: "/panel/oportunidades", label: "Negocios", icon: "kanban" },
];

const MORE: { href: string; label: string; icon: IconName }[] = [
  { href: "/panel/consultas", label: "Consultas", icon: "inbox" },
  { href: "/panel/propiedades", label: "Propiedades", icon: "home" },
  { href: "/panel/alquileres", label: "Alquileres", icon: "key" },
  { href: "/panel/reportes", label: "Reportes", icon: "chart" },
  { href: "/panel/equipo", label: "Equipo", icon: "users" },
  { href: "/panel/cuenta", label: "Mi cuenta", icon: "shield" },
];

/** Navegación del panel en el celular: barra inferior con lo de todos los días y "Más" para el resto. */
export function MobileTabs({ newLeads, overdue, isAdmin }: { newLeads: number; overdue: number; isAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));
  const moreActive = MORE.some((m) => isActive(m.href));

  return (
    <>
      {open && <div className="mtabs__scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
      {open && (
        <nav className="mtabs__sheet" aria-label="Más secciones">
          {MORE.filter((m) => isAdmin || m.href !== "/panel/equipo").map((m) => (
            <Link key={m.href} href={m.href} aria-current={isActive(m.href) ? "page" : undefined}>
              <Icon name={m.icon} size={20} />
              <span>{m.label}</span>
              {m.href === "/panel/consultas" && newLeads > 0 && <span className="mtabs__badge num">{newLeads}</span>}
            </Link>
          ))}
          <a href="/" target="_blank" rel="noopener">
            <Icon name="external" size={20} />
            <span>Ver sitio</span>
          </a>
        </nav>
      )}
      <nav className="mtabs" aria-label="Panel">
        {MAIN.map((m) => (
          <Link key={m.href} href={m.href} aria-current={isActive(m.href, m.exact) ? "page" : undefined}>
            <span className="mtabs__icon">
              <Icon name={m.icon} size={21} />
              {m.href === "/panel" && overdue > 0 && <span className="mtabs__badge num">{overdue}</span>}
            </span>
            <span>{m.label}</span>
          </Link>
        ))}
        <button type="button" aria-expanded={open} aria-current={moreActive ? "page" : undefined} onClick={() => setOpen((v) => !v)}>
          <span className="mtabs__icon">
            <Icon name="menu" size={21} />
            {newLeads > 0 && <span className="mtabs__badge num">{newLeads}</span>}
          </span>
          <span>Más</span>
        </button>
      </nav>
    </>
  );
}
