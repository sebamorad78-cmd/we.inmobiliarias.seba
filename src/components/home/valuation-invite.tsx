import { Img as Image } from "@/components/img";
import { site } from "@/site.config";

/** Tipos y zonas de trabajo: se usan aquí y en la página de tasaciones. */
export const VALUATION_TYPES = ["Campo", "Quinta", "Casa", "Lote", "Departamento", "Local comercial"] as const;
export const VALUATION_ZONES = [
  "Ayacucho (ciudad)",
  "Ayacucho (zona rural)",
  "Solanet",
  "Udaquiola",
  "Langueyú",
  "Rauch",
  "Tandil",
  "Maipú",
  "General Pirán / Mar Chiquita",
  "Otra zona",
] as const;

/**
 * Invitación a tasar: sin calculadoras ni números automáticos.
 * El valor lo define la martillera en la visita; acá solo se inicia el pedido.
 */
export function ValuationInvite({ image }: { image: string }) {
  return (
    <section className="tasa" aria-labelledby="tasa-title">
      <div className="tasa__media">
        <Image src={image} alt="" fill sizes="(max-width: 1000px) 100vw, 45vw" quality={80} />
      </div>

      <div className="tasa__body">
        <p className="eyebrow">Tasaciones</p>
        <h2 id="tasa-title" className="h1 tasa__title">
          ¿Cuánto vale hoy tu campo, tu quinta o tu casa?
        </h2>
        <p className="tasa__lead">
          Rita recorre la propiedad, revisa títulos y planos de mensura, y te entrega un informe escrito y firmado con
          el valor de mercado y los fundamentos de cada número.
        </p>

        <ul className="tasa__facts">
          <li>
            <strong>Campos y quintas</strong>
            <span>Aptitud del suelo, mejoras, aguadas, alambrados y accesos.</span>
          </li>
          <li>
            <strong>Casas y lotes</strong>
            <span>Ubicación, estado, superficie y documentación.</span>
          </li>
          <li>
            <strong>Informe firmado</strong>
            <span>{site.license.split("·")[0].trim()} · Mat. 1468.</span>
          </li>
        </ul>

        <form className="tasa__form" action="/tasaciones" method="get">
          <label className="field">
            <span>Qué querés tasar</span>
            <select className="select" name="tipo" defaultValue="Campo">
              {VALUATION_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Dónde está</span>
            <select className="select" name="zona" defaultValue={VALUATION_ZONES[0]}>
              {VALUATION_ZONES.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn btn--clay tasa__submit">
            Coordinar la visita
          </button>
        </form>
      </div>
    </section>
  );
}
