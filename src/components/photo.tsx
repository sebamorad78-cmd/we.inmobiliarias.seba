"use client";

import type { ImageProps } from "next/image";
import { Img as Image } from "./img";
import { useState } from "react";

/**
 * Imagen optimizada (AVIF/WebP, tamaños responsivos) con respaldo elegante
 * si la URL falla: nunca se ve un ícono de imagen rota.
 */
export function Photo({ className, label, ...props }: ImageProps & { label?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`media ${className ?? ""}`}>
      {failed ? (
        <span className="media__fallback" aria-hidden="true">
          {label ?? "Ribera"}
        </span>
      ) : (
        <Image {...props} alt={props.alt} onError={() => setFailed(true)} />
      )}
    </div>
  );
}
