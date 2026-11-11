import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { repo } from "@/lib/data";
import { toPublicAgent } from "@/lib/catalog";
import { Icon } from "@/components/icon";
import { PropertyForm } from "@/components/panel/property-form";

export const metadata = { title: "Nueva propiedad" };

export default async function NewProperty() {
  const user = await requireUser();
  const [users, props] = await Promise.all([repo.listUsers(), repo.listProperties()]);
  return (
    <div className="pmain pmain--form">
      <Link href="/panel/propiedades" className="back"><Icon name="arrowLeft" size={16} /> Propiedades</Link>
      <header className="pmain__head"><h1 className="h2">Nueva propiedad</h1></header>
      <PropertyForm
        property={null}
        agents={users.filter((u) => u.active).map(toPublicAgent)}
        neighborhoods={[...new Set(props.map((p) => p.neighborhood))].sort()}
        canChooseAgent={user.role === "admin"}
      />
    </div>
  );
}
