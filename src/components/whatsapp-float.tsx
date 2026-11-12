"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@/site.config";
import { whatsappLink } from "@/lib/format";
import { Icon } from "./icon";

export function WhatsAppFloat() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [past, setPast] = useState(false);

  // En la portada aparece recién al dejar atrás la imagen principal: no tapa la composición.
  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setPast(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // En la ficha la barra de contacto propia ya ofrece WhatsApp con el código de la propiedad.
  if (pathname.startsWith("/propiedades/")) return null;
  return (
    <a
      className={`wa-float ${isHome && !past ? "is-away" : ""}`}
      href={whatsappLink(site.whatsapp, `Hola ${site.name}, quisiera hacer una consulta.`)}
      target="_blank"
      rel="noopener"
      aria-label="Escribime por WhatsApp"
    >
      <Icon name="whatsapp" size={26} />
    </a>
  );
}
