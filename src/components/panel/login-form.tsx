"use client";

import { startTransition, useActionState } from "react";
import { login, type ActionState } from "@/app/panel/actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(login, { ok: false, message: "" });
  return (
    <form
      action={action}
      className="form-grid"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="field">
        <span>Email</span>
        <input className="input" type="email" name="email" autoComplete="username" required autoFocus />
      </label>
      <label className="field">
        <span>Contraseña</span>
        <input className="input" type="password" name="password" autoComplete="current-password" required />
      </label>
      {state.message && <p className="notice notice--error" role="alert">{state.message}</p>}
      <button className="btn btn--block" disabled={pending}>{pending ? "Ingresando…" : "Ingresar"}</button>
    </form>
  );
}
