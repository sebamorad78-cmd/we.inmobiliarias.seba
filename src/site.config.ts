/**
 * Datos institucionales de la inmobiliaria.
 * Todo lo que es "marca" vive acá: cambiar estos valores actualiza
 * encabezado, pie, SEO, botones de WhatsApp y datos estructurados.
 */
export const site = {
  name: "Ribera",
  legalName: "Ribera Bienes Raíces S.R.L.",
  tagline: "Bienes raíces",
  description:
    "Compra, venta y alquiler de propiedades seleccionadas en Buenos Aires. Tasaciones profesionales, asesoramiento legal y acompañamiento de principio a fin.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "es-AR",
  phone: "+54 11 4000-0000",
  /** Solo dígitos, con código de país. Se usa para wa.me */
  whatsapp: "5491140000000",
  email: "hola@ribera.com.ar",
  address: {
    street: "Av. del Libertador 2400, piso 3",
    city: "Buenos Aires",
    region: "CABA",
    postalCode: "C1425",
    country: "AR",
  },
  geo: { lat: -34.5811, lng: -58.4022 },
  hours: "Lunes a viernes de 9 a 19 h · Sábados de 10 a 14 h",
  /** Matrícula del corredor responsable (obligatoria en CABA, Ley 2340). */
  license: "Corredor responsable: Mat. CUCICBA N.º 0000",
  /** Cifras de la home. Usar solo datos reales y verificables. */
  stats: [
    { value: "22", label: "años en el mercado" },
    { value: "1.800+", label: "operaciones cerradas" },
    { value: "74", label: "días promedio de venta" },
    { value: "48 h", label: "para entregar una tasación" },
  ],
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
  social: {
    instagram: "https://instagram.com/",
    linkedin: "https://linkedin.com/",
    youtube: "",
  },
} as const;

export type Site = typeof site;
