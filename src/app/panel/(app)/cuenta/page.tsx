import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/data";
import { setPanelView } from "../../actions";
import { PasswordForm } from "@/components/panel/password-form";

export const metadata = { title: "Mi cuenta" };

export default async function AccountPage() {
  const user = await requireUser();
  const simple = (await cookies()).get("rb_vista")?.value !== "completa";
  const isAdmin = user.role === "admin";
  const [properties, contacts, leads, tasks] = isAdmin
    ? await Promise.all([repo.listProperties(), repo.list("contacts"), repo.listLeads(), repo.list("tasks")])
    : [[], [], [], []];

  return (
    <div className="pmain pmain--form">
      <header className="pmain__head">
        <div>
          <h1 className="h2">Mi cuenta</h1>
          <p className="muted small">{user.email}</p>
        </div>
      </header>

      <div className="pform">
        <fieldset className="pform__section">
          <legend>Vista del panel</legend>
          <div className="pdata">
            <p className="pdata__text">
              La vista simple muestra solo lo de todos los días: consultas, agenda, propiedades y contactos. La completa
              suma negocios, alquileres, reportes y equipo. Podés cambiarla cuando quieras; no se pierde nada.
            </p>
            <form action={setPanelView} className="pview">
              <button type="submit" name="vista" value="simple" className="btn btn--ghost btn--s" aria-pressed={simple}>
                Vista simple
              </button>
              <button type="submit" name="vista" value="completa" className="btn btn--ghost btn--s" aria-pressed={!simple}>
                Todas las herramientas
              </button>
            </form>
          </div>
        </fieldset>

        {isAdmin && (
          <fieldset className="pform__section">
            <legend>Tus datos son tuyos</legend>
            <div className="pdata">
              <p className="pdata__text">
                Descargá en cualquier momento todo lo que cargaste: propiedades con sus fotos, contactos, consultas,
                agenda, negocios, alquileres e historial. Se abre en Excel o Google Sheets, una hoja por tema.
              </p>
              <ul className="pdata__list num">
                <li>{properties.length} propiedades</li>
                <li>{contacts.length} contactos</li>
                <li>{leads.length} consultas</li>
                <li>{tasks.length} eventos de agenda</li>
              </ul>
              <div className="pdata__actions">
                <a className="btn btn--clay btn--s" href="/panel/cuenta/exportar" download>
                  Descargar todo en Excel
                </a>
                <a className="link small" href="/panel/cuenta/exportar?formato=json" download>
                  Copia técnica completa (JSON)
                </a>
              </div>
            </div>
          </fieldset>
        )}
      </div>

      <PasswordForm />
    </div>
  );
}
