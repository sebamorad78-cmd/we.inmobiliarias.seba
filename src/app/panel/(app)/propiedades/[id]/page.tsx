import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/data";
import { toPublicAgent } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { deleteProperty } from "../../../actions";
import { ConfirmButton } from "@/components/panel/confirm-button";
import { Icon } from "@/components/icon";
import { PropertyForm } from "@/components/panel/property-form";

export const metadata = { title: "Editar propiedad" };

export default async function EditProperty({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ creada?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const { creada } = await searchParams;
  const [p, users, props, leads] = await Promise.all([repo.getProperty(id), repo.listUsers(), repo.listProperties(), repo.listLeads()]);
  if (!p) notFound();
  const leadCount = leads.filter((l) => l.propertyId === p.id).length;
  const visible = p.status === "publicada" || p.status === "reservada";

  return (
    <div className="pmain pmain--form">
      <Link href="/panel/propiedades" className="back"><Icon name="arrowLeft" size={16} /> Propiedades</Link>
      <header className="pmain__head">
        <div>
          <p className="eyebrow eyebrow--plain">{p.code}</p>
          <h1 className="h2">{p.title}</h1>
          <p className="tiny muted">Creada el {formatDate(p.createdAt)} · {leadCount} {leadCount === 1 ? "consulta" : "consultas"}</p>
        </div>
        <div className="row">
          {visible && (
            <a href={`/propiedades/${p.slug}`} target="_blank" rel="noopener" className="btn btn--ghost btn--s"><Icon name="eye" size={16} /> Ver en el sitio</a>
          )}
          {leadCount > 0 && (
            <Link href={`/panel/consultas?propiedad=${p.id}`} className="btn btn--ghost btn--s"><Icon name="inbox" size={16} /> Consultas</Link>
          )}
        </div>
      </header>
      {creada && <p className="notice notice--ok" style={{ marginBottom: 24 }}>Propiedad creada. Podés seguir completándola.</p>}
      <PropertyForm
        property={p}
        agents={users.filter((u) => u.active).map(toPublicAgent)}
        neighborhoods={[...new Set(props.map((x) => x.neighborhood))].sort()}
        canChooseAgent={user.role === "admin"}
      />
      {user.role === "admin" && (
        <form action={deleteProperty} className="danger-zone">
          <input type="hidden" name="id" value={p.id} />
          <div>
            <p className="label">Eliminar propiedad</p>
            <p className="tiny muted">Se borra definitivamente. Si se vendió, conviene marcarla como “Vendida / Alquilada” para conservar el historial.</p>
          </div>
          <ConfirmButton message={`¿Eliminar definitivamente ${p.code}? Esta acción no se puede deshacer.`}>
            <Icon name="trash" size={16} /> Eliminar
          </ConfirmButton>
        </form>
      )}
    </div>
  );
}
