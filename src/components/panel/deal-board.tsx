"use client";

import { useOptimistic, useState, useTransition } from "react";
import { moveDeal } from "@/app/panel/crm-actions";
import { dealStageLabel } from "@/lib/crm";
import { formatMoney } from "@/lib/format";
import type { Currency, DealStage } from "@/lib/types";
import { openDeal, type DealPrefill } from "./shell/dialogs";

export interface BoardDeal {
  id: string;
  title: string;
  stage: DealStage;
  contact: string;
  contactHref: string | null;
  property: string;
  value: number | null;
  currency: Currency;
  fee: number | null;
  daysInStage: number;
  owner: string;
  prefill: DealPrefill;
}

const COLUMNS: DealStage[] = ["interesado", "visita", "oferta", "reserva", "boleto", "cerrada", "perdida"];

function sum(ds: BoardDeal[], key: "value" | "fee") {
  const usd = ds.filter((d) => d.currency === "USD").reduce((s, d) => s + (d[key] ?? 0), 0);
  const ars = ds.filter((d) => d.currency === "ARS").reduce((s, d) => s + (d[key] ?? 0), 0);
  return [usd ? formatMoney(Math.round(usd), "USD") : null, ars ? formatMoney(Math.round(ars), "ARS") : null].filter(Boolean).join(" + ") || "—";
}

export function DealBoard({ deals }: { deals: BoardDeal[] }) {
  const [items, move] = useOptimistic(deals, (state, { id, stage }: { id: string; stage: DealStage }) =>
    state.map((d) => (d.id === id ? { ...d, stage, daysInStage: 0 } : d)),
  );
  const [, start] = useTransition();
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<DealStage | null>(null);

  const doMove = (id: string, stage: DealStage) => {
    start(async () => {
      move({ id, stage });
      await moveDeal(id, stage);
    });
  };

  return (
    <div className="board">
      {COLUMNS.map((col) => {
        const list = items.filter((d) => d.stage === col);
        return (
          <section
            key={col}
            className={`board__col board__col--${col} ${over === col ? "is-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(col);
            }}
            onDragLeave={() => setOver((o) => (o === col ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData("text/plain") || drag;
              if (id) doMove(id, col);
              setDrag(null);
            }}
            aria-label={dealStageLabel[col]}
          >
            <header className="board__head">
              <p className="board__title">
                {dealStageLabel[col]} <span className="num">{list.length}</span>
              </p>
              {col !== "perdida" && <p className="board__sum num">{sum(list, "fee")}</p>}
            </header>
            <ul className="board__list">
              {list.map((d) => (
                <li
                  key={d.id}
                  className={`dcard ${drag === d.id ? "is-drag" : ""}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", d.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDrag(d.id);
                  }}
                  onDragEnd={() => setDrag(null)}
                >
                  <button type="button" className="dcard__open" onClick={() => openDeal(d.prefill)}>
                    <span className="dcard__title">{d.title}</span>
                    <span className="dcard__meta">{[d.contact, d.property].filter(Boolean).join(" · ")}</span>
                    <span className="dcard__row">
                      <span className="num">{d.value ? formatMoney(d.value, d.currency) : "Sin valor"}</span>
                      {d.fee ? <span className="dcard__fee num">{formatMoney(Math.round(d.fee), d.currency)}</span> : null}
                    </span>
                    <span className="dcard__foot">
                      <span className={d.daysInStage > 14 && col !== "cerrada" && col !== "perdida" ? "is-late" : ""}>
                        {d.daysInStage === 0 ? "Hoy" : `${d.daysInStage} d en la etapa`}
                      </span>
                      <span>{d.owner}</span>
                    </span>
                  </button>
                  <label className="dcard__move">
                    <span className="sr-only">Mover a</span>
                    <select value={d.stage} onChange={(e) => doMove(d.id, e.target.value as DealStage)} aria-label={`Mover ${d.title}`}>
                      {COLUMNS.map((c) => (
                        <option key={c} value={c}>
                          {dealStageLabel[c]}
                        </option>
                      ))}
                    </select>
                  </label>
                </li>
              ))}
              {list.length === 0 && <li className="board__empty">Arrastrá acá</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
