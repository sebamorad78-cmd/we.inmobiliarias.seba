import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/data";
import { logout } from "../actions";
import { Icon } from "@/components/icon";
import { Logo } from "@/components/site-header";
import { PanelNav } from "@/components/panel/panel-nav";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const leads = await repo.listLeads();
  const newLeads = leads.filter((l) => l.status === "nuevo" && (user.role === "admin" || !l.assignedTo || l.assignedTo === user.id)).length;

  return (
    <div className="panel">
      <aside className="panel__side">
        <Link href="/panel" className="panel__logo"><Logo light /></Link>
        <PanelNav isAdmin={user.role === "admin"} newLeads={newLeads} />
        <div className="panel__me">
          <span className="avatar">{user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
          <div style={{ minWidth: 0 }}>
            <p className="panel__me-name">{user.name}</p>
            <p className="tiny">{user.role === "admin" ? "Administrador" : "Agente"}</p>
          </div>
          <form action={logout}>
            <button className="panel__logout" aria-label="Cerrar sesión" title="Cerrar sesión"><Icon name="logout" size={18} /></button>
          </form>
        </div>
      </aside>
      <div className="panel__main">{children}</div>
    </div>
  );
}
