"use client";

import { startTransition, useActionState } from "react";
import { saveContract } from "@/app/panel/crm-actions";
import type { ActionState } from "@/app/panel/actions";
import { ADJUST_INDEXES, type Contract } from "@/lib/types";

type Opt = { id: string; label: string };

export function ContractForm({ contract, properties, contacts }: { contract: Contract | null; properties: Opt[]; contacts: Opt[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveContract, { ok: false, message: "" });
  const c = contract;
  const err = state.errors ?? {};
  return (
    <form
      className="form-grid"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      noValidate
    >
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="form-grid form-grid--2">
        <label className="field">
          <span>Propiedad de la cartera</span>
          <select className="select" name="propertyId" defaultValue={c?.propertyId ?? ""}>
            <option value="">No está publicada</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Dirección / referencia</span>
          <input className="input" name="propertyLabel" defaultValue={c?.propertyLabel} placeholder="Ej.: Cerviño 3700, 7.º · Palermo" aria-invalid={!!err.propertyLabel} />
          {err.propertyLabel && <span className="field-error">{err.propertyLabel}</span>}
        </label>
      </div>
      <div className="form-grid form-grid--2">
        <label className="field">
          <span>Inquilino</span>
          <select className="select" name="tenantId" defaultValue={c?.tenantId ?? ""}>
            <option value="">Sin vincular</option>
            {contacts.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Propietario (locador)</span>
          <select className="select" name="ownerId" defaultValue={c?.ownerId ?? ""}>
            <option value="">Sin vincular</option>
            {contacts.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-grid form-grid--3">
        <label className="field">
          <span>Inicio</span>
          <input className="input" type="date" name="start" defaultValue={c?.start} aria-invalid={!!err.start} />
          {err.start && <span className="field-error">{err.start}</span>}
        </label>
        <label className="field">
          <span>Fin</span>
          <input className="input" type="date" name="end" defaultValue={c?.end} aria-invalid={!!err.end} />
          {err.end && <span className="field-error">{err.end}</span>}
        </label>
        <label className="field">
          <span>Día de pago</span>
          <input className="input" name="payDay" inputMode="numeric" defaultValue={c?.payDay ?? 10} />
        </label>
      </div>
      <div className="form-grid form-grid--3">
        <label className="field">
          <span>Alquiler mensual</span>
          <input className="input" name="rent" inputMode="numeric" defaultValue={c?.rent ?? ""} aria-invalid={!!err.rent} />
          {err.rent && <span className="field-error">{err.rent}</span>}
        </label>
        <label className="field">
          <span>Moneda</span>
          <select className="select" name="currency" defaultValue={c?.currency ?? "ARS"}>
            <option value="ARS">$</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <label className="field">
          <span>Depósito</span>
          <input className="input" name="deposit" inputMode="numeric" defaultValue={c?.deposit ?? ""} />
        </label>
      </div>
      <div className="form-grid form-grid--2">
        <label className="field">
          <span>Índice de actualización</span>
          <select className="select" name="adjustIndex" defaultValue={c?.adjustIndex ?? "ICL"}>
            {ADJUST_INDEXES.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Actualiza cada</span>
          <select className="select" name="adjustEveryMonths" defaultValue={String(c?.adjustEveryMonths ?? 6)}>
            <option value="0">No actualiza</option>
            {[1, 2, 3, 4, 6, 12].map((m) => (
              <option key={m} value={m}>
                {m} {m === 1 ? "mes" : "meses"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>Notas</span>
        <textarea className="textarea" name="notes" rows={3} defaultValue={c?.notes} placeholder="Garantía, administración, mantenimiento, acuerdos…" />
      </label>
      <label className="check">
        <input type="checkbox" name="active" defaultChecked={c?.active ?? true} /> Contrato vigente
      </label>
      {state.message && <p className={`notice ${state.ok ? "notice--ok" : "notice--error"}`}>{state.message}</p>}
      <button className="btn btn--s" disabled={pending}>
        {pending ? "Guardando…" : c ? "Guardar cambios" : "Crear contrato"}
      </button>
    </form>
  );
}
