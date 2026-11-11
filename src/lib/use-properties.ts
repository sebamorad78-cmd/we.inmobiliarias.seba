"use client";

import { useEffect, useState } from "react";
import type { Property } from "./types";

/** Trae del servidor las propiedades de una lista de ids, respetando el orden. */
export function usePropertiesByIds(ids: string[]) {
  const [data, setData] = useState<Property[] | null>(null);
  const key = ids.join(",");
  useEffect(() => {
    if (!key) {
      setData([]);
      return;
    }
    const ctrl = new AbortController();
    fetch(`/api/propiedades?ids=${encodeURIComponent(key)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Property[]) => setData(d))
      .catch((e) => e.name !== "AbortError" && setData([]));
    return () => ctrl.abort();
  }, [key]);
  return data;
}
