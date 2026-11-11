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
              Propiedades elegidas una por una, y gente que sabe venderlas.
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
                <li><Link href="/tasaciones#vender">Vender con nosotros</Link></li>
                <li><Link href="/contacto?motivo=administracion">Administración de alquileres</Link></li>
                <li><Link href="/nosotros">Equipo</Link></li>
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
              <p className="footer__hours">{site.hours}</p>
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
        <p className="footer__mark" aria-hidden="true">{site.name}</p>
        <div className="footer__legal">
          <p>
            © {year} {site.legalName}. {site.license}.
          </p>
          <p>
            Las medidas, superficies y valores publicados son aproximados y no constituyen oferta. Sujetos a verificación y
            a variaciones sin previo aviso.
          </p>
          <p>
            <Link href="/panel">Acceso equipo</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
