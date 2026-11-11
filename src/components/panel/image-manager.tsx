"use client";

import { useRef, useState } from "react";
import { uploadImages } from "@/app/panel/actions";
import type { PropertyImage } from "@/lib/types";
import { Icon } from "../icon";

const MAX_SIDE = 2560;

/** Redimensiona en el navegador antes de subir: menos espera y menos almacenamiento, sin perder calidad visible. */
async function downscale(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 2.5 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function ImageManager({ initial, defaultAlt, error }: { initial: PropertyImage[]; defaultAlt: string; error?: string }) {
  const [images, setImages] = useState<PropertyImage[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function handleFiles(list: FileList | File[]) {
    const files = [...list].filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    setMsg(null);
    const uploaded: string[] = [];
    // De a 4 por tanda: evita límites de tamaño por request y muestra progreso real.
    for (let i = 0; i < files.length; i += 4) {
      setBusy(`Subiendo ${Math.min(i + 4, files.length)} de ${files.length}…`);
      const fd = new FormData();
      for (const f of await Promise.all(files.slice(i, i + 4).map(downscale))) fd.append("files", f);
      const res = await uploadImages(fd);
      if (res.error) {
        setMsg(res.error);
        break;
      }
      uploaded.push(...res.urls);
    }
    setImages((cur) => [...cur, ...uploaded.map((url) => ({ url, alt: defaultAlt }))]);
    setBusy(null);
    if (input.current) input.current.value = "";
  }

  const move = (from: number, to: number) =>
    setImages((cur) => {
      if (to < 0 || to >= cur.length) return cur;
      const next = [...cur];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  return (
    <div className="imgm">
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <div
        className={`imgm__drop ${drag ? "is-drag" : ""}`}
        onDragOver={(e) => {
          if (dragIndex != null) return;
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          if (dragIndex != null) return;
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <Icon name="upload" size={26} />
        <p>
          <strong>Arrastrá las fotos acá</strong> o{" "}
          <button type="button" className="linkbtn" onClick={() => input.current?.click()}>
            elegilas desde tu equipo
          </button>
        </p>
        <p className="tiny muted">JPG, PNG o WebP · hasta 10 MB c/u · se optimizan automáticamente. La primera foto es la portada.</p>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        {busy && <p className="imgm__busy" role="status">{busy}</p>}
      </div>
      {(msg || error) && <p className="field-error" role="alert">{msg || error}</p>}

      {images.length > 0 && (
        <ol className="imgm__list">
          {images.map((img, i) => (
            <li
              key={img.url + i}
              className={`imgm__item ${dragIndex === i ? "is-dragging" : ""}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragIndex != null && dragIndex !== i) {
                  move(dragIndex, i);
                  setDragIndex(i);
                }
              }}
            >
              <div className="imgm__thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url.replace("w=2400", "w=400")} alt="" loading="lazy" />
                {i === 0 && <span className="tag tag--clay imgm__cover">Portada</span>}
              </div>
              <input
                className="input imgm__alt"
                value={img.alt}
                maxLength={160}
                placeholder="Descripción (ej.: Living con vista al jardín)"
                aria-label={`Descripción de la foto ${i + 1}`}
                onChange={(e) => setImages((cur) => cur.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
              />
              <div className="imgm__tools">
                <button type="button" className="icon-btn" onClick={() => move(i, 0)} disabled={i === 0} title="Usar como portada" aria-label="Usar como portada"><Icon name="star" size={15} /></button>
                <button type="button" className="icon-btn" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Mover antes"><Icon name="chevronLeft" size={15} /></button>
                <button type="button" className="icon-btn" onClick={() => move(i, i + 1)} disabled={i === images.length - 1} aria-label="Mover después"><Icon name="chevronRight" size={15} /></button>
                <button type="button" className="icon-btn icon-btn--danger" onClick={() => setImages((cur) => cur.filter((_, j) => j !== i))} aria-label="Quitar foto"><Icon name="trash" size={15} /></button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
