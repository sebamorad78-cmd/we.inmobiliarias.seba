"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "../icon";
import { PROPERTY_TYPES, type Operation } from "@/lib/types";
import { typeLabel } from "@/lib/labels";

const BUDGETS: Record<Operation, { label: string; value: number }[]> = {
  venta: [150000, 250000, 400000, 600000, 900000, 1500000].map((v) => ({
    value: v,
    label: `Hasta USD ${v.toLocaleString("es-AR")}`,
  })),
  alquiler: [800000, 1200000, 1800000, 2500000, 3500000].map((v) => ({
    value: v,
    label: `Hasta $ ${v.toLocaleString("es-AR")}`,
  })),
  temporario: [1000, 1500, 2500, 4000].map((v) => ({ value: v, label: `Hasta USD ${v.toLocaleString("es-AR")}` })),
};

const TABS: { id: Operation; label: string }[] = [
  { id: "venta", label: "Comprar" },
  { id: "alquiler", label: "Alquilar" },
  { id: "temporario", label: "Temporario" },
];

export function HeroSearch({ neighborhoods }: { neighborhoods: string[] }) {
  const router = useRouter();
  const [op, setOp] = useState<Operation>("venta");
  const [where, setWhere] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams({ operacion: op });
    const w = where.trim();
    const hood = neighborhoods.find((n) => n.toLowerCase() === w.toLowerCase());
    if (hood) p.set("barrio", hood);
    else if (w) p.set("q", w);
    if (type) p.set("tipo", type);
    if (budget) {
      p.set("hasta", budget);
      p.set("moneda", op === "alquiler" ? "ARS" : "USD");
    }
    router.push(`/propiedades?${p.toString()}`);
  }

  return (
    <form className="hsearch" onSubmit={onSubmit} role="search" aria-label="Buscar propiedades">
      <div className="hsearch__tabs" role="group" aria-label="Operación">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={op === t.id}
            onClick={() => {
              setOp(t.id);
              setBudget("");
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="hsearch__fields">
        <label className="hsearch__field hsearch__field--grow">
          <span>Ubicación o código</span>
          <input
            list="hs-barrios"
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            placeholder="Palermo, Nordelta, RB-1041…"
            autoComplete="off"
          />
          <datalist id="hs-barrios">
            {neighborhoods.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </label>
        <label className="hsearch__field">
          <span>Tipo</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Todos</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {typeLabel[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="hsearch__field">
          <span>Presupuesto</span>
          <select value={budget} onChange={(e) => setBudget(e.target.value)}>
            <option value="">Sin límite</option>
            {BUDGETS[op].map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn--clay hsearch__submit">
          <Icon name="search" size={18} />
          Buscar
        </button>
      </div>
    </form>
  );
}
