"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "../icon";

export function PanelNav({ isAdmin, newLeads }: { isAdmin: boolean; newLeads: number }) {
  const pathname = usePathname();
  const items: { href: string; label: string; icon: IconName; badge?: number; exact?: boolean }[] = [
    { href: "/panel", label: "Resumen", icon: "chart", exact: true },
    { href: "/panel/propiedades", label: "Propiedades", icon: "home" },
    { href: "/panel/consultas", label: "Consultas", icon: "inbox", badge: newLeads },
    ...(isAdmin ? [{ href: "/panel/equipo", label: "Equipo", icon: "users" as IconName }] : []),
    { href: "/panel/cuenta", label: "Mi cuenta", icon: "key" },
  ];
  return (
    <nav className="pnav" aria-label="Panel">
      {items.map((i) => {
        const active = i.exact ? pathname === i.href : pathname.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className="pnav__item" aria-current={active ? "page" : undefined}>
            <Icon name={i.icon} size={19} />
            <span>{i.label}</span>
            {i.badge ? <span className="pill num">{i.badge}</span> : null}
          </Link>
        );
      })}
      <a href="/" target="_blank" rel="noopener" className="pnav__item pnav__item--muted">
        <Icon name="external" size={19} /> <span>Ver sitio</span>
      </a>
    </nav>
  );
}
