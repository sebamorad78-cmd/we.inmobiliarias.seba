import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap notfound">
      <p className="eyebrow">Error 404</p>
      <h1 className="h1">No encontramos esta página</h1>
      <p className="lead">Si buscabas una propiedad, puede que ya se haya vendido o alquilado.</p>
      <div className="row" style={{ flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/propiedades" className="btn">Ver propiedades disponibles</Link>
        <Link href="/" className="btn btn--ghost">Ir al inicio</Link>
      </div>
    </main>
  );
}
