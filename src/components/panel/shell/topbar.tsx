"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { openDeal, openTask } from "./dialogs";

export interface SearchItem {
  kind: "contacto" | "propiedad" | "consulta";
  label: string;
  hint: string;
  href: string;
  terms: string;
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const ACTIONS = [
  { label: "Agendar visita", hint: "Agenda", run: () => openTask({ type: "visita" }) },
  { label: "Agendar llamado", hint: "Agenda", run: () => openTask({ type: "llamado" }) },
  { label: "Nueva oportunidad", hint: "Oportunidades", run: () => openDeal() },
];

const LINKS = [
  { label: "Nuevo contacto", hint: "Contactos", href: "/panel/contactos/nuevo" },
  { label: "Nueva propiedad", hint: "Propiedades", href: "/panel/propiedades/nueva" },
  { label: "Nuevo contrato de alquiler", hint: "Alquileres", href: "/panel/alquileres/nuevo" },
];

export function Topbar({ index, today }: { index: SearchItem[]; today: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const dlg = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      requestAnimationFrame(() => input.current?.focus());
    }
    if (!open && d.open) d.close();
    if (!open) setQ("");
  }, [open]);

  type Row = { label: string; hint: string; go: () => void; group: string };
  const rows = useMemo<Row[]>(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    const match = (t: string) => terms.every((x) => t.includes(x));
    const found = terms.length ? index.filter((i) => match(i.terms)).slice(0, 12) : [];
    const acts: Row[] = [
      ...ACTIONS.filter((a) => !terms.length || match(norm(a.label))).map((a) => ({ label: a.label, hint: a.hint, group: "Acciones", go: () => (setOpen(false), a.run()) })),
      ...LINKS.filter((a) => !terms.length || match(norm(a.label))).map((a) => ({ label: a.label, hint: a.hint, group: "Acciones", go: () => (setOpen(false), router.push(a.href)) })),
    ];
    const res: Row[] = found.map((f) => ({
      label: f.label,
      hint: f.hint,
      group: f.kind === "contacto" ? "Contactos" : f.kind === "propiedad" ? "Propiedades" : "Consultas",
      go: () => (setOpen(false), router.push(f.href)),
    }));
    return [...res, ...acts];
  }, [q, index, router]);

  useEffect(() => setActive(0), [q]);

  let lastGroup = "";
  return (
    <div className="ptop">
      <p className="ptop__date">{today}</p>
      <button type="button" className="ptop__search" onClick={() => setOpen(true)}>
        <Icon name="search" size={17} />
        <span>Buscar contacto, propiedad o código</span>
        <kbd>Ctrl K</kbd>
      </button>
      <div className="ptop__new">
        <button type="button" className="btn btn--s" aria-expanded={menu} onClick={() => setMenu((v) => !v)} onBlur={() => setTimeout(() => setMenu(false), 150)}>
          <Icon name="plus" size={16} /> Nuevo
        </button>
        {menu && (
          <div className="ptop__menu" role="menu">
            {ACTIONS.map((a) => (
              <button key={a.label} type="button" role="menuitem" onMouseDown={(e) => e.preventDefault()} onClick={() => (setMenu(false), a.run())}>
                {a.label}
              </button>
            ))}
            {LINKS.map((a) => (
              <button key={a.label} type="button" role="menuitem" onMouseDown={(e) => e.preventDefault()} onClick={() => (setMenu(false), router.push(a.href))}>
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <dialog ref={dlg} className="pcmd" onClose={() => setOpen(false)} onClick={(e) => e.target === e.currentTarget && setOpen(false)} aria-label="Buscar en el panel">
        {open && (
          <div
            className="pcmd__panel"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => Math.min(a + 1, rows.length - 1)));
              if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(a - 1, 0)));
              if (e.key === "Enter" && rows[active]) (e.preventDefault(), rows[active].go());
            }}
          >
            <div className="pcmd__bar">
              <Icon name="search" size={19} />
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, teléfono, código RB-…, barrio" aria-label="Buscar" />
              <kbd>Esc</kbd>
            </div>
            <ul className="pcmd__list" role="listbox">
              {rows.length === 0 && <li className="pcmd__empty">Sin resultados para “{q}”.</li>}
              {rows.map((r, i) => {
                const head = r.group !== lastGroup ? r.group : null;
                lastGroup = r.group;
                return (
                  <li key={r.group + r.label + i} role="presentation">
                    {head && <p className="pcmd__group">{head}</p>}
                    <button type="button" role="option" aria-selected={i === active} className="pcmd__row" onMouseMove={() => setActive(i)} onClick={r.go}>
                      <span>{r.label}</span>
                      <span className="pcmd__hint">{r.hint}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </dialog>
    </div>
  );
}
