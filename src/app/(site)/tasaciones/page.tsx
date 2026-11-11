import type { Metadata } from "next";
import { LeadForm } from "@/components/lead-form";
import { Icon, type IconName } from "@/components/icon";
import { PROPERTY_TYPES } from "@/lib/types";
import { typeLabel } from "@/lib/labels";

export const metadata: Metadata = {
  title: "Tasación de propiedades",
  description: "Tasación profesional sin cargo en 48 h, con comparables de operaciones cerradas. Vendé tu propiedad con un plan de comercialización completo.",
  alternates: { canonical: "/tasaciones" },
};

const INCLUDES: { icon: IconName; title: string; text: string }[] = [
  { icon: "chart", title: "Valor con datos reales", text: "Comparamos con operaciones cerradas, no con precios de aviso. Te mostramos el rango y cómo se llega a él." },
  { icon: "photos", title: "Producción profesional", text: "Fotografía en alta definición, video, plano y recorrido 360° para que la propiedad destaque desde el primer día." },
  { icon: "users", title: "Compradores calificados", text: "Base propia de compradores con búsqueda activa y difusión en los principales portales del país." },
  { icon: "doc", title: "Documentación en orden", text: "Revisamos títulos, planos y deudas antes de publicar. Sin sorpresas el día de la firma." },
  { icon: "shield", title: "Visitas acompañadas", text: "Cada visita la hace un asesor. Filtramos interesados y te enviamos un reporte con la devolución." },
  { icon: "key", title: "Hasta la escritura", text: "Negociación, reserva, boleto y escritura. Coordinamos escribanía y entrega de llaves." },
];

export default function ValuationPage() {
  return (
    <>
      <section className="wrap page-pad split">
        <div className="split__text">
          <p className="eyebrow">Tasaciones</p>
          <h1 className="h1">
            Sabé cuánto vale tu propiedad hoy
          </h1>
          <p className="lead">
            Un tasador matriculado visita la propiedad y en 48 horas hábiles te entrega un informe escrito con el valor de
            mercado y una estrategia de venta. Sin cargo y sin compromiso de exclusividad.
          </p>
          <ul className="checklist">
            <li><Icon name="check" size={18} /> Informe con comparables de la zona</li>
            <li><Icon name="check" size={18} /> Rango de precio y tiempo estimado de venta</li>
            <li><Icon name="check" size={18} /> Recomendaciones para vender mejor</li>
          </ul>
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
                    <select className="select" name="propertyType" defaultValue="Departamento">
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
                <label className="field">
                  <span>Dirección</span>
                  <input className="input" name="address" autoComplete="street-address" placeholder="Calle, altura y barrio" />
                </label>
                <div className="form-grid form-grid--2">
                  <label className="field">
                    <span>Superficie aprox. (m²)</span>
                    <input className="input" name="area" inputMode="numeric" />
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
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">Vender con nosotros</p>
              <h2 className="h1">Un plan, no solo un aviso</h2>
            </div>
          </div>
          <ul className="includes">
            {INCLUDES.map((i) => (
              <li key={i.title}>
                <Icon name={i.icon} size={28} />
                <h3 className="h3">{i.title}</h3>
                <p className="muted">{i.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
