"use client";

import { useState } from "react";
import { Icon } from "../icon";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.href.split("#")[0];
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* el usuario canceló: seguimos con copiar */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copiá el enlace:", url);
    }
  }
  return (
    <button type="button" className="btn btn--ghost btn--s" onClick={share}>
      <Icon name={copied ? "check" : "share"} size={18} />
      <span aria-live="polite">{copied ? "Enlace copiado" : "Compartir"}</span>
    </button>
  );
}

export function PrintButton() {
  return (
    <button type="button" className="btn btn--ghost btn--s" onClick={() => window.print()}>
      <Icon name="print" size={18} /> Ficha PDF
    </button>
  );
}
