"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "../icon";

/**
 * Ubicación en mapa: buscar por dirección (OpenStreetMap) o hacer clic/arrastrar el pin.
 * Guarda lat/lng en campos ocultos del formulario.
 */
export function LocationPicker({ lat: lat0, lng: lng0, addressFieldId, hoodFieldId }: { lat: number | null; lng: number | null; addressFieldId: string; hoodFieldId: string }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(lat0 != null && lng0 != null ? { lat: lat0, lng: lng0 } : null);
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let map: LeafletMap | null = null;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: false });
      mapRef.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);
      const icon = L.divIcon({ className: "map-pin", html: "<span>Aquí</span>", iconAnchor: [0, 0] });
      const place = (lat: number, lng: number) => {
        if (!markerRef.current) {
          markerRef.current = L.marker([lat, lng], { draggable: true, icon }).addTo(map!);
          markerRef.current.on("dragend", () => {
            const ll = markerRef.current!.getLatLng();
            setPos({ lat: +ll.lat.toFixed(6), lng: +ll.lng.toFixed(6) });
          });
        } else markerRef.current.setLatLng([lat, lng]);
        setPos({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
      };
      (map as LeafletMap & { _place?: typeof place })._place = place;
      if (lat0 != null && lng0 != null) {
        map.setView([lat0, lng0], 16);
        place(lat0, lng0);
      } else map.setView([-34.58, -58.45], 11);
      map.on("click", (e) => place(e.latlng.lat, e.latlng.lng));
    })();
    return () => {
      cancelled = true;
      map?.remove();
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search() {
    const address = (document.getElementById(addressFieldId) as HTMLInputElement | null)?.value.trim();
    const hood = (document.getElementById(hoodFieldId) as HTMLInputElement | null)?.value.trim();
    const q = [address, hood, "Argentina"].filter(Boolean).join(", ");
    if (!address && !hood) {
      setMsg("Completá la dirección o el barrio primero.");
      return;
    }
    setSearching(true);
    setMsg(null);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ar&q=${encodeURIComponent(q)}`, {
        headers: { "Accept-Language": "es" },
      });
      const [hit] = (await r.json()) as { lat: string; lon: string }[];
      if (!hit) setMsg("No encontramos esa dirección. Marcá el punto haciendo clic en el mapa.");
      else {
        const map = mapRef.current as (LeafletMap & { _place?: (a: number, b: number) => void }) | null;
        map?.setView([+hit.lat, +hit.lon], 17);
        map?._place?.(+hit.lat, +hit.lon);
      }
    } catch {
      setMsg("No se pudo buscar. Marcá el punto haciendo clic en el mapa.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="locpick">
      <input type="hidden" name="lat" value={pos?.lat ?? ""} />
      <input type="hidden" name="lng" value={pos?.lng ?? ""} />
      <div className="row" style={{ flexWrap: "wrap" }}>
        <button type="button" className="btn btn--ghost btn--s" onClick={search} disabled={searching}>
          <Icon name="search" size={16} /> {searching ? "Buscando…" : "Ubicar dirección en el mapa"}
        </button>
        <span className="tiny muted">
          {pos ? `Punto: ${pos.lat}, ${pos.lng} · podés arrastrar el pin para ajustarlo` : "O hacé clic en el mapa para marcar la ubicación."}
        </span>
        {pos && (
          <button
            type="button"
            className="linkbtn tiny"
            onClick={() => {
              markerRef.current?.remove();
              markerRef.current = null;
              setPos(null);
            }}
          >
            Quitar ubicación
          </button>
        )}
      </div>
      {msg && <p className="field-error">{msg}</p>}
      <div ref={el} className="pmap locpick__map" />
    </div>
  );
}
