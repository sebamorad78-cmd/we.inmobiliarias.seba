import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/data";
import { Icon } from "@/components/icon";
import { UserForm } from "@/components/panel/user-form";

export const metadata = { title: "Usuario" };

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const { id } = await params;
  const u = id === "nuevo" ? null : await repo.getUser(id);
  if (id !== "nuevo" && !u) notFound();
  const { passwordHash, ...safe } = u ?? ({} as never);
  return (
    <div className="pmain pmain--form">
      <Link href="/panel/equipo" className="back"><Icon name="arrowLeft" size={16} /> Equipo</Link>
      <header className="pmain__head"><h1 className="h2">{u ? u.name : "Nuevo usuario"}</h1></header>
      <UserForm user={u ? { ...safe, hasPassword: Boolean(passwordHash) } : null} />
    </div>
  );
}
