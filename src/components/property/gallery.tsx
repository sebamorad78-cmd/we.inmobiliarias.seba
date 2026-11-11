"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PropertyImage } from "@/lib/types";
import { Icon } from "../icon";
import { Photo } from "../photo";

/** Mosaico de portada + visor a pantalla completa con teclado, gestos y contador. */
export function Gallery({ images, title }: { images: PropertyImage[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [stripIndex, setStripIndex] = useState(0);
  const count = images.length;

  const open = (i: number) => setIndex(i);
  const close = useCallback(() => setIndex(null), []);
  const go = useCallback((d: number) => setIndex((i) => (i == null ? i : (i + d + count) % count)), [count]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (index != null && !dlg.open) dlg.showModal();
    if (index == null && dlg.open) dlg.close();
  }, [index]);

  useEffect(() => {
    if (index == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  if (!count) return <div className="gallery gallery--empty media" />;

  const tiles = images.slice(0, 5);

  return (
    <>
      <div className={`gallery gallery--${Math.min(tiles.length, 5)}`}>
        {tiles.map((img, i) => (
          <button
            key={img.url + i}
            type="button"
            className="gallery__tile"
            onClick={() => open(i)}
            aria-label={`Ver foto ${i + 1} de ${count}: ${img.alt}`}
          >
            <Photo
              src={img.url}
              alt={img.alt}
              fill
              priority={i === 0}
              quality={90}
              sizes={i === 0 ? "(max-width: 760px) 1px, 60vw" : "(max-width: 760px) 1px, 25vw"}
              label={title}
            />
          </button>
        ))}
        <button type="button" className="btn btn--light btn--s gallery__all" onClick={() => open(0)}>
          <Icon name="photos" size={16} /> Ver las {count} fotos
        </button>
      </div>

      {/* Celular: tira deslizable con todas las fotos */}
      <div className="gstrip">
        <div
          className="gstrip__track"
          ref={strip}
          onScroll={(e) => {
            const el = e.currentTarget;
            const k = Math.round(el.scrollLeft / el.clientWidth);
            if (k !== stripIndex) setStripIndex(k);
          }}
        >
          {images.map((img, i) => (
            <button key={img.url + i} type="button" className="gstrip__item" onClick={() => open(i)} aria-label={`Ampliar foto ${i + 1} de ${count}`}>
              <Photo src={img.url} alt={img.alt} fill priority={i === 0} quality={90} sizes="(max-width: 760px) 100vw, 1px" label={title} />
            </button>
          ))}
        </div>
        <span className="gstrip__count num" aria-hidden="true">
          {stripIndex + 1} / {count}
        </span>
      </div>

      <dialog
        ref={dialogRef}
        className="lightbox"
        aria-label={`Fotos de ${title}`}
        onClose={close}
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        {index != null && (
          <div
            className="lightbox__stage"
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current == null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
              touchX.current = null;
            }}
          >
            <div className="lightbox__top">
              <span className="num">
                {index + 1} / {count}
              </span>
              <span className="lightbox__caption">{images[index].alt}</span>
              <button type="button" className="icon-btn" onClick={close} aria-label="Cerrar" autoFocus>
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="lightbox__img">
              <Image
                key={images[index].url}
                src={images[index].url}
                alt={images[index].alt}
                fill
                sizes="100vw"
                quality={90}
                style={{ objectFit: "contain" }}
              />
            </div>
            {count > 1 && (
              <>
                <button type="button" className="lightbox__nav lightbox__nav--prev icon-btn" onClick={() => go(-1)} aria-label="Foto anterior">
                  <Icon name="chevronLeft" size={22} />
                </button>
                <button type="button" className="lightbox__nav lightbox__nav--next icon-btn" onClick={() => go(1)} aria-label="Foto siguiente">
                  <Icon name="chevronRight" size={22} />
                </button>
              </>
            )}
            <div className="lightbox__thumbs">
              {images.map((img, i) => (
                <button key={img.url + i} type="button" onClick={() => setIndex(i)} aria-current={i === index} aria-label={`Foto ${i + 1}`}>
                  <Image src={img.url} alt="" width={96} height={64} quality={70} />
                </button>
              ))}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
