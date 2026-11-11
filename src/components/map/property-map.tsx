"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  title: string;
  href: string;
  image?: string;
  /** Ubicación aproximada: se dibuja un área y no un punto exacto. */
  approximate?: boolean;
}

const TILES = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Mapa liviano (Leaflet + OpenStreetMap), sin claves ni costos por uso.
 * Se carga solo cuando el usuario llega al mapa.
 */
export function PropertyMap({
  points,
  single = false,
  className = "",
  zoom = 15,
}: {
  points: MapPoint[];
  single?: boolean;
  className?: string;
  zoom?: number;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const key = points.map((p) => p.id).join("|");

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | null = null;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      map = L.map(el.current, {
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
      });
      mapRef.current = map;
      L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19, subdomains: "abcd" }).addTo(map);

      const bounds = L.latLngBounds([]);
      for (const p of points) {
        const ll = L.latLng(p.lat, p.lng);
        bounds.extend(ll);
        if (single && p.approximate) {
          L.circle(ll, { radius: 350, color: "#a9502c", weight: 1.5, fillColor: "#a9502c", fillOpacity: 0.14 }).addTo(map);
          continue;
        }
        const icon = L.divIcon({
          className: "map-pin",
          html: `<span>${esc(p.label)}</span>`,
          iconSize: undefined,
          iconAnchor: [0, 0],
        });
        const marker = L.marker(ll, { icon, title: p.title, riseOnHover: true }).addTo(map);
        if (!single) {
          marker.bindPopup(
            `<a class="map-pop" href="${esc(p.href)}">${p.image ? `<img src="${esc(p.image.replace("w=2400", "w=480"))}" alt="" loading="lazy">` : ""}<strong>${esc(p.title)}</strong><span>${esc(p.label)}</span></a>`,
            { closeButton: false, maxWidth: 260, minWidth: 220, offset: [0, -4] },
          );
        }
      }
      if (points.length === 1) map.setView(bounds.getCenter(), zoom);
      else if (points.length > 1) map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
      else map.setView([-34.58, -58.43], 11);

      // Habilita el zoom con rueda recién cuando el usuario hace clic: evita "secuestrar" el scroll de la página.
      map.once("click", () => map?.scrollWheelZoom.enable());
    })();
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, single, zoom]);

  return <div ref={el} className={`pmap ${className}`} role="region" aria-label="Mapa de propiedades" />;
}
