"use client";

import { usePathname } from "next/navigation";
import { site } from "@/site.config";
import { whatsappLink } from "@/lib/format";
import { Icon } from "./icon";

export function WhatsAppFloat() {
  const pathname = usePathname();
  // En la ficha la barra de contacto propia ya ofrece WhatsApp con el código de la propiedad.
  if (pathname.startsWith("/propiedades/")) return null;
  return (
    <a
      className="wa-float"
      href={whatsappLink(site.whatsapp, `Hola ${site.name}, quisiera hacer una consulta.`)}
      target="_blank"
      rel="noopener"
      aria-label="Escribinos por WhatsApp"
    >
      <Icon name="whatsapp" size={26} />
    </a>
  );
}
