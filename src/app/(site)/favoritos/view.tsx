"use client";

import Link from "next/link";
import { site } from "@/site.config";
import { clear, useHydrated, useList } from "@/lib/shortlist";
import { usePropertiesByIds } from "@/lib/use-properties";
import { whatsappLink } from "@/lib/format";
import { Icon } from "@/components/icon";
import { PropertyCard } from "@/components/property-card";

export function FavoritesView() {
  const hydrated = useHydrated();
  const ids = useList("favorites");
  const items = usePropertiesByIds(ids);
  const loading = !hydrated || items === null;

  const shareText = items?.length
    ? `Hola ${site.name}, estas son las propiedades que me interesan:\n${items.map((p) => `• ${p.code} – ${p.title} (${site.url}/propiedades/${p.slug})`).join("\n")}`
    : "";

  return (
    <div className="wrap page-pad">
      <header className="page-head">
        <p className="eyebrow">Tu selección</p>
        <h1 className="h1">Favoritos</h1>
        <p className="lead">Las propiedades que guardaste quedan en este dispositivo. Enviánoslas y coordinamos las visitas en un solo recorrido.</p>
      </header>

      {loading ? (
        <ul className="grid-cards" aria-busy="true">
          {Array.from({ length: Math.max(ids.length, 3) }, (_, i) => (
            <li key={i} className="skeleton-card" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="empty">
          <Icon name="heart" size={28} />
          <p className="h3">Todavía no guardaste propiedades.</p>
          <p className="muted">Tocá el corazón en cualquier propiedad para sumarla acá.</p>
          <Link href="/propiedades" className="btn">
            Explorar propiedades
          </Link>
        </div>
      ) : (
        <>
          <div className="row" style={{ flexWrap: "wrap", marginBottom: 32 }}>
            <a className="btn btn--wa" href={whatsappLink(site.whatsapp, shareText)} target="_blank" rel="noopener">
              <Icon name="whatsapp" size={18} /> Enviar selección por WhatsApp
            </a>
            <button type="button" className="btn btn--ghost" onClick={() => confirm("¿Quitar todas las propiedades de favoritos?") && clear("favorites")}>
              Vaciar lista
            </button>
          </div>
          <ul className="grid-cards">
            {items.map((p) => (
              <li key={p.id}>
                <PropertyCard p={p} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
