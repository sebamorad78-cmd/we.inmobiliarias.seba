"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { completeTask, saveDeal, saveTask } from "@/app/panel/crm-actions";
import type { ActionState } from "@/app/panel/actions";
import { arDayKey, dealStageLabel, taskTypeLabel, toArInput } from "@/lib/crm";
import { DEAL_STAGES, TASK_TYPES, type DealStage, type Operation, type TaskType } from "@/lib/types";

/* ───────────── API para abrir diálogos desde cualquier lugar ───────────── */

export interface Option {
  id: string;
  label: string;
  hint?: string;
}

export interface TaskPrefill {
  id?: string;
  type?: TaskType;
  title?: string;
  dueAt?: string; // ISO
  day?: string;
  time?: string;
  durationMin?: number;
  contactId?: string | null;
  propertyId?: string | null;
  leadId?: string | null;
  assignedTo?: string | null;
  notes?: string;
}

export interface DealPrefill {
  id?: string;
  title?: string;
  contactId?: string | null;
  propertyId?: string | null;
  stage?: DealStage;
  operation?: Operation;
  value?: number | null;
  currency?: "USD" | "ARS";
  commissionPct?: number;
  assignedTo?: string | null;
  expectedClose?: string | null;
  lostReason?: string;
}

export interface CompletePrefill {
  id: string;
  title: string;
  type: TaskType;
}

const EV = { task: "rb:task", deal: "rb:deal", done: "rb:done" } as const;
export const openTask = (p: TaskPrefill = {}) => window.dispatchEvent(new CustomEvent(EV.task, { detail: p }));
export const openDeal = (p: DealPrefill = {}) => window.dispatchEvent(new CustomEvent(EV.deal, { detail: p }));
export const openComplete = (p: CompletePrefill) => window.dispatchEvent(new CustomEvent(EV.done, { detail: p }));

function useEvent<T>(name: string, fn: (d: T) => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const h = (e: Event) => ref.current((e as CustomEvent<T>).detail);
    window.addEventListener(name, h);
    return () => window.removeEventListener(name, h);
  }, [name]);
}

/* ───────────── Marco de diálogo ───────────── */

function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className={`pdlg ${wide ? "pdlg--wide" : ""}`} onClose={onClose} onClick={(e) => e.target === e.currentTarget && onClose()} aria-label={title}>
      {open && (
        <div className="pdlg__panel">
          <header className="pdlg__head">
            <p className="pdlg__title">{title}</p>
            <button type="button" className="pdlg__x" onClick={onClose} aria-label="Cerrar">
              ×
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}

function useSubmit(action: (s: ActionState, fd: FormData) => Promise<ActionState>, onDone: () => void) {
  const [state, run, pending] = useActionState<ActionState, FormData>(action, { ok: false, message: "" });
  const last = useRef(state);
  useEffect(() => {
    if (state !== last.current && state.ok) onDone();
    last.current = state;
  }, [state, onDone]);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Incluye el botón que envió (p. ej. "hecha" o "cancelada").
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const fd = new FormData(e.currentTarget, submitter);
    startTransition(() => run(fd));
  };
  return { state, pending, onSubmit };
}

function Select({ name, options, value, placeholder }: { name: string; options: Option[]; value?: string | null; placeholder: string }) {
  return (
    <select className="select" name={name} defaultValue={value ?? ""}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
          {o.hint ? ` · ${o.hint}` : ""}
        </option>
      ))}
    </select>
  );
}

/* ───────────── Agendar / editar evento ───────────── */

function TaskDialog({ contacts, properties, users, me }: { contacts: Option[]; properties: Option[]; users: Option[]; me: string }) {
  const [p, setP] = useState<TaskPrefill | null>(null);
  const close = () => setP(null);
  const { state, pending, onSubmit } = useSubmit(saveTask, close);
  useEvent<TaskPrefill>(EV.task, (d) => setP(d));

  const local = p?.dueAt ? toArInput(p.dueAt) : null;
  const day = p?.day ?? local?.slice(0, 10) ?? arDayKey();
  const time = p?.time ?? local?.slice(11, 16) ?? "10:00";
  const [type, setType] = useState<TaskType>("visita");
  useEffect(() => {
    if (p) setType(p.type ?? "visita");
  }, [p]);

  return (
    <Modal open={!!p} onClose={close} title={p?.id ? "Editar evento" : "Agendar"}>
      {p && (
        <form className="pdlg__body form-grid" onSubmit={onSubmit} key={JSON.stringify(p)}>
          {p.id && <input type="hidden" name="id" value={p.id} />}
          {p.leadId && <input type="hidden" name="leadId" value={p.leadId} />}
          <input type="hidden" name="type" value={type} />
          <div className="seg" role="group" aria-label="Tipo">
            {TASK_TYPES.map((t) => (
              <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)}>
                {taskTypeLabel[t]}
              </button>
            ))}
          </div>
          <label className="field">
            <span>Título (opcional)</span>
            <input className="input" name="title" defaultValue={p.title} placeholder="Se completa solo con el tipo, el contacto y la propiedad" />
          </label>
          <div className="form-grid form-grid--3">
            <label className="field">
              <span>Día</span>
              <input className="input" type="date" name="day" defaultValue={day} required />
            </label>
            <label className="field">
              <span>Hora</span>
              <input className="input" type="time" name="time" defaultValue={time} step={900} required />
            </label>
            <label className="field">
              <span>Duración</span>
              <select className="select" name="durationMin" defaultValue={String(p.durationMin ?? (type === "llamado" ? 15 : 60))}>
                {[15, 30, 45, 60, 90, 120, 180].map((m) => (
                  <option key={m} value={m}>
                    {m < 60 ? `${m} min` : `${m / 60} h`}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-grid form-grid--2">
            <label className="field">
              <span>Contacto</span>
              <Select name="contactId" options={contacts} value={p.contactId} placeholder="Sin contacto" />
            </label>
            <label className="field">
              <span>Propiedad</span>
              <Select name="propertyId" options={properties} value={p.propertyId} placeholder="Sin propiedad" />
            </label>
          </div>
          <label className="field">
            <span>Responsable</span>
            <Select name="assignedTo" options={users} value={p.assignedTo ?? me} placeholder="Yo" />
          </label>
          <label className="field">
            <span>Notas</span>
            <textarea className="textarea" name="notes" rows={3} defaultValue={p.notes} placeholder="Dirección de encuentro, llaves, qué llevar…" />
          </label>
          {state.message && !state.ok && <p className="notice notice--error">{state.message}</p>}
          <div className="pdlg__foot">
            <button type="button" className="btn btn--ghost btn--s" onClick={close}>
              Cancelar
            </button>
            <button className="btn btn--s" disabled={pending}>
              {pending ? "Guardando…" : p.id ? "Guardar" : "Agendar"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ───────────── Marcar como hecho, con resultado ───────────── */

function CompleteDialog() {
  const [p, setP] = useState<CompletePrefill | null>(null);
  const close = () => setP(null);
  const { state, pending, onSubmit } = useSubmit(completeTask, close);
  useEvent<CompletePrefill>(EV.done, (d) => setP(d));
  const prompt =
    p?.type === "visita"
      ? "¿Cómo les fue? ¿Qué les gustó y qué no?"
      : p?.type === "llamado"
        ? "¿Qué se habló? ¿Cuál es el próximo paso?"
        : "Resultado o comentario";
  return (
    <Modal open={!!p} onClose={close} title="Registrar resultado">
      {p && (
        <form className="pdlg__body form-grid" onSubmit={onSubmit}>
          <input type="hidden" name="id" value={p.id} />
          <p className="pdlg__sub">{p.title}</p>
          <label className="field">
            <span>Resultado</span>
            <textarea className="textarea" name="outcome" rows={4} placeholder={prompt} autoFocus />
          </label>
          <label className="field">
            <span>Agendar seguimiento</span>
            <select className="select" name="followUpDays" defaultValue="0">
              <option value="0">No hace falta</option>
              <option value="1">Llamar mañana</option>
              <option value="3">En 3 días</option>
              <option value="7">En una semana</option>
              <option value="14">En dos semanas</option>
            </select>
          </label>
          <p className="tiny muted">Si tiene un contacto vinculado, queda registrado en su historial.</p>
          {state.message && !state.ok && <p className="notice notice--error">{state.message}</p>}
          <div className="pdlg__foot">
            <button className="btn btn--ghost btn--s" name="status" value="cancelada" disabled={pending}>
              No se hizo
            </button>
            <button className="btn btn--s" name="status" value="hecha" disabled={pending}>
              Marcar como hecho
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ───────────── Oportunidad ───────────── */

function DealDialog({ contacts, properties, users, me }: { contacts: Option[]; properties: Option[]; users: Option[]; me: string }) {
  const [p, setP] = useState<DealPrefill | null>(null);
  const close = () => setP(null);
  const { state, pending, onSubmit } = useSubmit(saveDeal, close);
  useEvent<DealPrefill>(EV.deal, (d) => setP(d));
  return (
    <Modal open={!!p} onClose={close} title={p?.id ? "Editar oportunidad" : "Nueva oportunidad"}>
      {p && (
        <form className="pdlg__body form-grid" onSubmit={onSubmit} key={JSON.stringify(p)}>
          {p.id && <input type="hidden" name="id" value={p.id} />}
          <div className="form-grid form-grid--2">
            <label className="field">
              <span>Contacto</span>
              <Select name="contactId" options={contacts} value={p.contactId} placeholder="Elegir contacto" />
            </label>
            <label className="field">
              <span>Propiedad</span>
              <Select name="propertyId" options={properties} value={p.propertyId} placeholder="Elegir propiedad" />
            </label>
          </div>
          <label className="field">
            <span>Título (opcional)</span>
            <input className="input" name="title" defaultValue={p.title} placeholder="Se arma con el apellido y la propiedad" />
          </label>
          <div className="form-grid form-grid--3">
            <label className="field">
              <span>Etapa</span>
              <select className="select" name="stage" defaultValue={p.stage ?? "interesado"}>
                {DEAL_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {dealStageLabel[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Operación</span>
              <select className="select" name="operation" defaultValue={p.operation ?? ""}>
                <option value="">Según la propiedad</option>
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler</option>
                <option value="temporario">Temporario</option>
              </select>
            </label>
            <label className="field">
              <span>Cierre estimado</span>
              <input className="input" type="date" name="expectedClose" defaultValue={p.expectedClose ?? ""} />
            </label>
          </div>
          <div className="form-grid form-grid--3">
            <label className="field">
              <span>Valor</span>
              <input className="input" name="value" inputMode="numeric" defaultValue={p.value ?? ""} placeholder="Precio de la propiedad" />
            </label>
            <label className="field">
              <span>Moneda</span>
              <select className="select" name="currency" defaultValue={p.currency ?? ""}>
                <option value="">Según la propiedad</option>
                <option value="USD">USD</option>
                <option value="ARS">$</option>
              </select>
            </label>
            <label className="field">
              <span>Honorarios %</span>
              <input className="input" name="commissionPct" inputMode="decimal" defaultValue={p.commissionPct ?? ""} placeholder="3" />
            </label>
          </div>
          <div className="form-grid form-grid--2">
            <label className="field">
              <span>Responsable</span>
              <Select name="assignedTo" options={users} value={p.assignedTo ?? me} placeholder="Yo" />
            </label>
            <label className="field">
              <span>Motivo si se pierde</span>
              <input className="input" name="lostReason" defaultValue={p.lostReason} />
            </label>
          </div>
          {state.message && !state.ok && <p className="notice notice--error">{state.message}</p>}
          <div className="pdlg__foot">
            <button type="button" className="btn btn--ghost btn--s" onClick={close}>
              Cancelar
            </button>
            <button className="btn btn--s" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function PanelDialogs(props: { contacts: Option[]; properties: Option[]; users: Option[]; me: string }) {
  return (
    <>
      <TaskDialog {...props} />
      <CompleteDialog />
      <DealDialog {...props} />
    </>
  );
}

/* ───────────── Botones de acceso ───────────── */

export function TaskButton({ prefill, children, className = "btn btn--s" }: { prefill?: TaskPrefill; children: ReactNode; className?: string }) {
  return (
    <button type="button" className={className} onClick={() => openTask(prefill)}>
      {children}
    </button>
  );
}

export function DealButton({ prefill, children, className = "btn btn--s" }: { prefill?: DealPrefill; children: ReactNode; className?: string }) {
  return (
    <button type="button" className={className} onClick={() => openDeal(prefill)}>
      {children}
    </button>
  );
}

export function DoneButton({ task, children, className = "pcheck" }: { task: CompletePrefill; children?: ReactNode; className?: string }) {
  return (
    <button type="button" className={className} onClick={() => openComplete(task)} aria-label={`Marcar como hecho: ${task.title}`} title="Marcar como hecho">
      {children}
    </button>
  );
}
