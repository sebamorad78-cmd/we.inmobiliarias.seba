import Link from "next/link";
import type { Property } from "@/lib/types";
import { formatArea, formatPrice } from "@/lib/format";
import { operationLabel, typeLabel } from "@/lib/labels";
import { Icon } from "./icon";
import { Photo } from "./photo";
import { CompareButton, FavoriteButton } from "./shortlist-buttons";

export function PropertyCard({
  p,
  priority = false,
  sizes = "(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw",
}: {
  p: Property;
  priority?: boolean;
  sizes?: string;
}) {
  const cover = p.images[0];
  const area = formatArea(p.coveredArea ?? p.totalArea);
  const isNew = Date.now() - new Date(p.createdAt).getTime() < 7 * 86400000;

  return (
    <article className="pcard" data-op={p.operation} data-type={p.type} data-hood={p.neighborhood} data-price={p.price ?? ""} data-rooms={p.rooms ?? ""}>
      <Link href={`/propiedades/${p.slug}`} className="pcard__link" aria-label={`${p.title}, ${p.neighborhood}`}>
        <div className="pcard__media">
          {cover ? (
            <Photo src={cover.url} alt={cover.alt} fill sizes={sizes} priority={priority} quality={80} label={p.neighborhood} />
          ) : (
            <div className="media" style={{ position: "absolute", inset: 0 }}>
              <span className="media__fallback">{p.neighborhood}</span>
            </div>
          )}
          <div className="pcard__tags">
            <span className="tag tag--dark">{operationLabel[p.operation]}</span>
            {p.status === "reservada" && <span className="tag tag--clay">Reservada</span>}
            {p.status !== "reservada" && isNew && <span className="tag">Nueva</span>}
          </div>
          <span className="pcard__count">
            <Icon name="photos" size={14} /> {p.images.length}
          </span>
        </div>
        <div className="pcard__body">
          <p className="pcard__where">
            {p.neighborhood} <span aria-hidden="true">·</span> {typeLabel[p.type]}
          </p>
          <h3 className="pcard__title">{p.title}</h3>
          <ul className="pcard__facts" aria-label="Características">
            {area && (
              <li>
                <Icon name="area" size={16} /> {area}
              </li>
            )}
            {p.rooms ? (
              <li>
                <Icon name="rooms" size={16} /> {p.rooms} amb.
              </li>
            ) : null}
            {p.bedrooms ? (
              <li>
                <Icon name="bed" size={16} /> {p.bedrooms} dorm.
              </li>
            ) : null}
            {p.bathrooms ? (
              <li>
                <Icon name="bath" size={16} /> {p.bathrooms}
              </li>
            ) : null}
            {p.garages ? (
              <li>
                <Icon name="car" size={16} /> {p.garages}
              </li>
            ) : null}
          </ul>
          <div className="pcard__foot">
            <p className="pcard__price num">{formatPrice(p)}</p>
            <span className="pcard__code">{p.code}</span>
          </div>
        </div>
      </Link>
      <div className="pcard__actions">
        <FavoriteButton id={p.id} title={p.title} />
        <CompareButton id={p.id} />
      </div>
    </article>
  );
}
