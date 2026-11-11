import type { Metadata } from "next";
import { site } from "@/site.config";
import { whatsappLink } from "@/lib/format";
import { Icon } from "@/components/icon";
import { LeadForm } from "@/components/lead-form";
import { PropertyMap } from "@/components/map/property-map";

export const metadata: Metadata = {
  title: "Contacto",
  description: `Escribinos, llamanos o visitanos en ${site.address.street}, ${site.address.city}.`,
  alternates: { canonical: "/contacto" },
};

const TOPICS: Record<string, string> = {
  compra: "Quiero comprar",
  venta: "Quiero vender",
  alquiler: "Busco alquilar",
  administracion: "Administración de alquileres",
  trabajo: "Trabajar en el equipo",
  otro: "Otro motivo",
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ motivo?: string }> }) {
  const { motivo } = await searchParams;
  const topic = motivo && motivo in TOPICS ? TOPICS[motivo] : TOPICS.compra;
  return (
    <section className="wrap page-pad split">
      <div className="split__text">
        <p className="eyebrow">Contacto</p>
        <h1 className="h1">Hablemos de tu próxima propiedad</h1>
        <p className="lead">Respondemos todas las consultas dentro del mismo día hábil.</p>
        <ul className="contact-list">
          <li>
            <Icon name="whatsapp" size={22} />
            <div>
              <p className="label">WhatsApp</p>
              <a href={whatsappLink(site.whatsapp, `Hola ${site.name}, quisiera hacer una consulta.`)} target="_blank" rel="noopener">Escribinos ahora</a>
            </div>
          </li>
          <li>
            <Icon name="phone" size={22} />
            <div>
              <p className="label">Teléfono</p>
              <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`}>{site.phone}</a>
            </div>
          </li>
          <li>
            <Icon name="mail" size={22} />
            <div>
              <p className="label">Email</p>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </div>
          </li>
          <li>
            <Icon name="pin" size={22} />
            <div>
              <p className="label">Oficina</p>
              <p>{site.address.street}, {site.address.city}</p>
              <p className="small muted">{site.hours}</p>
            </div>
          </li>
        </ul>
        <PropertyMap single className="pmap--contact" zoom={16} points={[{ id: "office", lat: site.geo.lat, lng: site.geo.lng, label: site.name, title: site.name, href: "#" }]} />
      </div>
      <div className="panel-card">
        <h2 className="h3" style={{ marginBottom: 20 }}>Envianos un mensaje</h2>
        <LeadForm
          kind="contacto"
          extra={
            <label className="field">
              <span>Motivo</span>
              <select className="select" name="topic" defaultValue={topic}>
                {Object.values(TOPICS).map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
          }
        />
      </div>
    </section>
  );
}
