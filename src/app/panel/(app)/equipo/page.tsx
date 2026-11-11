import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/data";
import { Icon } from "@/components/icon";

export const metadata = { title: "Equipo" };

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ creado?: string }> }) {
  await requireUser("admin");
  const { creado } = await searchParams;
  const [users, props] = await Promise.all([repo.listUsers(), repo.listProperties()]);
  return (
    <div className="pmain">
      <header className="pmain__head">
        <div><h1 className="h2">Equipo</h1><p className="muted small">Usuarios con acceso al panel y asesores visibles en el sitio.</p></div>
        <Link href="/panel/equipo/nuevo" className="btn"><Icon name="plus" size={18} /> Nuevo usuario</Link>
      </header>
      {creado && <p className="notice notice--ok" style={{ marginBottom: 20 }}>Usuario creado. Compartile su email y contraseña inicial por un canal seguro.</p>}
      <div className="ptable-wrap">
        <table className="ptable">
          <thead><tr><th>Nombre</th><th>Rol</th><th>Propiedades</th><th>Acceso</th><th>En el sitio</th><th /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><Link href={`/panel/equipo/${u.id}`} className="ptable__lead"><strong>{u.name}</strong><span className="tiny muted">{u.email}</span></Link></td>
                <td className="small">{u.role === "admin" ? "Administrador" : "Agente"}</td>
                <td className="num small">{props.filter((p) => p.agentId === u.id).length}</td>
                <td className="small">{!u.active ? <span className="status status--descartado">Inactivo</span> : u.passwordHash ? <span className="status status--cerrado">Activo</span> : <span className="status status--nuevo">Sin contraseña</span>}</td>
                <td className="small">{u.public ? "Visible" : "Oculto"}</td>
                <td className="ptable__actions"><Link href={`/panel/equipo/${u.id}`} className="icon-btn" aria-label={`Editar ${u.name}`}><Icon name="edit" size={16} /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
