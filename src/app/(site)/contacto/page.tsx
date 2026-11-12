import { PageHero } from "@/components/page-hero";
import type { Metadata } from "next";
import { site } from "@/site.config";
import { whatsappLink } from "@/lib/format";
import { LeadForm } from "@/components/lead-form";
import { PropertyMap } from "@/components/map/property-map";

export const metadata: Metadata = {
  title: "Contacto",
  description: `Escribime, llamame o visitame en ${site.address.street}, ${site.address.city}.`,
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
    <>
    <PageHero
      title="Contacto"
      sub="Cada consulta la respondo personalmente, por WhatsApp, teléfono o email."
      image="/img/miramar/miramar-01-vista.jpg"
      position="50% 60%"
    />
    <section className="wrap page-pad split">
      <div className="split__text">
        <dl className="plainlist plainlist--big">
          <div>
            <dt>WhatsApp</dt>
            <dd>
              <a href={whatsappLink(site.whatsapp, `Hola ${site.name}, quisiera hacer una consulta.`)} target="_blank" rel="noopener">
                Escribir un mensaje
              </a>
            </dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>
              <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`}>{site.phone}</a>
            </dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </dd>
          </div>
          <div>
            <dt>Oficina</dt>
            <dd>
              {site.address.street}, {site.address.city}
            </dd>
          </div>
          {site.hours && (
            <div>
              <dt>Horario</dt>
              <dd>{site.hours}</dd>
            </div>
          )}
        </dl>
        <PropertyMap single className="pmap--contact" zoom={16} points={[{ id: "office", lat: site.geo.lat, lng: site.geo.lng, label: site.name, title: site.name, href: "#" }]} />
      </div>
      <div className="panel-card">
        <h2 className="h3" style={{ marginBottom: 20 }}>Mandame un mensaje</h2>
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
    </>
  );
}
