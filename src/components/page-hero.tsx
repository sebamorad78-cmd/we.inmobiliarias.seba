import Link from "next/link";
import { Img } from "@/components/img";

/** Encabezado de página con una foto de propiedad de fondo y el título encima. */
export function PageHero({
  title,
  sub,
  image,
  position = "50% 50%",
  caption,
}: {
  title: string;
  sub?: string;
  image: string;
  position?: string;
  /** Pie de foto: qué propiedad es y link a su ficha. */
  caption?: { label: string; href: string };
}) {
  return (
    <section className="phead">
      <Img
        src={image}
        alt=""
        fill
        preload
        fetchPriority="high"
        sizes="100vw"
        quality={80}
        className="phead__img"
        style={{ objectPosition: position }}
      />
      <div className="phead__shade" />
      <div className="wrap phead__inner">
        <h1 className="phead__title">{title}</h1>
        {sub && <p className="phead__sub">{sub}</p>}
      </div>
      {caption && (
        <Link href={caption.href} className="phead__cap">
          {caption.label} · <span>Ver propiedad</span>
        </Link>
      )}
    </section>
  );
}
