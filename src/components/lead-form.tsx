"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { submitLead, type FormState } from "@/app/actions/leads";
import type { LeadKind } from "@/lib/types";
import { Icon } from "./icon";

const initial: FormState = { ok: false, message: "" };

export function LeadForm({
  kind,
  propertyId,
  defaultMessage = "",
  submitLabel = "Enviar consulta",
  showMessage = true,
  extra,
  dark = false,
}: {
  kind: LeadKind;
  propertyId?: string;
  defaultMessage?: string;
  submitLabel?: string;
  showMessage?: boolean;
  extra?: ReactNode;
  dark?: boolean;
}) {
  const [state, action, pending] = useActionState(submitLead, initial);
  const [startedAt, setStartedAt] = useState(0);
  const [source, setSource] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStartedAt(Date.now());
    setSource(window.location.href);
  }, []);

  useEffect(() => {
    if (state.message) statusRef.current?.focus();
  }, [state]);

  if (state.ok) {
    return (
      <div className="lead-done" ref={statusRef} tabIndex={-1} role="status">
        <span className="lead-done__icon">
          <Icon name="check" size={22} />
        </span>
        <p className="h3">Mensaje recibido</p>
        <p className="muted">{state.message}</p>
      </div>
    );
  }

  const err = state.errors ?? {};

  return (
    <form
      action={action}
      onSubmit={(e) => {
        // Envío manual: evita que React vacíe el formulario si vuelve con errores.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className={`form-grid lead-form ${dark ? "lead-form--dark" : ""}`}
      noValidate
    >
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="_t" value={startedAt} />
      <input type="hidden" name="source" value={source} />
      {propertyId && <input type="hidden" name="propertyId" value={propertyId} />}
      <div className="hp" aria-hidden="true">
        <label>
          No completar
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="field">
        <span>Nombre y apellido</span>
        <input className="input" name="name" autoComplete="name" required aria-invalid={!!err.name} />
        {err.name && <span className="field-error">{err.name}</span>}
      </label>

      <div className="form-grid form-grid--2">
        <label className="field">
          <span>Teléfono</span>
          <input className="input" name="phone" type="tel" inputMode="tel" autoComplete="tel" aria-invalid={!!err.phone} />
          {err.phone && <span className="field-error">{err.phone}</span>}
        </label>
        <label className="field">
          <span>Email</span>
          <input className="input" name="email" type="email" autoComplete="email" aria-invalid={!!err.email} />
          {err.email && <span className="field-error">{err.email}</span>}
        </label>
      </div>

      {extra}

      {showMessage && (
        <label className="field">
          <span>Mensaje</span>
          <textarea className="textarea" name="message" defaultValue={defaultMessage} rows={4} />
        </label>
      )}

      <div ref={statusRef} tabIndex={-1} aria-live="polite">
        {state.message && !state.ok && <p className="notice notice--error">{state.message}</p>}
      </div>

      <button type="submit" className="btn btn--block" disabled={pending}>
        {pending ? "Enviando…" : submitLabel}
        {!pending && <Icon name="arrowRight" size={18} />}
      </button>
      <p className="tiny muted">
        Usamos tus datos solo para responder esta consulta. No los compartimos con terceros.
      </p>
    </form>
  );
}
