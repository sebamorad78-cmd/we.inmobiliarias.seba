"use client";

import { useTransition } from "react";
import { setPropertyStatus } from "@/app/panel/actions";
import { statusLabel } from "@/lib/labels";
import { PROPERTY_STATUSES, type PropertyStatus } from "@/lib/types";

export function StatusSelect({ id, status }: { id: string; status: PropertyStatus }) {
  const [pending, start] = useTransition();
  return (
    <select
      className={`status-select status-select--${status}`}
      defaultValue={status}
      disabled={pending}
      aria-label="Cambiar estado"
      onChange={(e) => {
        const fd = new FormData();
        fd.set("id", id);
        fd.set("status", e.target.value);
        start(() => setPropertyStatus(fd));
      }}
    >
      {PROPERTY_STATUSES.map((s) => (
        <option key={s} value={s}>{statusLabel[s]}</option>
      ))}
    </select>
  );
}
