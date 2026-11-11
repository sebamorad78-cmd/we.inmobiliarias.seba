import type { Metadata } from "next";
import { LeadForm } from "@/components/lead-form";
import { PROPERTY_TYPES } from "@/lib/types";
import { typeLabel } from "@/lib/labels";

export const metadata: Metadata = {
  title: "Tasación de propiedades",
  description: "Tasación profesional sin cargo en 48 h, con comparables de operaciones cerradas. Vendé tu propiedad con un plan de comercialización completo.",
  alternates: { canonical: "/tasaciones" },
};

const STEPS = [
  { title: "Tasación", text: "Visitamos la propiedad, revisamos la documentación y entregamos un informe escrito con comparables y un rango de precio." },
  { title: "Preparación", text: "Fotografía profesional, video, plano y, si suma, recorrido 360°. Sugerencias concretas de arreglos menores antes de publicar." },
  { title: "Publicación", text: "Aviso en los principales portales y envío directo a compradores de nuestra base con búsqueda activa en la zona." },
  { title: "Visitas", text: "Las hace siempre un asesor. Después de cada una recibís la devolución del interesado por escrito." },
  { title: "Negociación", text: "Analizamos cada oferta con vos, con datos de operaciones cerradas recientes. Reserva con seña documentada." },
  { title: "Escritura", text: "Coordinamos escribanía, certificados, boleto y escritura hasta la entrega de llaves." },
];

const TYPE_FROM_QUERY: Record<string, string> = { departamento: "Departamento", casa: "Casa", ph: "PH", oficina: "Oficina" };

export default async function ValuationPage({ searchParams }: { searchParams: Promise<{ tipo?: string; m2?: string; barrio?: string }> }) {
  const sp = await searchParams;
  const preType = (sp.tipo && TYPE_FROM_QUERY[sp.tipo]) || "Departamento";
  const preArea = sp.m2 && /^\d{1,5}$/.test(sp.m2) ? sp.m2 : "";
  const preHood = sp.barrio?.slice(0, 60) ?? "";
  return (
    <>
      <section className="wrap page-pad split">
        <div className="split__text">
          <p className="eyebrow">Tasaciones</p>
          <h1 className="h1">Tasación de propiedades</h1>
          <p className="lead">
            Un corredor matriculado visita la propiedad y en 48 horas hábiles te entrega un informe escrito con el valor
            de mercado. La tasación no tiene costo y no te obliga a vender con nosotros.
          </p>
          <dl className="plainlist">
            <div><dt>Incluye</dt><dd>Comparables de la zona, rango de precio y plazo estimado de venta</dd></div>
            <div><dt>Plazo</dt><dd>48 horas hábiles desde la visita</dd></div>
            <div><dt>Costo</dt><dd>Sin cargo</dd></div>
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
                      {PROPERTY_TYPES.map((t) => <option key={t}>{typeLabel[t]}</option>)}
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
                    <span>Dirección</span>
                    <input className="input" name="address" autoComplete="street-address" placeholder="Calle y altura" />
                  </label>
                  <label className="field">
                    <span>Barrio</span>
                    <input className="input" name="neighborhood" defaultValue={preHood} />
                  </label>
                </div>
                <div className="form-grid form-grid--2">
                  <label className="field">
                    <span>Superficie aprox. (m²)</span>
                    <input className="input" name="area" inputMode="numeric" defaultValue={preArea} />
                  </label>
                  <label className="field">
                    <span>Ambientes</span>
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
