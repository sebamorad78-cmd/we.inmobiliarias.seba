import type { Metadata } from "next";
import { site } from "@/site.config";
import { whatsappLink } from "@/lib/format";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Rita Bazzigalupi",
  description: `${site.name}, martillera y corredora pública en Ayacucho. Egresada de la Universidad FASTA. Campos, quintas, casas y lotes en Ayacucho y la región.`,
  alternates: { canonical: "/nosotros" },
};

/** Forma de trabajo: hechos concretos, sin promesas que la titular no haya confirmado. */
const WAYS = [
  {
    title: "Atención personal",
    text: "Atiendo cada consulta en persona, desde el primer llamado hasta la firma de la escritura. Sin intermediarios.",
  },
  {
    title: "La zona, de primera mano",
    text: "Trabajo en Ayacucho y sus campos, y en la región: Maipú, General Pirán, Rauch, Tandil y la costa.",
  },
  {
    title: "Tasaciones fundadas",
    text: "Recorro cada propiedad, reviso títulos y planos de mensura, y entrego un informe escrito firmado con mi matrícula.",
  },
  {
    title: "Acompañamiento hasta el final",
    text: "Coordino la documentación, la reserva, el boleto y la escritura con la escribanía que elijan las partes.",
  },
];

export default function AboutPage() {
  const wa = whatsappLink(site.whatsapp, `Hola Rita, te escribo desde tu página web.`);
  return (
    <>
      <PageHero
        title={site.name}
        sub="Martillera y corredora pública en Ayacucho"
        image="/img/quinta-general-piran/quinta-01-arboleda.jpg"
        position="50% 45%"
        caption={{ label: "Quinta en General Pirán", href: "/propiedades/quinta-13-ha-frente-autovia-2-general-piran" }}
      />
      <section className="wrap page-pad split">
        <div className="split__text">
          <h2 className="h1">Quién soy</h2>
        </div>
        <div className="split__text about__copy">
          <p className="lead">
            Soy martillera y corredora pública, egresada de la Universidad FASTA. Desde Ayacucho trabajo en negocios
            inmobiliarios de la ciudad y la zona: campos, quintas, casas y lotes, con tasaciones y acompañamiento hasta la
            escritura.
          </p>
          <dl className="plainlist">
            <div>
              <dt>Matrícula</dt>
              <dd>{site.license.replace(/^Martillera y corredora pública · /, "")}</dd>
            </div>
            <div>
              <dt>Formación</dt>
              <dd>Universidad FASTA</dd>
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
            <div>
              <dt>Contacto</dt>
              <dd>
                <a href={wa} target="_blank" rel="noopener">
                  {site.phone}
                </a>
                {" · "}
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section section--surface">
        <div className="wrap svc">
          <div className="svc__head">
            <p className="eyebrow">Cómo trabajo</p>
            <h2 className="h1">Un solo interlocutor, de principio a fin</h2>
          </div>
          <ul className="svc__list">
            {WAYS.map((w) => (
              <li key={w.title} className="svc__row">
                <span className="svc__title">{w.title}</span>
                <span className="svc__text">{w.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
