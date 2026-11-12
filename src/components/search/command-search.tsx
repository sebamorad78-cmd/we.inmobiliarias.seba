"use client";

import { Img as Image } from "@/components/img";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../icon";

type Item = {
  slug: string;
  code: string;
  title: string;
  hood: string;
  city: string;
  type: string;
  op: "venta" | "alquiler" | "temporario";
  opLabel: string;
  price: string;
  area: string | null;
  rooms: number | null;
  image: string | null;
  featured: boolean;
  tags: string;
};
type Hood = { name: string; city: string; count: number };
type Index = { items: Item[]; hoods: Hood[] };

type Result =
  | { kind: "prop"; item: Item; href: string }
  | { kind: "hood"; hood: Hood; href: string }
  | { kind: "page"; label: string; hint: string; href: string };

const OPS = [
  { id: "", label: "Todo" },
  { id: "venta", label: "Comprar" },
  { id: "alquiler", label: "Alquilar" },
  { id: "temporario", label: "Temporario" },
] as const;

const PAGES = [
  { label: "Tasar mi propiedad", hint: "Informe en 48 h", href: "/tasaciones" },
  { label: "Hablar con un asesor", hint: "Contacto", href: "/contacto" },
  { label: "Mis favoritos", hint: "Guardadas", href: "/favoritos" },
  { label: "Comparar propiedades", hint: "Hasta 4", href: "/comparar" },
];

export const OPEN_SEARCH_EVENT = "rb:open-search";
export function openSearch() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Puntaje simple y predecible: código exacto > comienzo de palabra > contiene. */
function score(hay: string, terms: string[]): number {
  let total = 0;
  for (const t of terms) {
    const i = hay.indexOf(t);
    if (i < 0) return -1;
    total += i === 0 ? 6 : hay[i - 1] === " " ? 4 : 1;
  }
  return total;
}

/**
 * Buscador instantáneo (⌘K / Ctrl+K). Carga un índice liviano una sola vez
 * y responde en cada tecla, sin ir al servidor.
 */
export function CommandSearch() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<Index | null>(null);
  const [q, setQ] = useState("");
  const [op, setOp] = useState<(typeof OPS)[number]["id"]>("");
  const [active, setActive] = useState(0);

  const show = useCallback(() => {
    setOpen(true);
    if (!index) {
      fetch("/api/buscar")
        .then((r) => r.json())
        .then(setIndex)
        .catch(() => setIndex({ items: [], hoods: [] }));
    }
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        show();
      } else if (e.key === "/" && !/input|textarea|select/i.test((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, show);
    };
  }, [show]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      requestAnimationFrame(() => input.current?.focus());
    }
    if (!open && d.open) d.close();
  }, [open]);

  const results = useMemo<Result[]>(() => {
    if (!index) return [];
    const terms = norm(q).split(/\s+/).filter(Boolean);
    const items = index.items.filter((i) => !op || i.op === op);
    const opQuery = op ? `operacion=${op}&` : "";

    if (!terms.length) {
      const featured = items.filter((i) => i.featured).slice(0, 4);
      return [
        ...featured.map((item) => ({ kind: "prop" as const, item, href: `/propiedades/${item.slug}` })),
        ...[...index.hoods]
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((hood) => ({ kind: "hood" as const, hood, href: `/propiedades?${opQuery}barrio=${encodeURIComponent(hood.name)}` })),
        ...PAGES.map((p) => ({ kind: "page" as const, ...p })),
      ];
    }

    const props = items
      .map((item) => ({ item, s: score(norm(`${item.code} ${item.title} ${item.hood} ${item.city} ${item.type} ${item.opLabel} ${item.tags}`), terms) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 7)
      .map(({ item }) => ({ kind: "prop" as const, item, href: `/propiedades/${item.slug}` }));
    const hoods = index.hoods
      .map((hood) => ({ hood, s: score(norm(`${hood.name} ${hood.city}`), terms) }))
      .filter((r) => r.s >= 0)
      .slice(0, 4)
      .map(({ hood }) => ({ kind: "hood" as const, hood, href: `/propiedades?${opQuery}barrio=${encodeURIComponent(hood.name)}` }));
    const pages = PAGES.filter((p) => score(norm(`${p.label} ${p.hint}`), terms) >= 0).map((p) => ({ kind: "page" as const, ...p }));
    const all: Result[] = [...props, ...hoods, ...pages];
    all.push({ kind: "page", label: `Ver todos los resultados de “${q.trim()}”`, hint: "Listado", href: `/propiedades?${opQuery}q=${encodeURIComponent(q.trim())}` });
    return all;
  }, [index, q, op]);

  useEffect(() => setActive(0), [q, op]);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function go(r: Result | undefined) {
    if (!r) return;
    setOpen(false);
    setQ("");
    router.push(r.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Tab" && !e.shiftKey && document.activeElement === input.current) {
      e.preventDefault();
      const i = OPS.findIndex((o) => o.id === op);
      setOp(OPS[(i + 1) % OPS.length].id);
    }
  }

  let i = -1;
  const section = (title: string, kind: Result["kind"]) => {
    const rows = results.filter((r) => r.kind === kind);
    if (!rows.length) return null;
    return (
      <li className="cmd__group" role="presentation">
        <p className="cmd__label">{title}</p>
        <ul role="group" aria-label={title}>
          {rows.map((r) => {
            i++;
            const idx = i;
            return (
              <li
                key={r.href + idx}
                id={`cmd-${idx}`}
                role="option"
                aria-selected={active === idx}
                data-i={idx}
                className={`cmd__row cmd__row--${r.kind}`}
                onMouseMove={() => active !== idx && setActive(idx)}
                onClick={() => go(r)}
              >
                {r.kind === "prop" && (
                  <>
                    <span className="cmd__thumb">
                      {r.item.image && <Image src={r.item.image} alt="" width={88} height={64} quality={70} sizes="88px" />}
                    </span>
                    <span className="cmd__main">
                      <span className="cmd__title">{r.item.title}</span>
                      <span className="cmd__meta">
                        {r.item.hood} · {r.item.type} · {r.item.opLabel}
                        {r.item.area ? ` · ${r.item.area}` : ""}
                      </span>
                    </span>
                    <span className="cmd__side">
                      <span className="cmd__price">{r.item.price}</span>
                      <span className="cmd__code">{r.item.code}</span>
                    </span>
                  </>
                )}
                {r.kind === "hood" && (
                  <>
                    <span className="cmd__icon"><Icon name="pin" size={18} /></span>
                    <span className="cmd__main">
                      <span className="cmd__title">{r.hood.name}</span>
                      <span className="cmd__meta">{r.hood.city}</span>
                    </span>
                    <span className="cmd__side"><span className="cmd__code">{r.hood.count} prop.</span></span>
                  </>
                )}
                {r.kind === "page" && (
                  <>
                    <span className="cmd__icon"><Icon name="chevronRight" size={18} /></span>
                    <span className="cmd__main"><span className="cmd__title">{r.label}</span></span>
                    <span className="cmd__side"><span className="cmd__code">{r.hint}</span></span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </li>
    );
  };

  return (
    <dialog
      ref={dialog}
      className="cmd"
      aria-label="Buscar propiedades"
      onClose={() => setOpen(false)}
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="cmd__panel" onKeyDown={onKeyDown}>
        <div className="cmd__bar">
          <Icon name="search" size={20} />
          <input
            ref={input}
            className="cmd__input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Barrio, tipo de propiedad o código…"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-list"
            aria-activedescendant={results.length ? `cmd-${active}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="cmd__kbd">Esc</kbd>
        </div>
        <div className="cmd__ops" role="group" aria-label="Operación">
          {OPS.map((o) => (
            <button key={o.id} type="button" aria-pressed={op === o.id} onClick={() => setOp(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
        <ul id="cmd-list" ref={list} className="cmd__list" role="listbox" aria-label="Resultados">
          {!index ? (
            <li className="cmd__empty">Cargando…</li>
          ) : results.length === 0 ? (
            <li className="cmd__empty">Sin coincidencias.</li>
          ) : (
            <>
              {section(q ? "Propiedades" : "Destacadas", "prop")}
              {section("Barrios", "hood")}
              {section("Accesos", "page")}
            </>
          )}
        </ul>
        <div className="cmd__foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
          <span><kbd>↵</kbd> abrir</span>
          <span><kbd>Tab</kbd> operación</span>
        </div>
      </div>
    </dialog>
  );
}
