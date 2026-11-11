"use client";

import { startTransition, useActionState } from "react";
import { updateLead, type ActionState } from "@/app/panel/actions";
import { leadStatusLabel } from "@/lib/labels";
import { LEAD_STATUSES, type Lead } from "@/lib/types";

export function LeadEditor({ lead, users }: { lead: Lead; users: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateLead, { ok: false, message: "" });
  return (
    <form
      className="form-grid"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="id" value={lead.id} />
      <label className="field">
        <span>Estado</span>
        <select className="select" name="status" defaultValue={lead.status}>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{leadStatusLabel[s]}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Asignada a</span>
        <select className="select" name="assignedTo" defaultValue={lead.assignedTo ?? ""}>
          <option value="">Sin asignar</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Notas internas</span>
        <textarea className="textarea" name="notes" rows={5} defaultValue={lead.notes} placeholder="Ej.: Llamé el martes, prefiere visitar el sábado." />
      </label>
      {state.message && <p className={`notice ${state.ok ? "notice--ok" : "notice--error"}`} role="status">{state.message}</p>}
      <button className="btn" disabled={pending}>{pending ? "Guardando…" : "Guardar"}</button>
    </form>
  );
}
