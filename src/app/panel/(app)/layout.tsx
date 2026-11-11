import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { canSee, contractAlerts, fmtAr, isOverdue } from "@/lib/crm";
import { repo } from "@/lib/data";
import { logout } from "../actions";
import { Icon } from "@/components/icon";
import { Logo } from "@/components/site-header";
import { PanelNav } from "@/components/panel/panel-nav";
import { MobileTabs } from "@/components/panel/mobile-tabs";
import { PanelDialogs } from "@/components/panel/shell/dialogs";
import { Topbar, type SearchItem } from "@/components/panel/shell/topbar";

export const dynamic = "force-dynamic";

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [leads, contacts, properties, users, tasks, contracts] = await Promise.all([
    repo.listLeads(),
    repo.list("contacts"),
    repo.listProperties(),
    repo.listUsers(),
    repo.list("tasks"),
    repo.list("contracts"),
  ]);
  const myContacts = contacts.filter((c) => canSee(user, c.assignedTo)).sort((a, b) => a.name.localeCompare(b.name, "es"));
  const newLeads = leads.filter((l) => l.status === "nuevo" && canSee(user, l.assignedTo)).length;
  const overdue = tasks.filter((t) => canSee(user, t.assignedTo) && isOverdue(t)).length;
  const alerts = contracts.filter((c) => {
    const a = contractAlerts(c);
    return a.endingSoon || a.expired || a.adjustSoon;
  }).length;

  const index: SearchItem[] = [
    ...myContacts.map((c) => ({
      kind: "contacto" as const,
      label: c.name,
      hint: [c.phone, c.email].filter(Boolean).join(" · "),
      href: `/panel/contactos/${c.id}`,
      terms: norm(`${c.name} ${c.phone} ${c.phone.replace(/\D/g, "")} ${c.email}`),
    })),
    ...properties.map((p) => ({
      kind: "propiedad" as const,
      label: `${p.code} · ${p.title}`,
      hint: p.neighborhood,
      href: `/panel/propiedades/${p.id}`,
      terms: norm(`${p.code} ${p.title} ${p.neighborhood} ${p.address}`),
    })),
    ...leads
      .filter((l) => canSee(user, l.assignedTo))
      .slice(0, 200)
      .map((l) => ({
        kind: "consulta" as const,
        label: l.name,
        hint: fmtAr(l.createdAt, { day: "numeric", month: "short" }),
        href: `/panel/consultas/${l.id}`,
        terms: norm(`${l.name} ${l.phone} ${l.email}`),
      })),
  ];

  const today = fmtAr(new Date().toISOString(), { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="panel">
      <aside className="panel__side">
        <Link href="/panel" className="panel__logo">
          <Logo light />
        </Link>
        <PanelNav isAdmin={user.role === "admin"} newLeads={newLeads} overdue={overdue} alerts={alerts} />
        <div className="panel__me">
          <div style={{ minWidth: 0 }}>
            <p className="panel__me-name">{user.name}</p>
            <p className="tiny">{user.role === "admin" ? "Administrador" : "Asesor"}</p>
          </div>
          <form action={logout}>
            <button className="panel__logout" aria-label="Cerrar sesión" title="Cerrar sesión">
              <Icon name="logout" size={18} />
            </button>
          </form>
        </div>
      </aside>
      <div className="panel__main">
        <Topbar index={index} today={today.charAt(0).toUpperCase() + today.slice(1)} />
        {children}
      </div>
      <MobileTabs newLeads={newLeads} overdue={overdue} isAdmin={user.role === "admin"} />
      <PanelDialogs
        me={user.id}
        contacts={myContacts.map((c) => ({ id: c.id, label: c.name, hint: c.phone }))}
        properties={properties
          .filter((p) => p.status !== "vendida")
          .map((p) => ({ id: p.id, label: `${p.code} · ${p.title}`, hint: p.neighborhood }))}
        users={users.filter((u) => u.active).map((u) => ({ id: u.id, label: u.name }))}
      />
    </div>
  );
}
