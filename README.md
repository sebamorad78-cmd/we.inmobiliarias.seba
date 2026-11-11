# Ribera — sitio web inmobiliario

Sitio público + panel interno para una inmobiliaria. Next.js 16, TypeScript y CSS propio (sin plantillas ni kits de componentes).

## Qué incluye

**Para los clientes**
- Portada con buscador (operación, ubicación o código, tipo y presupuesto).
- Listado con filtros que quedan en la URL (se pueden compartir y volver atrás), orden, paginación y **vista de mapa** con precios.
- Ficha de propiedad: galería a pantalla completa (teclado y gestos), datos clave, ficha técnica, video, recorrido 360°, mapa (zona aproximada si se elige no mostrar la dirección), **simulador de crédito**, propiedades similares y una versión imprimible ("Ficha PDF").
- Contacto en cada ficha: WhatsApp con el código de la propiedad, llamada, consulta o **pedido de visita** con día y horario.
- **Favoritos** y **comparador** (hasta 4 propiedades, resalta el mejor valor de cada fila), sin registrarse.
- "Avisarme cuando entre": el cliente deja su búsqueda y el equipo recibe la consulta.
- Tasaciones, Nosotros (equipo con matrícula) y Contacto.
- SEO: metadatos por página, Open Graph, sitemap, robots y datos estructurados (RealEstateListing, RealEstateAgent, Breadcrumbs).
- Accesibilidad: navegación por teclado, foco visible, etiquetas, "saltar al contenido" y respeto por "reducir movimiento".

**Para el equipo (`/panel`)**
- Resumen: publicadas, reservadas, consultas nuevas, propiedades más consultadas y avisos de publicaciones incompletas.
- Propiedades: alta y edición con fotos (arrastrar y soltar, compresión automática, reordenar, portada, descripción de cada foto), ubicación en mapa con búsqueda de dirección, comodidades, estado y asesor a cargo. Cambio de estado desde la tabla.
- Consultas: bandeja con estados, asignación, notas internas, historial del cliente, respuesta por WhatsApp o email y exportación a CSV (Excel / Sheets).
- Equipo: usuarios con rol administrador o agente; un agente ve sus consultas y las sin asignar.
- Seguridad: contraseñas con scrypt, sesiones firmadas (HttpOnly), límite de intentos de ingreso, protección anti-spam en formularios (campo trampa, tiempo mínimo y límite por IP) y cabeceras de seguridad.

## Puesta en marcha local

Requiere Node.js 20.9 o superior.

```bash
npm install
```

```bash
cp .env.example .env.local
```

Completá `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `.env.local` y luego:

```bash
npm run dev
```

- Sitio: http://localhost:3000
- Panel: http://localhost:3000/panel (ingresá con `ADMIN_EMAIL` / `ADMIN_PASSWORD`; el administrador se crea en el primer ingreso).

Sin base de datos configurada, los datos se guardan en `data/db.json` (se crea solo, con propiedades de ejemplo) y las fotos en `public/uploads/`.

## Publicar en Cloudflare

El proyecto ya está preparado para Cloudflare Workers (adaptador OpenNext, `wrangler.jsonc`).

**Opción A: desde el panel de Cloudflare (recomendada)**
1. Cloudflare → *Workers & Pages* → *Create* → *Import a repository* → elegir este repositorio de GitHub.
2. Comando de build: `npx opennextjs-cloudflare build`. Comando de deploy: `npx opennextjs-cloudflare deploy`.
3. En *Settings → Variables and Secrets* cargar `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `NEXT_PUBLIC_SITE_URL`.
4. Cada vez que se sube un cambio a la rama elegida, Cloudflare publica solo.

**Opción B: desde la terminal**

```bash
npx wrangler login
```

```bash
npm run deploy
```

Sin base de datos, el sitio publicado funciona en **modo demostración**: se ve y se navega completo, pero las consultas y propiedades nuevas se guardan en memoria y se pierden al reiniciarse. Para uso real:

1. Crear un proyecto en [Supabase](https://supabase.com) y ejecutar `supabase/schema.sql` en el SQL Editor.
2. Agregar `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` a las variables del sitio.
3. Opcional: `RESEND_API_KEY`, `LEADS_NOTIFY_EMAIL`, `LEADS_FROM_EMAIL` para recibir cada consulta por email.

Probar localmente igual que en Cloudflare: `npm run preview:cf` (las variables van en `.dev.vars`).

## Personalizar la marca

Todo lo institucional está en `src/site.config.ts`: nombre, razón social, teléfono, WhatsApp, email, dirección, horario, **matrícula del corredor** (obligatoria en CABA), redes y las cifras de la portada (usar solo datos reales).

Colores y tipografías: variables al inicio de `src/styles/base.css`.

## Estructura

```
src/
  site.config.ts        datos de la inmobiliaria
  app/(site)/           sitio público
  app/panel/            panel interno (actions.ts = todas las operaciones)
  components/           componentes de interfaz
  lib/data/             acceso a datos: archivo local o Supabase (misma interfaz)
  lib/catalog.ts        lo que el público puede ver (oculta borradores y direcciones privadas)
  lib/filters.ts        búsqueda y filtros
  styles/               estilos (base, sitio, panel)
supabase/schema.sql     esquema de base de datos
```
