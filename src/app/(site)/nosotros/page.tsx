import type { Metadata } from "next";
import { site } from "@/site.config";
import { getPublicTeam } from "@/lib/catalog";
import { whatsappLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "Nosotros",
  description: `Equipo de ${site.name}: corredores matriculados y asesores por zona.`,
  alternates: { canonical: "/nosotros" },
};

export const dynamic = "force-dynamic";

const prettyPhone = (digits: string) => {
  const d = digits.replace(/\D/g, "");
  const m = d.match(/^549?(11)(\d{4})(\d{4})$/);
  return m ? `+54 9 ${m[1]} ${m[2]}-${m[3]}` : `+${d}`;
};

export default async function AboutPage() {
  const team = await getPublicTeam();
  return (
    <>
      <section className="wrap page-pad split">
        <div className="split__text">
          <p className="eyebrow">Nosotros</p>
          <h1 className="h1">{site.legalName}</h1>
        </div>
        <div className="split__text about__copy">
          <p className="lead">{site.bio}</p>
          <dl className="plainlist">
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
              <dt>Matrícula</dt>
              <dd>{site.license}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section section--surface">
        <div className="wrap svc">
          <div className="svc__head">
            <p className="eyebrow">Equipo</p>
            <h2 className="h1">Asesores</h2>
          </div>
          <ul className="directory">
            {team.map((a) => (
              <li key={a.id} className="directory__row">
                <div>
                  <h3 className="directory__name">{a.name}</h3>
                  <p className="directory__role">{a.title}</p>
                </div>
                <p className="directory__bio">{a.bio}</p>
                <div className="directory__contact">
                  {a.license && <span>Mat. {a.license}</span>}
                  {a.phone && (
                    <a href={whatsappLink(a.phone, `Hola ${a.name.split(" ")[0]}, te escribo desde la web de ${site.name}.`)} target="_blank" rel="noopener">
                      {prettyPhone(a.phone)}
                    </a>
                  )}
                  <a href={`mailto:${a.email}`}>{a.email}</a>
                </div>
              </li>
            ))}
          </ul>
          <p className="directory__jobs">
            Búsquedas laborales: <a href={`mailto:${site.email}?subject=CV`}>{site.email}</a>
          </p>
        </div>
      </section>
    </>
  );
}
