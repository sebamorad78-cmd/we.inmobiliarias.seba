"use client";

import { useState } from "react";
import { site } from "@/site.config";
import { whatsappLink } from "@/lib/format";
import type { PublicAgent } from "@/lib/types";
import { Icon } from "../icon";
import { LeadForm } from "../lead-form";

export function ContactBox({
  propertyId,
  code,
  title,
  agent,
  url,
}: {
  propertyId: string;
  code: string;
  title: string;
  agent: PublicAgent | null;
  url: string;
}) {
  const [tab, setTab] = useState<"consulta" | "visita">("consulta");
  const phone = agent?.phone || site.whatsapp;
  const waText = `Hola${agent ? ` ${agent.name.split(" ")[0]}` : ""}, me interesa la propiedad ${code} (${title}). ${url}`;
  const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  return (
    <div className="cbox" id="contacto">
      {agent && (
        <div className="cbox__agent">
          <p className="cbox__label">Asesor a cargo</p>
          <p className="cbox__name">{agent.name}</p>
          <p className="tiny muted">{agent.title}</p>
        </div>
      )}

      <div className="cbox__quick">
        <a className="btn btn--wa" href={whatsappLink(phone, waText)} target="_blank" rel="noopener">
          <Icon name="whatsapp" size={18} /> WhatsApp
        </a>
        <a className="btn btn--ghost" href={`tel:+${phone.replace(/\D/g, "")}`}>
          <Icon name="phone" size={18} /> Llamar
        </a>
      </div>

      <div className="segmented cbox__tabs" role="tablist" aria-label="Tipo de contacto">
        <button type="button" role="tab" aria-selected={tab === "consulta"} aria-pressed={tab === "consulta"} onClick={() => setTab("consulta")}>
          Consultar
        </button>
        <button type="button" role="tab" aria-selected={tab === "visita"} aria-pressed={tab === "visita"} onClick={() => setTab("visita")}>
          Agendar visita
        </button>
      </div>

      {tab === "consulta" ? (
        <LeadForm
          key="consulta"
          kind="consulta"
          propertyId={propertyId}
          defaultMessage={`Hola, me interesa esta propiedad (${code}). Quisiera recibir más información.`}
        />
      ) : (
        <LeadForm
          key="visita"
          kind="visita"
          propertyId={propertyId}
          showMessage={false}
          submitLabel="Solicitar visita"
          extra={
            <div className="form-grid form-grid--2">
              <label className="field">
                <span>Día preferido</span>
                <input className="input" type="date" name="preferredDate" min={minDate} required />
              </label>
              <label className="field">
                <span>Horario</span>
                <select className="select" name="preferredTime" defaultValue="Mañana (9 a 12 h)">
                  <option>Mañana (9 a 12 h)</option>
                  <option>Mediodía (12 a 15 h)</option>
                  <option>Tarde (15 a 19 h)</option>
                  <option>Sábado por la mañana</option>
                </select>
              </label>
            </div>
          }
        />
      )}
    </div>
  );
}
