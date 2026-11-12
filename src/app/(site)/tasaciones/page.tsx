import type { Metadata } from "next";
import { LeadForm } from "@/components/lead-form";
import { site } from "@/site.config";
import { VALUATION_TYPES, VALUATION_ZONES } from "@/components/home/valuation-invite";

export const metadata: Metadata = {
  title: "Tasación de propiedades",
  description: "Tasación de campos, quintas, casas y lotes en Ayacucho y la región, con informe escrito firmado por martillera y corredora pública matriculada.",
  alternates: { canonical: "/tasaciones" },
};

const STEPS = [
  { title: "Tasación", text: "Visita a la propiedad, revisión de títulos y mensura, e informe escrito con comparables de la zona y un rango de precio." },
  { title: "Preparación", text: "Fotografía profesional, video, plano y, si suma, recorrido 360°. Sugerencias concretas de arreglos menores antes de publicar." },
  { title: "Publicación", text: "Aviso en los principales portales y envío directo a compradores de nuestra base con búsqueda activa en la zona." },
  { title: "Visitas", text: "Siempre acompañadas. Después de cada una recibís la devolución del interesado por escrito." },
  { title: "Negociación", text: "Analizamos cada oferta con vos, con datos de operaciones cerradas recientes. Reserva con seña documentada." },
  { title: "Escritura", text: "Coordinamos escribanía, certificados, boleto y escritura hasta la entrega de llaves." },
];

export default async function ValuationPage({ searchParams }: { searchParams: Promise<{ tipo?: string; zona?: string }> }) {
  const sp = await searchParams;
  const preType = VALUATION_TYPES.find((t) => t === sp.tipo) ?? "Campo";
  const preZone = VALUATION_ZONES.find((z) => z === sp.zona) ?? VALUATION_ZONES[0];
  return (
    <>
      <section className="wrap page-pad split">
        <div className="split__text">
          <p className="eyebrow">Tasaciones</p>
          <h1 className="h1">Tasación de propiedades</h1>
          <p className="lead">
            {site.name} visita la propiedad y te entrega un informe escrito y firmado con el valor de mercado: campos,
            quintas, casas y lotes en Ayacucho y la región. Pedir una tasación no te obliga a vender.
          </p>
          <dl className="plainlist">
            <div><dt>Incluye</dt><dd>Comparables de la zona, rango de precio y plazo estimado de venta</dd></div>
            <div><dt>Campos</dt><dd>Aptitud del suelo, mejoras, aguadas, alambrados y accesos</dd></div>
            <div><dt>Firma</dt><dd>Martillera y corredora pública · Mat. 1468</dd></div>
          </dl>
        </div>
        <div className="panel-card">
          <h2 className="h3" style={{ marginBottom: 20 }}>Pedí tu tasación</h2>
          <LeadForm
            kind="tasacion"
            submitLabel="Solicitar tasación"
            defaultMessage=""
            extra={
              <>
                <div className="form-grid form-grid--2">
                  <label className="field">
                    <span>Tipo de propiedad</span>
                    <select className="select" name="propertyType" defaultValue={preType}>
                      {VALUATION_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span>Objetivo</span>
                    <select className="select" name="purpose" defaultValue="Vender">
                      <option>Vender</option>
                      <option>Alquilar</option>
                      <option>Solo conocer el valor</option>
                      <option>Sucesión / divorcio</option>
                    </select>
                  </label>
                </div>
                <div className="form-grid form-grid--2">
                  <label className="field">
                    <span>Dirección o ubicación</span>
                    <input className="input" name="address" autoComplete="street-address" placeholder="Calle y altura, o ruta y km" />
                  </label>
                  <label className="field">
                    <span>Zona</span>
                    <select className="select" name="neighborhood" defaultValue={preZone}>
                      {VALUATION_ZONES.map((z) => <option key={z}>{z}</option>)}
                    </select>
                  </label>
                </div>
                <div className="form-grid form-grid--2">
                  <label className="field">
                    <span>Superficie aprox.</span>
                    <input className="input" name="area" placeholder="Ej.: 45 ha o 120 m²" />
                  </label>
                  <label className="field">
                    <span>Ambientes (si es casa)</span>
                    <input className="input" name="rooms" inputMode="numeric" />
                  </label>
                </div>
              </>
            }
          />
        </div>
      </section>

      <section className="section section--surface" id="vender">
        <div className="wrap svc">
          <div className="svc__head">
            <p className="eyebrow">Vender con nosotros</p>
            <h2 className="h1">Cómo trabajamos una venta</h2>
          </div>
          <ol className="svc__list svc__list--steps">
            {STEPS.map((st, i) => (
              <li key={st.title} className="svc__row">
                <span className="svc__title">
                  <span className="svc__n num">{i + 1}.</span> {st.title}
                </span>
                <span className="svc__text">{st.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
