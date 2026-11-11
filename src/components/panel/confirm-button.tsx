"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function ConfirmButton({ message, children }: { message: string; children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn--ghost btn--s btn--danger" disabled={pending} onClick={(e) => !confirm(message) && e.preventDefault()}>
      {children}
    </button>
  );
}
