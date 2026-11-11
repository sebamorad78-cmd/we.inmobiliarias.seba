"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { PropertyImage } from "@/lib/types";

/**
 * Portada de tarjeta con "barrido": al mover el mouse a lo ancho se recorren
 * hasta 5 fotos, sin clics. Las fotos extra se cargan recién al primer hover.
 */
export function CardMedia({ images, sizes, priority, label }: { images: PropertyImage[]; sizes: string; priority?: boolean; label: string }) {
  const shots = images.slice(0, 5);
  const [i, setI] = useState(0);
  const [armed, setArmed] = useState(false);
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const box = useRef<HTMLDivElement>(null);

  if (!shots.length) return <div className="media cmedia"><span className="media__fallback">{label}</span></div>;

  return (
    <div
      ref={box}
      className="media cmedia"
      onPointerEnter={(e) => e.pointerType === "mouse" && setArmed(true)}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || shots.length < 2) return;
        const r = box.current!.getBoundingClientRect();
        const k = Math.min(shots.length - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * shots.length)));
        if (k !== i) setI(k);
      }}
      onPointerLeave={() => setI(0)}
    >
      {shots.map((img, k) =>
        k === 0 || armed ? (
          failed.has(k) ? (
            <span key={k} className={`media__fallback cmedia__img ${k === i ? "is-on" : ""}`}>{label}</span>
          ) : (
            <Image
              key={img.url + k}
              src={img.url}
              alt={k === 0 ? img.alt : ""}
              fill
              sizes={sizes}
              priority={priority && k === 0}
              quality={80}
              className={`cmedia__img ${k === i ? "is-on" : ""}`}
              onError={() => setFailed((f) => new Set(f).add(k))}
            />
          )
        ) : null,
      )}
      {shots.length > 1 && (
        <span className="cmedia__ticks" aria-hidden="true">
          {shots.map((_, k) => (
            <span key={k} className={k === i ? "is-on" : ""} />
          ))}
        </span>
      )}
    </div>
  );
}
