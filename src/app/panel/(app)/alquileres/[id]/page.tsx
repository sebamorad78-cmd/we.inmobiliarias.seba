import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { contractAlerts, fmtAr } from "@/lib/crm";
import { repo } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { deleteContract } from "../../../crm-actions";
import { ConfirmButton } from "@/components/panel/confirm-button";
import { ContractForm } from "@/components/panel/contract-form";
import { TaskButton } from "@/components/panel/shell/dialogs";
import { Icon } from "@/components/icon";

export const metadata = { title: "Contrato" };

export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [contracts, properties, contacts] = await Promise.all([repo.list("contracts"), repo.listProperties(), repo.list("contacts")]);
  const c = id === "nuevo" ? null : contracts.find((x) => x.id === id);
  if (id !== "nuevo" && !c) notFound();

  const props = properties.map((p) => ({ id: p.id, label: `${p.code} · ${p.title}` }));
  const people = [...contacts].sort((a, b) => a.name.localeCompare(b.name, "es")).map((x) => ({ id: x.id, label: x.name }));
  const a = c ? contractAlerts(c) : null;
  const d = (day: string) => fmtAr(day + "T15:00:00Z", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="pmain pmain--form">
      <Link href="/panel/alquileres" className="back">
        <Icon name="arrowLeft" size={16} /> Alquileres
      </Link>
      <header className="pmain__head">
        <div>
          <p className="eyebrow">Contrato de alquiler</p>
          <h1 className="h2">{c ? c.propertyLabel : "Nuevo contrato"}</h1>
        </div>
        {c && a?.adjustment && (
          <TaskButton
            className="btn btn--ghost btn--s"
            prefill={{
              type: "llamado",
              title: `Avisar actualización ${c.adjustIndex} · ${c.propertyLabel}`,
              day: a.adjustment,
              time: "10:00",
              contactId: c.tenantId,
            }}
          >
            <Icon name="bell" size={16} /> Agendar aviso de actualización
          </TaskButton>
        )}
      </header>

      {c && a && (
        <dl className="cstats">
          <div>
            <dt>Alquiler actual</dt>
            <dd className="num">{formatMoney(c.rent, c.currency)}</dd>
          </div>
          <div>
            <dt>Próxima actualización</dt>
            <dd>{a.adjustment ? `${d(a.adjustment)} (${a.toAdjustment} d)` : "No corresponde"}</dd>
          </div>
          <div>
            <dt>Vencimiento</dt>
            <dd className={a.toEnd <= 90 ? "is-late" : ""}>{a.expired ? "Vencido" : `${d(c.end)} (${a.toEnd} d)`}</dd>
          </div>
        </dl>
      )}

      <section className="pcard2">
        <ContractForm contract={c ?? null} properties={props} contacts={people} />
      </section>

      {c && user.role === "admin" && (
        <form action={deleteContract} className="danger-zone">
          <input type="hidden" name="id" value={c.id} />
          <div>
            <p className="label">Eliminar contrato</p>
            <p className="tiny muted">Si terminó, conviene desmarcar “vigente” para conservar el historial.</p>
          </div>
          <ConfirmButton message="¿Eliminar este contrato?">
            <Icon name="trash" size={16} /> Eliminar
          </ConfirmButton>
        </form>
      )}
    </div>
  );
}
