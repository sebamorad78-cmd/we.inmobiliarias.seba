"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { sortLabel } from "@/lib/labels";
import { SORT_KEYS } from "@/lib/types";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  return (
    <label className="sort">
      <span className="sr-only">Ordenar por</span>
      <select
        className="select"
        value={value}
        onChange={(e) => {
          const p = new URLSearchParams(sp.toString());
          if (e.target.value === "recientes") p.delete("orden");
          else p.set("orden", e.target.value);
          p.delete("pagina");
          router.replace(`${pathname}?${p.toString()}`, { scroll: false });
        }}
      >
        {SORT_KEYS.map((k) => (
          <option key={k} value={k}>
            {sortLabel[k]}
          </option>
        ))}
      </select>
    </label>
  );
}
