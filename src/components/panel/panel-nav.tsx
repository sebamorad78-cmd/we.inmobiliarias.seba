"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "../icon";

type Item = { href: string; label: string; icon: IconName; badge?: number; exact?: boolean; alert?: boolean };

export function PanelNav({ isAdmin, newLeads, overdue, alerts }: { isAdmin: boolean; newLeads: number; overdue: number; alerts: number }) {
  const pathname = usePathname();
  const groups: { title: string; items: Item[] }[] = [
    {
      title: "Día a día",
      items: [
        { href: "/panel", label: "Hoy", icon: "today", exact: true, badge: overdue, alert: overdue > 0 },
        { href: "/panel/agenda", label: "Agenda", icon: "calendar" },
        { href: "/panel/consultas", label: "Consultas", icon: "inbox", badge: newLeads, alert: newLeads > 0 },
      ],
    },
    {
      title: "Clientes y negocios",
      items: [
        { href: "/panel/contactos", label: "Contactos", icon: "contact" },
        { href: "/panel/oportunidades", label: "Oportunidades", icon: "kanban" },
      ],
    },
    {
      title: "Cartera",
      items: [
        { href: "/panel/propiedades", label: "Propiedades", icon: "home" },
        { href: "/panel/alquileres", label: "Alquileres", icon: "key", badge: alerts },
      ],
    },
    {
      title: "Gestión",
      items: [
        { href: "/panel/reportes", label: "Reportes", icon: "chart" },
        ...(isAdmin ? [{ href: "/panel/equipo", label: "Equipo", icon: "users" as IconName }] : []),
        { href: "/panel/cuenta", label: "Mi cuenta", icon: "shield" },
      ],
    },
  ];
  return (
    <nav className="pnav" aria-label="Panel">
      {groups.map((g) => (
        <div key={g.title} className="pnav__group">
          <p className="pnav__title">{g.title}</p>
          {g.items.map((i) => {
            const active = i.exact ? pathname === i.href : pathname.startsWith(i.href);
            return (
              <Link key={i.href} href={i.href} className="pnav__item" aria-current={active ? "page" : undefined}>
                <Icon name={i.icon} size={18} />
                <span>{i.label}</span>
                {i.badge ? <span className={`pnav__badge num ${i.alert ? "is-alert" : ""}`}>{i.badge}</span> : null}
              </Link>
            );
          })}
        </div>
      ))}
      <a href="/" target="_blank" rel="noopener" className="pnav__item pnav__item--muted">
        <Icon name="external" size={18} /> <span>Ver sitio</span>
      </a>
    </nav>
  );
}
