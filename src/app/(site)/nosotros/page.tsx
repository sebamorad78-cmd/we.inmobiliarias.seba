import type { Metadata } from "next";
import { site } from "@/site.config";
import { whatsappLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "Rita Bazzigalupi",
  description: `${site.name}, martillera y corredora pública en Ayacucho. Egresada de la Universidad FASTA. Campos, quintas, casas y lotes en Ayacucho y la región.`,
  alternates: { canonical: "/nosotros" },
};

/** Forma de trabajo: hechos concretos, sin promesas que la titular no haya confirmado. */
const WAYS = [
  {
    title: "Atención personal",
    text: "Cada consulta la atiende Rita, desde el primer llamado hasta la firma de la escritura. No hay intermediarios.",
  },
  {
    title: "La zona, de primera mano",
    text: "Ayacucho y sus campos, y la región: Maipú, General Pirán, Rauch, Tandil y la costa.",
  },
  {
    title: "Tasaciones fundadas",
    text: "Recorre cada propiedad, revisa títulos y planos de mensura, y entrega un informe escrito firmado con su matrícula.",
  },
  {
    title: "Acompañamiento hasta el final",
    text: "Coordina la documentación, la reserva, el boleto y la escritura con la escribanía que elijan las partes.",
  },
];

export default function AboutPage() {
  const wa = whatsappLink(site.whatsapp, `Hola Rita, te escribo desde tu página web.`);
  return (
    <>
      <section className="wrap page-pad split">
        <div className="split__text">
          <p className="eyebrow">Quién soy</p>
          <h1 className="h1">{site.name}</h1>
          <p className="about__role">Martillera y corredora pública</p>
        </div>
        <div className="split__text about__copy">
          <p className="lead">{site.bio}</p>
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
