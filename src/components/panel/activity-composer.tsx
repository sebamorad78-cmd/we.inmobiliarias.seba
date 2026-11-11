"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { addActivity, logWhatsapp } from "@/app/panel/crm-actions";
import type { ActionState } from "@/app/panel/actions";
import { Icon } from "../icon";

const KINDS = [
  { id: "nota", label: "Nota" },
  { id: "llamado", label: "Llamado" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "Email" },
  { id: "visita", label: "Visita" },
] as const;

/** Registrar lo que pasó con un cliente: queda en su historial con fecha y responsable. */
export function ActivityComposer({ contactId, propertyId }: { contactId?: string; propertyId?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addActivity, { ok: false, message: "" });
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("llamado");
  const form = useRef<HTMLFormElement>(null);
  const last = useRef(state);
  useEffect(() => {
    if (state !== last.current && state.ok) form.current?.reset();
    last.current = state;
  }, [state]);

  return (
    <form
      ref={form}
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="kind" value={kind} />
      {contactId && <input type="hidden" name="contactId" value={contactId} />}
      {propertyId && <input type="hidden" name="propertyId" value={propertyId} />}
      <div className="seg seg--s" role="group" aria-label="Tipo de registro">
        {KINDS.map((k) => (
          <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
            {k.label}
          </button>
        ))}
      </div>
      <textarea
        className="textarea"
        name="text"
        rows={3}
        required
        placeholder={kind === "llamado" ? "¿Qué se habló? Próximo paso…" : kind === "nota" ? "Dato a recordar…" : "Resumen…"}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) form.current?.requestSubmit();
        }}
      />
      <div className="composer__foot">
        <span className="tiny muted">{state.message && !state.ok ? state.message : "Ctrl + Enter para guardar"}</span>
        <button className="btn btn--s" disabled={pending}>
          {pending ? "Guardando…" : "Registrar"}
        </button>
      </div>
    </form>
  );
}

/** Mensajes listos para WhatsApp. Al usarlos queda constancia en el historial del contacto. */
export function WhatsAppTemplates({ contactId, phone, templates }: { contactId: string; phone: string; templates: { label: string; text: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="watpl">
      <button type="button" className="btn btn--wa btn--s" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <Icon name="whatsapp" size={16} /> WhatsApp
      </button>
      {open && (
        <div className="watpl__menu" role="menu">
          {templates.map((t) => (
            <a
              key={t.label}
              role="menuitem"
              href={`https://wa.me/${phone}?text=${encodeURIComponent(t.text)}`}
              target="_blank"
              rel="noopener"
              onClick={() => {
                setOpen(false);
                startTransition(() => {
                  void logWhatsapp(contactId, t.text);
                });
              }}
            >
              <strong>{t.label}</strong>
              <span>{t.text.slice(0, 90)}…</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
