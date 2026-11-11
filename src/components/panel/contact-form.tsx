"use client";

import { startTransition, useActionState, useState } from "react";
import { saveContact } from "@/app/panel/crm-actions";
import type { ActionState } from "@/app/panel/actions";
import { contactKindLabel } from "@/lib/crm";
import { typeLabel } from "@/lib/labels";
import { CONTACT_KINDS, CONTACT_SOURCES, PROPERTY_TYPES, type Contact } from "@/lib/types";

export function ContactForm({ contact, users, zones, canAssign }: { contact: Contact | null; users: { id: string; name: string }[]; zones: string[]; canAssign: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveContact, { ok: false, message: "" });
  const [hasSearch, setHasSearch] = useState(!!contact?.search);
  const c = contact;
  const s = c?.search;
  const err = state.errors ?? {};

  return (
    <form
      className="form-grid cform"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      noValidate
    >
      {c && <input type="hidden" name="id" value={c.id} />}
      <label className="field">
        <span>Nombre y apellido</span>
        <input className="input" name="name" defaultValue={c?.name} aria-invalid={!!err.name} required />
        {err.name && <span className="field-error">{err.name}</span>}
      </label>
      <div className="form-grid form-grid--2">
        <label className="field">
          <span>Teléfono</span>
          <input className="input" name="phone" type="tel" defaultValue={c?.phone} aria-invalid={!!err.phone} />
          {err.phone && <span className="field-error">{err.phone}</span>}
        </label>
        <label className="field">
          <span>Email</span>
          <input className="input" name="email" type="email" defaultValue={c?.email} aria-invalid={!!err.email} />
          {err.email && <span className="field-error">{err.email}</span>}
        </label>
      </div>
      <fieldset className="fgroup">
        <legend>Tipo</legend>
        <div className="checks">
          {CONTACT_KINDS.map((k) => (
            <label key={k} className="check">
              <input type="checkbox" name="kinds" value={k} defaultChecked={c ? c.kinds.includes(k) : k === "comprador"} /> {contactKindLabel[k]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="form-grid form-grid--2">
        <label className="field">
          <span>Cómo llegó</span>
          <select className="select" name="source" defaultValue={c?.source ?? "WhatsApp"}>
            {CONTACT_SOURCES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Asesor</span>
          <select className="select" name="assignedTo" defaultValue={c?.assignedTo ?? ""} disabled={!canAssign}>
            <option value="">{canAssign ? "Sin asignar" : "Yo"}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>Notas</span>
        <textarea className="textarea" name="notes" rows={3} defaultValue={c?.notes} placeholder="Datos útiles: con quién decide, horarios, forma de pago…" />
      </label>

      <label className="check">
        <input type="checkbox" name="hasSearch" checked={hasSearch} onChange={(e) => setHasSearch(e.target.checked)} /> Tiene una búsqueda activa
      </label>
      {hasSearch && (
        <div className="cform__search form-grid">
          <div className="form-grid form-grid--3">
            <label className="field">
              <span>Busca</span>
              <select className="select" name="searchOperation" defaultValue={s?.operation ?? "venta"}>
                <option value="venta">Comprar</option>
                <option value="alquiler">Alquilar</option>
                <option value="temporario">Temporario</option>
              </select>
            </label>
            <label className="field">
              <span>Hasta</span>
              <input className="input" name="searchMaxPrice" inputMode="numeric" defaultValue={s?.maxPrice ?? ""} placeholder="Sin tope" />
            </label>
            <label className="field">
              <span>Moneda</span>
              <select className="select" name="searchCurrency" defaultValue={s?.currency ?? "USD"}>
                <option value="USD">USD</option>
                <option value="ARS">$</option>
              </select>
            </label>
          </div>
          <fieldset className="fgroup">
            <legend>Tipos</legend>
            <div className="checks">
              {PROPERTY_TYPES.map((t) => (
                <label key={t} className="check">
                  <input type="checkbox" name="searchTypes" value={t} defaultChecked={s?.types.includes(t)} /> {typeLabel[t]}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="form-grid form-grid--2">
            <label className="field">
              <span>Zonas (separadas por coma)</span>
              <input className="input" name="searchZones" list="cf-zones" defaultValue={s?.zones.join(", ")} placeholder="Palermo, Belgrano" />
              <datalist id="cf-zones">
                {zones.map((z) => (
                  <option key={z} value={z} />
                ))}
              </datalist>
            </label>
            <label className="field">
              <span>Ambientes mínimos</span>
              <input className="input" name="searchMinRooms" inputMode="numeric" defaultValue={s?.minRooms ?? ""} />
            </label>
          </div>
          <label className="field">
            <span>Detalle de lo que busca</span>
            <input className="input" name="searchNotes" defaultValue={s?.notes} placeholder="Ej.: con cochera, cerca de colegios, apto crédito" />
          </label>
        </div>
      )}

      {state.message && <p className={`notice ${state.ok ? "notice--ok" : "notice--error"}`}>{state.message}</p>}
      <button className="btn btn--s" disabled={pending}>
        {pending ? "Guardando…" : c ? "Guardar cambios" : "Crear contacto"}
      </button>
    </form>
  );
}
