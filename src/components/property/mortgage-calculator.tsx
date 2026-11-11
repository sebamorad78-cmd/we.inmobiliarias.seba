"use client";

import { useId, useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";

/**
 * Simulador de cuota (sistema francés). Orientativo: la tasa y el plazo
 * reales dependen de cada banco. Se calcula en la moneda de la propiedad.
 */
export function MortgageCalculator({ price, currency }: { price: number; currency: "USD" | "ARS" }) {
  const id = useId();
  const [downPct, setDownPct] = useState(25);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(6.5);

  const { loan, payment, total } = useMemo(() => {
    const loan = price * (1 - downPct / 100);
    const n = years * 12;
    const r = rate / 100 / 12;
    const payment = r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n));
    return { loan, payment, total: payment * n };
  }, [price, downPct, years, rate]);

  return (
    <div className="calc">
      <div className="calc__inputs">
        <label className="calc__row" htmlFor={`${id}-down`}>
          <span>Anticipo</span>
          <output className="num">
            {downPct}% · {formatMoney(Math.round(price * (downPct / 100)), currency)}
          </output>
        </label>
        <input id={`${id}-down`} type="range" min={10} max={90} step={5} value={downPct} onChange={(e) => setDownPct(+e.target.value)} />

        <label className="calc__row" htmlFor={`${id}-years`}>
          <span>Plazo</span>
          <output className="num">{years} años</output>
        </label>
        <input id={`${id}-years`} type="range" min={5} max={30} step={1} value={years} onChange={(e) => setYears(+e.target.value)} />

        <label className="calc__row" htmlFor={`${id}-rate`}>
          <span>Tasa nominal anual</span>
          <output className="num">{rate.toLocaleString("es-AR")}%</output>
        </label>
        <input id={`${id}-rate`} type="range" min={3} max={14} step={0.25} value={rate} onChange={(e) => setRate(+e.target.value)} />
      </div>
      <div className="calc__result">
        <p className="eyebrow eyebrow--plain">Cuota mensual estimada</p>
        <p className="calc__payment num">{formatMoney(Math.round(payment), currency)}</p>
        <dl className="calc__dl">
          <div>
            <dt>Monto del préstamo</dt>
            <dd className="num">{formatMoney(Math.round(loan), currency)}</dd>
          </div>
          <div>
            <dt>Total a devolver</dt>
            <dd className="num">{formatMoney(Math.round(total), currency)}</dd>
          </div>
        </dl>
        <p className="tiny muted">
          Cálculo orientativo con sistema francés, sin seguros ni gastos. Las condiciones finales las define cada entidad.
        </p>
      </div>
    </div>
  );
}
