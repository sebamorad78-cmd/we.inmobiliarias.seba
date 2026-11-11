"use client";

import { useEffect, useState } from "react";
import { arDayKey, arWall, taskTypeLabel } from "@/lib/crm";
import type { TaskType } from "@/lib/types";
import { openComplete, openTask, type TaskPrefill } from "./shell/dialogs";

export interface GridEvent {
  id: string;
  type: TaskType;
  title: string;
  dueAt: string;
  durationMin: number;
  status: "pendiente" | "hecha" | "cancelada";
  who: string;
  contact: string;
  property: string;
  prefill: TaskPrefill;
}

const HOUR = 52; // px por hora

const minutesOf = (iso: string) => {
  const w = arWall(iso);
  return w.getUTCHours() * 60 + w.getUTCMinutes();
};

/** Reparte eventos superpuestos en carriles para que no se tapen. */
function lanes(evts: GridEvent[]) {
  const sorted = [...evts].sort((a, b) => minutesOf(a.dueAt) - minutesOf(b.dueAt));
  const out: { e: GridEvent; lane: number; lanes: number }[] = [];
  let group: { e: GridEvent; lane: number; end: number }[] = [];
  const flush = () => {
    const n = Math.max(1, ...group.map((g) => g.lane + 1));
    group.forEach((g) => out.push({ e: g.e, lane: g.lane, lanes: n }));
    group = [];
  };
  for (const e of sorted) {
    const s = minutesOf(e.dueAt);
    if (group.length && s >= Math.max(...group.map((g) => g.end))) flush();
    const used = new Set(group.filter((g) => g.end > s).map((g) => g.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    group.push({ e, lane, end: s + Math.max(e.durationMin, 30) });
  }
  flush();
  return out;
}

export function WeekGrid({ days, events }: { days: { key: string; label: string; num: string }[]; events: GridEvent[] }) {
  const [nowMin, setNowMin] = useState<number | null>(null);
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => {
      setNowMin(minutesOf(new Date().toISOString()));
      setToday(arDayKey());
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  // Rango visible: 7 a 22 h, ampliado si hay eventos más temprano o más tarde.
  const mins = events.map((e) => minutesOf(e.dueAt));
  const START = Math.min(7, ...mins.map((m) => Math.floor(m / 60)));
  const END = Math.max(22, ...events.map((e) => Math.ceil((minutesOf(e.dueAt) + e.durationMin) / 60)));
  const hours = Array.from({ length: END - START }, (_, i) => START + i);

  return (
    <div className="wgrid" style={{ ["--hour" as string]: `${HOUR}px` }}>
      <div className="wgrid__head">
        <span />
        {days.map((d) => (
          <div key={d.key} className={`wgrid__day ${d.key === today ? "is-today" : ""}`}>
            <span className="wgrid__dow">{d.label}</span>
            <span className="wgrid__num num">{d.num}</span>
          </div>
        ))}
      </div>
      <div className="wgrid__body">
        <div className="wgrid__hours">
          {hours.map((h) => (
            <span key={h} className="num">
              {String(h).padStart(2, "0")}:00
            </span>
          ))}
        </div>
        {days.map((d) => {
          const dayEvents = lanes(events.filter((e) => arDayKey(e.dueAt) === d.key));
          return (
            <div
              key={d.key}
              className={`wgrid__col ${d.key === today ? "is-today" : ""}`}
              style={{ height: (END - START) * HOUR }}
              onClick={(e) => {
                if (e.target !== e.currentTarget) return;
                const y = e.nativeEvent.offsetY;
                const mins = Math.max(0, Math.round(((y / HOUR) * 60) / 30) * 30) + START * 60;
                const time = `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
                openTask({ type: "visita", day: d.key, time });
              }}
              title="Hacé clic en un horario libre para agendar"
            >
              {d.key === today && nowMin != null && nowMin >= START * 60 && nowMin <= END * 60 && (
                <span className="wgrid__now" style={{ top: ((nowMin - START * 60) / 60) * HOUR }} aria-hidden="true" />
              )}
              {dayEvents.map(({ e, lane, lanes: n }) => {
                const top = Math.max(0, ((minutesOf(e.dueAt) - START * 60) / 60) * HOUR);
                const height = Math.max(22, (Math.max(e.durationMin, 20) / 60) * HOUR - 2);
                return (
                  <button
                    key={e.id}
                    type="button"
                    className={`wev wev--${e.type} wev--${e.status}`}
                    style={{ top, height, left: `calc(${(lane / n) * 100}% + 2px)`, width: `calc(${100 / n}% - 4px)` }}
                    onClick={() => (e.status === "pendiente" ? openTask(e.prefill) : undefined)}
                    title={`${taskTypeLabel[e.type]} · ${e.title}`}
                  >
                    {height < 40 ? (
                      <span className="wev__line">
                        <span className="num">{e.prefill.time ?? ""}</span> {e.title}
                      </span>
                    ) : (
                      <>
                        <span className="wev__time num">{e.prefill.time ?? ""}</span>
                        <span className="wev__title">{e.title}</span>
                      </>
                    )}
                    {height > 44 && (e.contact || e.property) && <span className="wev__meta">{[e.contact, e.property].filter(Boolean).join(" · ")}</span>}
                    {e.status === "pendiente" && (
                      <span
                        role="button"
                        tabIndex={0}
                        className="wev__done"
                        aria-label="Marcar como hecho"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          openComplete({ id: e.id, title: e.title, type: e.type });
                        }}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter") {
                            ev.stopPropagation();
                            openComplete({ id: e.id, title: e.title, type: e.type });
                          }
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
