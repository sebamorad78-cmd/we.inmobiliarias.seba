"use client";

import { Icon } from "./icon";
import { COMPARE_MAX, toggle, useList } from "@/lib/shortlist";

export function FavoriteButton({ id, title, variant = "round" }: { id: string; title: string; variant?: "round" | "text" }) {
  const favs = useList("favorites");
  const active = favs.includes(id);
  const label = active ? `Quitar ${title} de favoritos` : `Guardar ${title} en favoritos`;
  return (
    <button
      type="button"
      className={variant === "round" ? "icon-btn fav-btn" : "btn btn--ghost btn--s"}
      aria-pressed={active}
      aria-label={variant === "round" ? label : undefined}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle("favorites", id);
      }}
    >
      <Icon name="heart" size={18} fill={active ? "currentColor" : "none"} />
      {variant === "text" && (active ? "Guardada" : "Guardar")}
    </button>
  );
}

export function CompareButton({ id, variant = "round" }: { id: string; variant?: "round" | "text" }) {
  const list = useList("compare");
  const active = list.includes(id);
  const label = active ? "Quitar del comparador" : `Agregar al comparador (hasta ${COMPARE_MAX})`;
  return (
    <button
      type="button"
      className={variant === "round" ? "icon-btn" : "btn btn--ghost btn--s"}
      aria-pressed={active}
      aria-label={variant === "round" ? label : undefined}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle("compare", id);
      }}
    >
      <Icon name={active ? "check" : "compare"} size={18} />
      {variant === "text" && (active ? "En comparador" : "Comparar")}
    </button>
  );
}
