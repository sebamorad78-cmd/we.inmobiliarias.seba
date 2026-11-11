"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clear, useList } from "@/lib/shortlist";
import { Icon } from "./icon";

export function CompareTray() {
  const ids = useList("compare");
  const pathname = usePathname();
  if (ids.length === 0 || pathname.startsWith("/comparar")) return null;
  return (
    <div className="ctray" role="region" aria-label="Comparador">
      <span className="num">
        <Icon name="compare" size={18} /> {ids.length} {ids.length === 1 ? "propiedad" : "propiedades"}
      </span>
      <Link href="/comparar" className="btn btn--s btn--light" aria-disabled={ids.length < 2}>
        Comparar
      </Link>
      <button type="button" className="ctray__x" onClick={() => clear("compare")} aria-label="Vaciar comparador">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
