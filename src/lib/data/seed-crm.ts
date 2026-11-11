import { addDays, arDayKey, fromArLocal } from "../crm";
import type { Activity, Contact, Contract, Deal, Property, Task } from "../types";

/**
 * Datos de demostración del CRM, siempre relativos a "hoy":
 * la agenda de la semana, los vencimientos y las alertas se ven vivos en cualquier fecha.
 */
export function seedCrm(properties: Property[]) {
  const today = arDayKey();
  const at = (dayOffset: number, time: string) => fromArLocal(addDays(today, dayOffset), time).toISOString();
  const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
  const has = (id: string) => properties.some((p) => p.id === id);
  const pid = (id: string) => (has(id) ? id : null);

  const c = (
    id: string,
    name: string,
    phone: string,
    email: string,
    kinds: Contact["kinds"],
    source: string,
    assignedTo: string,
    days: number,
    search: Contact["search"] = null,
    notes = "",
  ): Contact => ({
    id,
    name,
    phone,
    email,
    kinds,
    source,
    notes,
    search,
    assignedTo,
    createdAt: ago(days),
    updatedAt: ago(Math.max(0, days - 3)),
    lastContactAt: ago(Math.max(0, Math.floor(days / 3))),
  });

  const contacts: Contact[] = [
    c("ct_jgarcia", "Julián García", "11 5523-8841", "julian.garcia@mail.com", ["comprador"], "Web", "usr_mlopez", 12, {
      operation: "venta", types: ["casa"], zones: ["San Isidro", "Martínez", "Vicente López"], maxPrice: 1500000, currency: "USD", minRooms: 5,
      notes: "Familia con tres hijos. Necesita jardín y cerca de colegios bilingües.",
    }, "Vende su departamento en Belgrano para comprar. Decide con su esposa, Paula."),
    c("ct_lrivas", "Lucía Rivas", "11 6034-1297", "lucia.rivas@mail.com", ["comprador"], "Portal", "usr_sbenitez", 6, {
      operation: "venta", types: ["departamento", "ph"], zones: ["Palermo", "Colegiales", "Belgrano"], maxPrice: 360000, currency: "USD", minRooms: 3,
      notes: "Primera vivienda. Opera con crédito hipotecario: buscar apto crédito.",
    }),
    c("ct_mferraro", "Marcelo Ferraro", "11 4417-9032", "mferraro@estudioferraro.com.ar", ["propietario"], "Referido", "usr_fquiroga", 60, null,
      "Propietario del piso de Av. Alvear. Prefiere que lo llamen después de las 18 h."),
    c("ct_aotero", "Ana Otero", "11 3388-2245", "ana.otero@mail.com", ["comprador", "inversor"], "WhatsApp", "usr_fquiroga", 3, {
      operation: "venta", types: ["departamento"], zones: ["Puerto Madero", "Recoleta"], maxPrice: 1000000, currency: "USD", minRooms: 3,
      notes: "Compra para renta. Pide cochera y amenities.",
    }),
    c("ct_hsosa", "Hernán Sosa", "2268 44-1190", "hernan.sosa@campo.com.ar", ["comprador"], "Cartel", "usr_rbazzigalupi", 2, {
      operation: "venta", types: ["quinta", "terreno"], zones: ["General Pirán", "Mar Chiquita", "Pilar"], maxPrice: null, currency: "USD", minRooms: null,
      notes: "Busca campo chico con galpón para guardar maquinaria. Pregunta por trifásica.",
    }),
    c("ct_cdominguez", "Carolina Domínguez", "11 5876-3310", "caro.dominguez@mail.com", ["inquilino"], "Portal", "usr_avera", 9, {
      operation: "alquiler", types: ["departamento"], zones: ["Palermo", "Belgrano"], maxPrice: 2000000, currency: "ARS", minRooms: 3,
      notes: "Se muda en 30 días. Tiene garantía propietaria en CABA.",
    }),
    c("ct_rpaz", "Roberto Paz", "11 4789-6612", "roberto.paz@mail.com", ["propietario"], "Oficina", "usr_mlopez", 120, null,
      "Propietario de la casa de Vicente López (alquilada). Cobra por transferencia."),
    c("ct_vmorales", "Valeria Morales", "11 6122-0458", "vale.morales@mail.com", ["inquilino"], "Web", "usr_avera", 200, null,
      "Inquilina de Cerviño 3700. Siempre paga en término."),
    c("ct_dlynch", "Diego Lynch", "11 5590-7781", "dlynch@lynchsa.com", ["inversor"], "Referido", "usr_fquiroga", 30, {
      operation: "alquiler", types: ["oficina"], zones: ["Retiro", "Puerto Madero"], maxPrice: 12000, currency: "USD", minRooms: null,
      notes: "Empresa de 40 personas. Necesita al menos 4 cocheras.",
    }),
    c("ct_sacosta", "Sebastián Acosta", "11 3021-5547", "sacosta@mail.com", ["propietario"], "Web", "usr_sbenitez", 4, null,
      "Pidió tasación de un 3 ambientes en Núñez. Quiere vender para comprar más grande."),
    c("ct_fnunez", "Florencia Núñez", "11 4456-8820", "flor.nunez@mail.com", ["comprador"], "Redes", "usr_sbenitez", 1, {
      operation: "venta", types: ["departamento"], zones: ["Belgrano", "Núñez", "Colegiales"], maxPrice: 180000, currency: "USD", minRooms: 2,
      notes: "",
    }),
    c("ct_druiz", "Daniel Ruiz", "11 4123-7788", "druiz@mail.com", ["comprador"], "Referido", "usr_mlopez", 40, null, "Compra la casa de estilo inglés en Martínez. Paga con venta propia ya escriturada."),
    c("ct_pibarra", "Pablo Ibarra", "11 6677-1203", "pablo.ibarra@mail.com", ["inquilino"], "Portal", "usr_avera", 160, null, "Inquilino de la casa de Vicente López."),
  ];

  let n = 0;
  const t = (
    type: Task["type"],
    title: string,
    dueAt: string,
    o: Partial<Task> = {},
  ): Task => ({
    id: `tk_demo_${++n}`,
    type,
    title,
    dueAt,
    durationMin: type === "llamado" ? 15 : type === "tarea" ? 30 : 60,
    contactId: null,
    propertyId: null,
    leadId: null,
    assignedTo: null,
    status: "pendiente",
    outcome: "",
    notes: "",
    createdAt: ago(5),
    completedAt: null,
    ...o,
  });

  const tasks: Task[] = [
    // Ayer
    t("visita", "Visita casa racionalista con familia García", at(-1, "17:00"), { contactId: "ct_jgarcia", propertyId: pid("prop_001"), assignedTo: "usr_mlopez", status: "hecha", completedAt: at(-1, "18:10"), outcome: "Les encantó el jardín. Piden segunda visita con el arquitecto." }),
    t("llamado", "Llamar a Marcelo Ferraro: devolución de visitas", at(-1, "18:30"), { contactId: "ct_mferraro", propertyId: pid("prop_002"), assignedTo: "usr_fquiroga" }),
    // Hoy
    t("llamado", "Responder consulta de Florencia Núñez", at(0, "09:30"), { contactId: "ct_fnunez", assignedTo: "usr_sbenitez" }),
    t("visita", "Visita PH Palermo con Lucía Rivas", at(0, "11:00"), { contactId: "ct_lrivas", propertyId: pid("prop_005"), assignedTo: "usr_sbenitez", notes: "Llevar planos y el informe de expensas." }),
    t("tasacion", "Tasación 3 ambientes en Núñez", at(0, "15:00"), { contactId: "ct_sacosta", assignedTo: "usr_sbenitez", durationMin: 90 }),
    t("llamado", "Hernán Sosa: coordinar visita a la quinta", at(0, "16:30"), { contactId: "ct_hsosa", propertyId: pid("prop_015"), assignedTo: "usr_rbazzigalupi" }),
    t("tarea", "Pedir informe de dominio para reserva Puerto Madero", at(0, "18:00"), { propertyId: pid("prop_003"), contactId: "ct_aotero", assignedTo: "usr_fquiroga" }),
    // Mañana
    t("visita", "Segunda visita casa racionalista con arquitecto", at(1, "10:00"), { contactId: "ct_jgarcia", propertyId: pid("prop_001"), assignedTo: "usr_mlopez" }),
    t("visita", "Visita departamento Palermo Chico con Carolina", at(1, "12:30"), { contactId: "ct_cdominguez", propertyId: pid("prop_008"), assignedTo: "usr_avera" }),
    t("reunion", "Reunión con Diego Lynch: oficinas Catalinas", at(1, "16:00"), { contactId: "ct_dlynch", propertyId: pid("prop_010"), assignedTo: "usr_fquiroga" }),
    // Esta semana
    t("firma", "Firma de boleto: semipiso Puerto Madero", at(2, "11:00"), { contactId: "ct_aotero", propertyId: pid("prop_003"), assignedTo: "usr_fquiroga", durationMin: 120, notes: "Escribanía Martínez Paz, Av. Callao 1100, 4.º B." }),
    t("visita", "Visita a la quinta de General Pirán", at(3, "10:00"), { contactId: "ct_hsosa", propertyId: pid("prop_015"), assignedTo: "usr_rbazzigalupi", durationMin: 120 }),
    t("llamado", "Aviso de actualización de alquiler a Valeria Morales", at(3, "12:00"), { contactId: "ct_vmorales", assignedTo: "usr_avera" }),
    t("tarea", "Renovar fotos del dúplex Colegiales", at(4, "09:00"), { propertyId: pid("prop_014"), assignedTo: "usr_sbenitez" }),
    t("visita", "Visita dos ambientes Belgrano con Florencia", at(4, "18:00"), { contactId: "ct_fnunez", propertyId: pid("prop_006"), assignedTo: "usr_sbenitez" }),
  ];

  const d = (
    id: string,
    title: string,
    contactId: string,
    propertyId: string,
    stage: Deal["stage"],
    value: number,
    currency: Deal["currency"],
    commissionPct: number,
    assignedTo: string,
    days: number,
    operation: Deal["operation"] = "venta",
  ): Deal => ({
    id,
    title,
    contactId,
    propertyId: pid(propertyId),
    operation,
    stage,
    value,
    currency,
    commissionPct,
    assignedTo,
    expectedClose: addDays(today, 20 + days),
    lostReason: "",
    createdAt: ago(days + 10),
    updatedAt: ago(days),
  });

  const deals: Deal[] = [
    d("dl_garcia", "García · Casa racionalista San Isidro", "ct_jgarcia", "prop_001", "visita", 1450000, "USD", 3, "usr_mlopez", 1),
    d("dl_rivas", "Rivas · PH Palermo", "ct_lrivas", "prop_005", "interesado", 345000, "USD", 3, "usr_sbenitez", 2),
    d("dl_otero", "Otero · Semipiso Puerto Madero", "ct_aotero", "prop_003", "reserva", 705000, "USD", 3, "usr_fquiroga", 1),
    d("dl_lynch", "Lynch S.A. · Oficinas Catalinas", "ct_dlynch", "prop_010", "oferta", 9800, "USD", 8, "usr_fquiroga", 4, "alquiler"),
    d("dl_dominguez", "Domínguez · 3 amb. Palermo Chico", "ct_cdominguez", "prop_008", "interesado", 1900000, "ARS", 4.15, "usr_avera", 3, "alquiler"),
    d("dl_sosa", "Sosa · Quinta General Pirán", "ct_hsosa", "prop_015", "interesado", 0, "USD", 3, "usr_rbazzigalupi", 0),
    d("dl_martinez", "Ruiz · Casa estilo inglés Martínez", "ct_druiz", "prop_007", "boleto", 680000, "USD", 3, "usr_mlopez", 6),
    {
      ...d("dl_cerrada1", "Benítez · Dos ambientes Colegiales", "ct_fnunez", "prop_014", "cerrada", 158000, "USD", 3, "usr_sbenitez", 18),
      propertyId: null,
      contactId: null,
      title: "Operación cerrada · 2 amb. Colegiales (vendido)",
    },
    { ...d("dl_perdida", "Ferraro · Comprador desistió", "ct_mferraro", "prop_002", "perdida", 950000, "USD", 3, "usr_fquiroga", 9), lostReason: "El comprador consiguió algo más barato en Barrio Norte." },
  ];
  // La quinta no tiene precio publicado: sin valor no se suma al embudo.
  deals.find((x) => x.id === "dl_sosa")!.value = null;

  let a = 0;
  const act = (kind: Activity["kind"], text: string, daysAgo: number, o: Partial<Activity> = {}): Activity => ({
    id: `ac_demo_${++a}`,
    at: ago(daysAgo),
    kind,
    text,
    contactId: null,
    propertyId: null,
    dealId: null,
    userId: null,
    ...o,
  });

  const activities: Activity[] = [
    act("sistema", "Consulta desde la web por Casa racionalista con jardín y pileta (RB-1041).", 12, { contactId: "ct_jgarcia", propertyId: pid("prop_001") }),
    act("llamado", "Primera llamada. Buscan casa de 4 dormitorios, presupuesto hasta USD 1,5 M. Venden en Belgrano.", 11, { contactId: "ct_jgarcia", userId: "usr_mlopez" }),
    act("visita", "Visitaron la casa racionalista. Muy interesados, piden segunda visita con el arquitecto.", 1, { contactId: "ct_jgarcia", propertyId: pid("prop_001"), userId: "usr_mlopez" }),
    act("whatsapp", "Le envié 3 propiedades que coinciden con su búsqueda.", 5, { contactId: "ct_lrivas", userId: "usr_sbenitez" }),
    act("nota", "Pre-aprobación del crédito hipotecario por USD 220.000 en Banco Ciudad.", 3, { contactId: "ct_lrivas", userId: "usr_sbenitez" }),
    act("llamado", "Ofreció USD 690.000. El propietario contraofertó USD 705.000 y aceptó.", 4, { contactId: "ct_aotero", propertyId: pid("prop_003"), userId: "usr_fquiroga" }),
    act("nota", "Seña de USD 20.000 depositada en la escribanía. Reserva firmada por 15 días.", 1, { contactId: "ct_aotero", propertyId: pid("prop_003"), userId: "usr_fquiroga" }),
    act("llamado", "Vio el cartel en la ruta. Pregunta por la trifásica y el estado del galpón.", 2, { contactId: "ct_hsosa", propertyId: pid("prop_015"), userId: "usr_rbazzigalupi" }),
    act("email", "Envié propuesta: 24 meses, primer año fijo, cochera incluida.", 4, { contactId: "ct_dlynch", propertyId: pid("prop_010"), userId: "usr_fquiroga" }),
    act("nota", "Prefiere que lo llamen después de las 18 h.", 50, { contactId: "ct_mferraro", userId: "usr_fquiroga" }),
    act("sistema", "Pedido de tasación desde la web: 3 ambientes, 72 m², Núñez.", 4, { contactId: "ct_sacosta" }),
  ];

  const contracts: Contract[] = [
    {
      id: "co_cervino",
      propertyId: pid("prop_008"),
      propertyLabel: "Cerviño 3700, 7.º · Palermo",
      tenantId: "ct_vmorales",
      ownerId: "ct_mferraro",
      start: addDays(today, -355),
      end: addDays(today, 375),
      rent: 1650000,
      currency: "ARS",
      adjustIndex: "ICL",
      adjustEveryMonths: 6,
      payDay: 10,
      deposit: 1650000,
      notes: "Administración completa: cobro, liquidación y mantenimiento.",
      active: true,
      createdAt: ago(355),
    },
    {
      id: "co_vlopez",
      propertyId: pid("prop_009"),
      propertyLabel: "Casa Barrio Las Flores · Vicente López",
      tenantId: "ct_pibarra",
      ownerId: "ct_rpaz",
      start: addDays(today, -670),
      end: addDays(today, 60),
      rent: 2900000,
      currency: "ARS",
      adjustIndex: "IPC",
      adjustEveryMonths: 3,
      payDay: 5,
      deposit: 2600000,
      notes: "El inquilino quiere renovar. Hablar con el propietario por el nuevo valor.",
      active: true,
      createdAt: ago(670),
    },
    {
      id: "co_loft",
      propertyId: pid("prop_012"),
      propertyLabel: "Loft Defensa 900 · San Telmo",
      tenantId: null,
      ownerId: "ct_rpaz",
      start: addDays(today, -80),
      end: addDays(today, 100),
      rent: 1400,
      currency: "USD",
      adjustIndex: "Fijo",
      adjustEveryMonths: 0,
      payDay: 1,
      deposit: 1400,
      notes: "Temporario a ejecutivo extranjero. Incluye expensas y servicios.",
      active: true,
      createdAt: ago(80),
    },
  ];

  // Datos internos de algunas propiedades: propietario y autorización.
  for (const p of properties) {
    if (p.id === "prop_002") Object.assign(p, { ownerContactId: "ct_mferraro", mandate: { kind: "exclusiva", expires: addDays(today, 18), commissionPct: 3 } });
    if (p.id === "prop_001") Object.assign(p, { mandate: { kind: "exclusiva", expires: addDays(today, 95), commissionPct: 3 } });
    if (p.id === "prop_014") Object.assign(p, { mandate: { kind: "compartida", expires: addDays(today, -4), commissionPct: 3 } });
    if (p.id === "prop_015") Object.assign(p, { mandate: { kind: "exclusiva", expires: addDays(today, 150), commissionPct: 3 } });
  }

  return { contacts, tasks, deals, activities, contracts };
}
