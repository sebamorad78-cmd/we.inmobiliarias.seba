import Link from "next/link";
import { site } from "@/site.config";
import { Icon } from "./icon";
import { Logo } from "./site-header";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__top">
          <div className="footer__brand">
            <Logo light />
            <p className="footer__claim">
              Venta, alquiler y tasación de campos, quintas, casas y lotes en Ayacucho y la región.
            </p>
          </div>
          <div className="footer__cols">
            <div>
              <h2 className="footer__h">Propiedades</h2>
              <ul>
                <li><Link href="/propiedades?operacion=venta">En venta</Link></li>
                <li><Link href="/propiedades?operacion=alquiler">En alquiler</Link></li>
                <li><Link href="/propiedades?operacion=temporario">Temporarios</Link></li>
                <li><Link href="/propiedades?operacion=venta&tipo=casa">Casas</Link></li>
                <li><Link href="/propiedades?operacion=venta&tipo=departamento">Departamentos</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="footer__h">Servicios</h2>
              <ul>
                <li><Link href="/tasaciones">Tasar mi propiedad</Link></li>
                <li><Link href="/tasaciones#vender">Vender una propiedad</Link></li>
                <li><Link href="/contacto?motivo=administracion">Administración de alquileres</Link></li>
                <li><Link href="/nosotros">Sobre Rita</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="footer__h">Oficina</h2>
              <address className="footer__address">
                {site.address.street}
                <br />
                {site.address.city}, {site.address.region}
                <br />
                <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`}>{site.phone}</a>
                <br />
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </address>
              {site.hours && <p className="footer__hours">{site.hours}</p>}
              <div className="footer__social">
                {site.social.instagram && (
                  <a href={site.social.instagram} target="_blank" rel="noopener" aria-label="Instagram">
                    <Icon name="instagram" />
                  </a>
                )}
                {site.social.linkedin && (
                  <a href={site.social.linkedin} target="_blank" rel="noopener" aria-label="LinkedIn">
                    <Icon name="linkedin" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="footer__legal">
          <p>
            © {year} {site.legalName.replace(/\.$/, "")}. {site.license}.
          </p>
          <p>
            Las medidas, superficies y valores publicados son aproximados y no constituyen oferta. Sujetos a verificación y
            a variaciones sin previo aviso.
          </p>
          <p>Sitio de demostración: algunas propiedades y valores son ejemplos.</p>
          <p>
            <Link href="/panel">Acceso equipo</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
