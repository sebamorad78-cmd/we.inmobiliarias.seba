"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Atajos de teclado de la bandeja: J/K o flechas para moverse, R responder, A agendar. */
export function InboxKeys({ ids, current, base }: { ids: string[]; current: string | null; base: string }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/input|textarea|select/i.test(t.tagName) || t.isContentEditable || document.querySelector("dialog[open]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const i = current ? ids.indexOf(current) : -1;
      const go = (j: number) => {
        if (j < 0 || j >= ids.length) return;
        e.preventDefault();
        router.replace(`${base}${base.includes("?") ? "&" : "?"}id=${ids[j]}`, { scroll: false });
      };
      if (e.key === "j" || e.key === "ArrowDown") go(i + 1);
      if (e.key === "k" || e.key === "ArrowUp") go(i - 1);
      if (e.key === "r") document.querySelector<HTMLElement>('[data-key="r"]')?.click();
      if (e.key === "a") document.querySelector<HTMLElement>('[data-key="a"]')?.closest("button")?.click();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ids, current, base, router]);
  return null;
}
