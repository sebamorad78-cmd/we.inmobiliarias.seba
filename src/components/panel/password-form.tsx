"use client";

import { useActionState } from "react";
import { changeOwnPassword, type ActionState } from "@/app/panel/actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(changeOwnPassword, { ok: false, message: "" });
  const err = state.errors ?? {};
  return (
    <form action={action} className="pform">
      <fieldset className="pform__section">
        <legend>Cambiar contraseña</legend>
        <div className="form-grid" style={{ maxWidth: 420 }}>
          <label className="field"><span>Contraseña actual</span><input className="input" type="password" name="current" autoComplete="current-password" aria-invalid={!!err.current} required />{err.current && <span className="field-error">{err.current}</span>}</label>
          <label className="field"><span>Nueva contraseña</span><input className="input" type="password" name="next" autoComplete="new-password" minLength={10} aria-invalid={!!err.next} required />{err.next && <span className="field-error">{err.next}</span>}</label>
          <label className="field"><span>Repetir nueva contraseña</span><input className="input" type="password" name="confirm" autoComplete="new-password" aria-invalid={!!err.confirm} required />{err.confirm && <span className="field-error">{err.confirm}</span>}</label>
          {state.message && <p className={`notice ${state.ok ? "notice--ok" : "notice--error"}`} role="status">{state.message}</p>}
          <button className="btn" disabled={pending}>{pending ? "Guardando…" : "Actualizar contraseña"}</button>
        </div>
      </fieldset>
    </form>
  );
}
