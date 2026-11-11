"use client";

import { useActionState, useEffect, useRef, useState, startTransition, type ReactNode } from "react";
import { saveProperty, type ActionState } from "@/app/panel/actions";
import { AMENITIES, operationLabel, statusLabel, typeLabel } from "@/lib/labels";
import { CURRENCIES, OPERATIONS, PROPERTY_STATUSES, PROPERTY_TYPES, type Property, type PublicAgent } from "@/lib/types";
import { Icon } from "../icon";
import { ImageManager } from "./image-manager";
import { LocationPicker } from "./location-picker";

export function PropertyForm({
  property,
  agents,
  neighborhoods,
  canChooseAgent,
}: {
  property: Property | null;
  agents: PublicAgent[];
  neighborhoods: string[];
  canChooseAgent: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveProperty, { ok: false, message: "" });
  const [dirty, setDirty] = useState(false);
  const [operation, setOperation] = useState(property?.operation ?? "venta");
  const [desc, setDesc] = useState(property?.description ?? "");
  const msgRef = useRef<HTMLDivElement>(null);
  const p = property;
  const err = state.errors ?? {};

  // Aviso al salir con cambios sin guardar.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) setDirty(false);
    msgRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state]);

  const num = (name: keyof Property, label: string, opts: { suffix?: string; step?: string } = {}) => (
    <label className="field">
      <span>{label}</span>
      <div className="input-affix">
        <input className="input" name={name} type="number" inputMode="numeric" min={0} step={opts.step ?? "1"} defaultValue={(p?.[name] as number | null) ?? ""} aria-invalid={!!err[name]} />
        {opts.suffix && <span>{opts.suffix}</span>}
      </div>
      {err[name] && <span className="field-error">{err[name]}</span>}
    </label>
  );

  return (
    <form
      className="pform"
      onChange={() => setDirty(true)}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      noValidate
    >
      {p && <input type="hidden" name="id" value={p.id} />}

      <div ref={msgRef} aria-live="polite">
        {state.message && <p className={`notice ${state.ok ? "notice--ok" : "notice--error"}`}>{state.message}</p>}
      </div>

      <Section title="Datos principales" n="01">
        <label className="field">
          <span>Título del aviso</span>
          <input className="input" name="title" defaultValue={p?.title} maxLength={120} placeholder="Ej.: Casa racionalista con jardín y pileta" aria-invalid={!!err.title} required />
          {err.title ? <span className="field-error">{err.title}</span> : <span className="tiny muted">Corto y concreto. El barrio ya se muestra aparte.</span>}
        </label>
        <div className="form-grid form-grid--3">
          <label className="field">
            <span>Operación</span>
            <select className="select" name="operation" value={operation} onChange={(e) => setOperation(e.target.value as Property["operation"])}>
              {OPERATIONS.map((o) => <option key={o} value={o}>{operationLabel[o]}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Tipo</span>
            <select className="select" name="type" defaultValue={p?.type ?? "departamento"}>
              {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{typeLabel[t]}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Código</span>
            <input className="input" name="code" defaultValue={p?.code} placeholder="Automático" aria-invalid={!!err.code} />
            {err.code && <span className="field-error">{err.code}</span>}
          </label>
        </div>
      </Section>

      <Section title="Precio" n="02">
        <div className="form-grid form-grid--3">
          <label className="field">
            <span>Moneda</span>
            <select className="select" name="currency" defaultValue={p?.currency ?? (operation === "alquiler" ? "ARS" : "USD")} key={p ? "fixed" : operation}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c === "USD" ? "Dólares (USD)" : "Pesos ($)"}</option>)}
            </select>
          </label>
          {num("price", operation === "venta" ? "Precio" : "Precio mensual")}
          {num("expenses", "Expensas mensuales ($)")}
        </div>
        <p className="tiny muted">Dejá el precio vacío para mostrar “Consultar precio”.</p>
      </Section>

      <Section title="Ubicación" n="03">
        <div className="form-grid form-grid--3">
          <label className="field">
            <span>Barrio</span>
            <input id="f-hood" className="input" name="neighborhood" list="f-hoods" defaultValue={p?.neighborhood} aria-invalid={!!err.neighborhood} required />
            <datalist id="f-hoods">{neighborhoods.map((n) => <option key={n} value={n} />)}</datalist>
            {err.neighborhood && <span className="field-error">{err.neighborhood}</span>}
          </label>
          <label className="field">
            <span>Localidad / zona</span>
            <input className="input" name="city" list="f-cities" defaultValue={p?.city ?? "CABA"} aria-invalid={!!err.city} required />
            <datalist id="f-cities"><option value="CABA" /><option value="Zona Norte" /><option value="Zona Oeste" /><option value="Zona Sur" /><option value="Tigre" /></datalist>
          </label>
          <label className="field">
            <span>Dirección</span>
            <input id="f-address" className="input" name="address" defaultValue={p?.address} placeholder="Calle y altura" />
          </label>
        </div>
        <label className="check">
          <input type="checkbox" name="showExactLocation" defaultChecked={p?.showExactLocation ?? false} />
          Mostrar la dirección exacta en el sitio (si no, se muestra una zona aproximada)
        </label>
        <LocationPicker lat={p?.lat ?? null} lng={p?.lng ?? null} addressFieldId="f-address" hoodFieldId="f-hood" />
      </Section>

      <Section title="Características" n="04">
        <div className="form-grid form-grid--4">
          {num("coveredArea", "Sup. cubierta", { suffix: "m²" })}
          {num("totalArea", "Sup. total", { suffix: "m²" })}
          {num("rooms", "Ambientes")}
          {num("bedrooms", "Dormitorios")}
          {num("bathrooms", "Baños")}
          {num("garages", "Cocheras")}
          {num("age", "Antigüedad", { suffix: "años" })}
          <label className="field">
            <span>Piso</span>
            <input className="input" name="floor" defaultValue={p?.floor ?? ""} placeholder="Ej.: 4.º" />
          </label>
          <label className="field">
            <span>Orientación</span>
            <input className="input" name="orientation" defaultValue={p?.orientation ?? ""} placeholder="Ej.: Norte, Frente" />
          </label>
        </div>
        <div className="row" style={{ flexWrap: "wrap", gap: 24 }}>
          <label className="check"><input type="checkbox" name="mortgageEligible" defaultChecked={p?.mortgageEligible} /> Apto crédito</label>
          <label className="check"><input type="checkbox" name="professionalUse" defaultChecked={p?.professionalUse} /> Apto profesional</label>
        </div>
      </Section>

      <Section title="Comodidades" n="05">
        <div className="chips">
          {AMENITIES.map((a) => (
            <label key={a} className="chip">
              <input type="checkbox" name="amenities" value={a} defaultChecked={p?.amenities.includes(a)} />
              <span>{a}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Descripción" n="06">
        <label className="field">
          <span className="sr-only">Descripción</span>
          <textarea className="textarea" name="description" rows={10} value={desc} onChange={(e) => setDesc(e.target.value)} aria-invalid={!!err.description} placeholder={"Primer párrafo: lo más importante.\n\nDejá una línea en blanco entre párrafos."} />
          <span className={`tiny ${desc.length < 300 ? "muted" : ""}`}>
            {desc.length} caracteres {desc.length < 300 && "· recomendamos al menos 300 para un buen posicionamiento"}
          </span>
          {err.description && <span className="field-error">{err.description}</span>}
        </label>
      </Section>

      <Section title="Fotos" n="07">
        <ImageManager initial={p?.images ?? []} defaultAlt={p?.title ?? ""} error={err.images} />
      </Section>

      <Section title="Video y recorrido virtual" n="08">
        <div className="form-grid form-grid--2">
          <label className="field">
            <span>Video de YouTube</span>
            <input className="input" name="videoUrl" type="url" defaultValue={p?.videoUrl ?? ""} placeholder="https://youtube.com/watch?v=…" aria-invalid={!!err.videoUrl} />
            {err.videoUrl && <span className="field-error">{err.videoUrl}</span>}
          </label>
          <label className="field">
            <span>Recorrido 360° (Matterport, Kuula…)</span>
            <input className="input" name="tourUrl" type="url" defaultValue={p?.tourUrl ?? ""} placeholder="https://…" aria-invalid={!!err.tourUrl} />
            {err.tourUrl && <span className="field-error">{err.tourUrl}</span>}
          </label>
        </div>
      </Section>

      <div className="pform__publish">
        <div className="form-grid form-grid--3" style={{ flex: 1 }}>
          <label className="field">
            <span>Estado</span>
            <select className="select" name="status" defaultValue={p?.status ?? "borrador"}>
              {PROPERTY_STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Asesor a cargo</span>
            <select className="select" name="agentId" defaultValue={p?.agentId ?? ""} disabled={!canChooseAgent}>
              <option value="">Sin asignar</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {!canChooseAgent && <input type="hidden" name="agentId" value={p?.agentId ?? ""} />}
          </label>
          <label className="check" style={{ alignSelf: "end", minHeight: 48 }}>
            <input type="checkbox" name="featured" defaultChecked={p?.featured} /> Destacar en la portada
          </label>
        </div>
        <button className="btn" disabled={pending}>
          {pending ? "Guardando…" : p ? "Guardar cambios" : "Crear propiedad"}
          {!pending && <Icon name="check" size={18} />}
        </button>
      </div>
    </form>
  );
}

function Section({ title, n, children }: { title: string; n: string; children: ReactNode }) {
  return (
    <fieldset className="pform__section">
      <legend>
        <span className="num">{n}</span> {title}
      </legend>
      <div className="form-grid">{children}</div>
    </fieldset>
  );
}
