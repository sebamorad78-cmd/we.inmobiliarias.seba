import { requireUser } from "@/lib/auth";
import { canSee, stageProbability } from "@/lib/crm";
import { repo } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { Icon } from "@/components/icon";
import { DealBoard, type BoardDeal } from "@/components/panel/deal-board";
import { DealButton } from "@/components/panel/shell/dialogs";

export const metadata = { title: "Oportunidades" };

export default async function Deals() {
  const user = await requireUser();
  const [deals, contacts, properties, users] = await Promise.all([repo.list("deals"), repo.list("contacts"), repo.listProperties(), repo.listUsers()]);
  const cById = new Map(contacts.map((c) => [c.id, c]));
  const pById = new Map(properties.map((p) => [p.id, p]));
  const uById = new Map(users.map((u) => [u.id, u]));
  const now = Date.now();

  const visible = deals.filter((d) => canSee(user, d.assignedTo)).filter((d) => {
    // Cerradas y perdidas: solo las de los últimos 60 días, para que el tablero no se llene.
    if (d.stage === "cerrada" || d.stage === "perdida") return now - new Date(d.updatedAt).getTime() < 60 * 86400000;
    return true;
  });

  const board: BoardDeal[] = visible
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((d) => {
      const c = d.contactId ? cById.get(d.contactId) : null;
      const p = d.propertyId ? pById.get(d.propertyId) : null;
      return {
        id: d.id,
        title: d.title,
        stage: d.stage,
        contact: c?.name ?? "",
        contactHref: c ? `/panel/contactos/${c.id}` : null,
        property: p?.code ?? "",
        value: d.value,
        currency: d.currency,
        fee: d.value ? (d.value * d.commissionPct) / 100 : null,
        daysInStage: Math.floor((now - new Date(d.updatedAt).getTime()) / 86400000),
        owner: d.assignedTo ? uById.get(d.assignedTo)?.name.split(" ")[0] ?? "" : "",
        prefill: {
          id: d.id,
          title: d.title,
          contactId: d.contactId,
          propertyId: d.propertyId,
          stage: d.stage,
          operation: d.operation,
          value: d.value,
          currency: d.currency,
          commissionPct: d.commissionPct,
          assignedTo: d.assignedTo,
          expectedClose: d.expectedClose,
          lostReason: d.lostReason,
        },
      };
    });

  const open = visible.filter((d) => d.stage !== "cerrada" && d.stage !== "perdida");
  const feeUsd = (ds: typeof deals) => ds.filter((d) => d.currency === "USD").reduce((s, d) => s + ((d.value ?? 0) * d.commissionPct) / 100, 0);
  const weighted = open.filter((d) => d.currency === "USD").reduce((s, d) => s + (((d.value ?? 0) * d.commissionPct) / 100) * stageProbability[d.stage], 0);
  const won = visible.filter((d) => d.stage === "cerrada");
  const lost = visible.filter((d) => d.stage === "perdida");
  const winRate = won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : null;

  return (
    <div className="pmain pmain--wide">
      <header className="pmain__head">
        <div>
          <p className="eyebrow">Negocios</p>
          <h1 className="h2">Oportunidades</h1>
          <p className="muted small">Arrastrá cada negocio a su etapa. Clic para editar valor, honorarios o fecha estimada.</p>
        </div>
        <DealButton>
          <Icon name="plus" size={16} /> Nueva oportunidad
        </DealButton>
      </header>

      <div className="pkpis">
        <div className="pkpi">
          <span className="pkpi__v num">{open.length}</span>
          <span className="pkpi__l">En curso</span>
        </div>
        <div className="pkpi">
          <span className="pkpi__v num">{formatMoney(Math.round(feeUsd(open)), "USD")}</span>
          <span className="pkpi__l">Honorarios en juego</span>
        </div>
        <div className="pkpi">
          <span className="pkpi__v num">{formatMoney(Math.round(weighted), "USD")}</span>
          <span className="pkpi__l">Ponderado por probabilidad</span>
        </div>
        <div className="pkpi">
          <span className="pkpi__v num">{winRate == null ? "—" : `${winRate}%`}</span>
          <span className="pkpi__l">Tasa de cierre (60 días)</span>
        </div>
      </div>

      <DealBoard deals={board} />
    </div>
  );
}
