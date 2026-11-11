/**
 * Datos institucionales de la inmobiliaria.
 * Todo lo que es "marca" vive acá: cambiar estos valores actualiza
 * encabezado, pie, SEO, botones de WhatsApp y datos estructurados.
 */
export const site = {
  name: "Rita Bazzigalupi",
  legalName: "Rita Bazzigalupi Propiedades",
  tagline: "Propiedades",
  description:
    "Rita Bazzigalupi, martillera y corredora pública en Ayacucho. Venta y alquiler de campos, quintas, casas y lotes en Ayacucho y la región. Tasaciones y negocios inmobiliarios.",
  /** Dirección pública del sitio. En producción se puede reemplazar con NEXT_PUBLIC_SITE_URL (dominio propio). */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === "production" ? "https://inmobiliaria-web.sebamorad78.workers.dev" : "http://localhost:3000"),
  locale: "es-AR",
  phone: "2268 515648",
  /** Solo dígitos, con código de país. Se usa para wa.me */
  whatsapp: "5492268515648",
  email: "ritabazzigalupi@gmail.com",
  address: {
    street: "San Martín 1539",
    city: "Ayacucho",
    region: "Provincia de Buenos Aires",
    postalCode: "B7150",
    country: "AR",
  },
  geo: { lat: -37.1528, lng: -58.4883 },
  /** Horario de atención. Vacío = no se muestra (completar cuando se confirme). */
  hours: "",
  /** Matrícula de la martillera responsable. */
  license: "Martillera y corredora pública · Tomo III, folio 812, n.º 1468",
  /** Formación y presentación (página Nosotros). */
  bio: "Martillera y corredora pública, egresada de la Universidad FASTA. Desde Ayacucho trabaja en negocios inmobiliarios de la ciudad y la zona: campos, quintas, casas y lotes, con tasaciones y acompañamiento hasta la escritura.",
  /**
   * Valores de referencia (USD por m² cubierto, departamentos usados en buen estado)
   * para el tasador instantáneo de la portada. Actualizarlos cada trimestre.
   */
  valuation: {
    usdPerM2: {
      "Puerto Madero": 5600,
      Recoleta: 3100,
      Palermo: 3050,
      Belgrano: 2950,
      Núñez: 2950,
      Colegiales: 2750,
      "San Telmo": 2150,
      Retiro: 2900,
      "San Isidro": 2650,
      Martínez: 2550,
      "Vicente López": 2700,
      Nordelta: 2600,
      Pilar: 1900,
    } as Record<string, number>,
    /** Ajuste por tipo de propiedad sobre el valor de departamento. */
    typeFactor: { departamento: 1, casa: 0.88, ph: 0.86, oficina: 0.95 } as Record<string, number>,
    /** Amplitud del rango mostrado (±). */
    spread: 0.08,
  },
  /** Redes: vacías no se muestran. */
  social: {
    instagram: "",
    facebook: "",
    linkedin: "",
  },
} as const;

export type Site = typeof site;
