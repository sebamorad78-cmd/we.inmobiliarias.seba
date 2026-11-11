"use client";

import { startTransition, useActionState } from "react";
import { saveUser, type ActionState } from "@/app/panel/actions";
import type { TeamUser } from "@/lib/types";

type SafeUser = Omit<TeamUser, "passwordHash"> & { hasPassword: boolean };

export function UserForm({ user }: { user: SafeUser | null }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveUser, { ok: false, message: "" });
  const err = state.errors ?? {};
  const u = user;
  return (
    <form
      className="pform"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      noValidate
    >
      {u && <input type="hidden" name="id" value={u.id} />}
      {state.message && <p className={`notice ${state.ok ? "notice--ok" : "notice--error"}`} role="status">{state.message}</p>}
      <fieldset className="pform__section">
        <legend>Datos</legend>
        <div className="form-grid">
          <div className="form-grid form-grid--2">
            <label className="field"><span>Nombre y apellido</span><input className="input" name="name" defaultValue={u?.name} aria-invalid={!!err.name} required />{err.name && <span className="field-error">{err.name}</span>}</label>
            <label className="field"><span>Email</span><input className="input" type="email" name="email" defaultValue={u?.email} aria-invalid={!!err.email} required />{err.email && <span className="field-error">{err.email}</span>}</label>
            <label className="field"><span>WhatsApp (con código de país)</span><input className="input" name="phone" inputMode="tel" defaultValue={u?.phone} placeholder="5491140000000" /></label>
            <label className="field"><span>Cargo</span><input className="input" name="title" defaultValue={u?.title} placeholder="Ej.: Asesora · Zona Norte" /></label>
            <label className="field"><span>Matrícula</span><input className="input" name="license" defaultValue={u?.license ?? ""} placeholder="Ej.: CUCICBA N.º 1234" /></label>
            <label className="field">
              <span>Rol</span>
              <select className="select" name="role" defaultValue={u?.role ?? "agente"}>
                <option value="agente">Agente (sus propiedades y consultas)</option>
                <option value="admin">Administrador (todo, incluido el equipo)</option>
              </select>
            </label>
          </div>
          <label className="field"><span>Presentación breve (se muestra en “Nosotros”)</span><textarea className="textarea" name="bio" rows={3} maxLength={400} defaultValue={u?.bio} /></label>
          <div className="row" style={{ flexWrap: "wrap", gap: 24 }}>
            <label className="check"><input type="checkbox" name="active" defaultChecked={u?.active ?? true} /> Acceso habilitado</label>
            <label className="check"><input type="checkbox" name="public" defaultChecked={u?.public ?? true} /> Mostrar en el sitio</label>
          </div>
        </div>
      </fieldset>
      <fieldset className="pform__section">
        <legend>{u?.hasPassword ? "Restablecer contraseña" : "Contraseña inicial"}</legend>
        <label className="field">
          <span>{u?.hasPassword ? "Nueva contraseña (dejar vacío para no cambiarla)" : "Contraseña"}</span>
          <input className="input" type="text" name="password" autoComplete="new-password" minLength={10} aria-invalid={!!err.password} />
          {err.password ? <span className="field-error">{err.password}</span> : <span className="tiny muted">Mínimo 10 caracteres. La persona puede cambiarla luego desde “Mi cuenta”.</span>}
        </label>
      </fieldset>
      <div className="pform__publish">
        <span />
        <button className="btn" disabled={pending}>{pending ? "Guardando…" : u ? "Guardar cambios" : "Crear usuario"}</button>
      </div>
    </form>
  );
}
