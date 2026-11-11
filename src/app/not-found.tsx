import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap notfound">
      <p className="eyebrow">Error 404</p>
      <h1 className="h1">Esta página <em>ya no está en cartera.</em></h1>
      <p className="lead">Puede que la propiedad se haya vendido o que el enlace tenga un error.</p>
      <div className="row" style={{ flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/propiedades" className="btn">Ver propiedades disponibles</Link>
        <Link href="/" className="btn btn--ghost">Ir al inicio</Link>
      </div>
    </main>
  );
}
