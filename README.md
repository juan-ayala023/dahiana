# 🌸 Florece

App de finanzas personales **mobile-first**, cálida y privada, hecha para una sola persona en Colombia (COP, es-CO, America/Bogota). Enseña a manejar el dinero de forma fácil, bonita y motivadora.

**Producción:** https://dahiana.vercel.app · se abre con un enlace personal (ver [Acceso sin login](#acceso-sin-login)).

---

## ✨ Qué hace

| Módulo | Ruta | Qué incluye |
|---|---|---|
| Bienvenida | `/bienvenida` | Onboarding en 5 pasos: nombre y avatar, frecuencia y días de pago, ingreso estimado, gastos fijos y primera meta. |
| Inicio | `/inicio` | "Hoy puedes gastar", resumen del mes, racha, Escuelita, insights (gastos hormiga y comparación con el mes anterior), dona por categoría, últimos movimientos, mini jardín y tip del día. |
| Registro rápido | botón **+** | Teclado propio, categorías con emoji, nota y fecha opcionales. 3 toques, UI optimista y vibración. |
| Movimientos | `/movimientos` | Agrupados por día, por mes, con filtros por tipo y categoría, buscador y swipe para editar o eliminar. |
| Mi Jardín | `/jardin` | Metas como flores SVG en 5 etapas, abonos con animación de riego, "ahorra $X por quincena", celebración con confeti. |
| Presupuesto | `/presupuesto` | Regla 50/30/20 visual, límites por categoría (verde, durazno o coral), alerta suave al pasar el 80% y gastos fijos con "Marcar pagado". |
| Escuelita | `/escuelita` | 8 microlecciones tipo historias con quiz de 3 preguntas y progreso guardado. |
| Logros | `/logros` | Racha de días registrando, calendario de 28 días y 9 insignias. |
| Perfil | `/perfil` | Editar datos, categorías (crear, editar, eliminar), tema claro/oscuro/sistema, exportar CSV, instalar la app y cerrar sesión. |

## 🧱 Stack

- **Next.js 15** (App Router, Server Components, Server Actions) + **TypeScript estricto** (`noUncheckedIndexedAccess`).
- **Tailwind CSS v4** (tokens en `app/globals.css` con `@theme`) y componentes propios estilo **shadcn/ui** en `components/ui`.
- **Framer Motion**, **Recharts**, **canvas-confetti**, **lucide-react**, **sonner**.
- **Supabase**: Postgres, Auth y Row Level Security, vía `@supabase/ssr`.
- **Zod** para validar todo lo que llega al servidor. **date-fns** con locale `es`.
- **PWA**: `app/manifest.ts`, íconos, meta tags iOS y modo standalone.
- Deploy en **Vercel**.

## 🚀 Setup local

1. **Dependencias**
   ```bash
   npm install
   ```
2. **Supabase**: crea un proyecto en [supabase.com](https://supabase.com). Abre *SQL Editor*, pega **todo** `supabase/schema.sql` y dale *Run*. El script es idempotente y crea:
   - 9 tablas con `user_id` y RLS (`auth.uid() = user_id`)
   - FK compuestas (`id, user_id`) para que nadie pueda referenciar filas ajenas
   - el trigger que crea el perfil y las 13 categorías por defecto
   - las vistas de resumen mensual y avance de metas
   - los índices y los `GRANT` explícitos para el rol `authenticated`
3. **Cuenta de la dueña**: Supabase → Authentication → Users → *Add user* → *Create new user*. Usa cualquier correo (puede ser interno, como `nombre@florece.app`), una contraseña larga aleatoria y marca *Auto Confirm User*.
4. **Variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   | Variable | Dónde | Tipo |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | pública |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave *publishable* / *anon* | pública (la protege el RLS) |
   | `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` o la URL de Vercel | pública |
   | `OWNER_EMAIL` / `OWNER_PASSWORD` | la cuenta del paso 3 | **secreta** |
   | `ACCESS_KEY` | `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"` | **secreta** |

   Nunca uses la clave `service_role` en la app.
5. **Arranca**
   ```bash
   npm run dev
   ```
   Abre `http://localhost:3000/entrar/<ACCESS_KEY>` una vez (idealmente con la vista móvil del navegador a 390 px). La primera vez verás el onboarding.

## ☁️ Deploy en Vercel

1. Sube el repo a GitHub y en [vercel.com/new](https://vercel.com/new) impórtalo. Vercel detecta Next.js solo.
2. En *Environment Variables* pega el contenido de `.env.local`, con `NEXT_PUBLIC_SITE_URL` apuntando a la URL de producción. Marca `OWNER_EMAIL`, `OWNER_PASSWORD` y `ACCESS_KEY` como *Sensitive*.
3. *Deploy*. Cada push a `main` despliega automáticamente.
4. Usa la URL de producción (`https://<proyecto>.vercel.app`) y no las de cada despliegue: esas tienen la protección de Vercel activada.

## 🔐 Acceso sin login

La app está pensada para **una sola usuaria** y no pide correo ni contraseña:

- Ella abre su **enlace personal** `https://<sitio>/entrar/<ACCESS_KEY>` una vez por dispositivo.
- El servidor inicia sesión con `OWNER_EMAIL` y `OWNER_PASSWORD`, que nunca llegan al navegador. La sesión queda guardada en cookies de Supabase (unos 400 días, se renueva sola).
- Sin el enlace, la app solo muestra "Esta app es privada".
- **iPhone**: la app instalada en la pantalla de inicio no comparte cookies con Safari. Si pide acceso, se pega el enlace en el campo de la pantalla de entrada.
- **¿Se filtró el enlace?** Cambia `ACCESS_KEY` (y, si quieres, `OWNER_PASSWORD` en Supabase y en Vercel) y redespliega: el enlace viejo deja de servir.
- "Cerrar sesión" (en Perfil) pide confirmación, porque para volver hace falta el enlace.

## 📲 Instalar en el celular (PWA)

- **iPhone (Safari):** Compartir → *Agregar a inicio*.
- **Android (Chrome):** Perfil → *Instalar Florece*, o menú ⋮ → *Instalar app*.

Se abre a pantalla completa con su propio ícono. No hay service worker a propósito: la app necesita datos en vivo y así se evitan versiones viejas en caché.

## 🧮 Lógica financiera

Las fórmulas viven en funciones puras de `lib/finance/*.ts`, cubiertas por pruebas:

- **Período** (`period.ts`): va de día de pago a día de pago (quincenal o mensual, con ajuste de fin de mes). Si los ingresos son variables, se usa el mes calendario.
- **Hoy puedes gastar** (`daily.ts`):
  ```
  (ingresos del período − gastos fijos pendientes − ahorro planificado − gastado en el período) / días restantes
  ```
  - Si aún no hay ingresos registrados en el período, usa el estimado, marcado como tal.
  - Los gastos fijos que ya vencieron se dan por pagados.
  - El ahorro descontado es el mayor entre lo planificado y lo que ya abonó.
- **Metas** (`goals.ts`): 5 etapas de la flor y cuánto ahorrar por período, redondeado a miles.
- **Presupuesto** (`budget.ts`): regla 50/30/20, umbrales de color y alerta al cruzar el 80% o el 100%.
- **Racha** (`streak.ts`): días consecutivos registrando. Sigue viva si ayer registró aunque hoy todavía no.
- **Insights** (`insights.ts`): gastos hormiga (≥ 5 gastos menores a $20.000 en una categoría) y comparación con el mismo tramo del mes anterior.

Los montos son `BIGINT` en pesos enteros y las fechas, días calendario de Colombia.

```bash
npm test      # 20 pruebas de cálculos financieros (node:test)
npm run lint
npm run build
```

## ♿ Accesibilidad y diseño

- Contraste **WCAG AA** verificado con axe-core en modo claro y oscuro en todas las pantallas principales.
- Áreas táctiles de 44 px o más, `aria-label` en los botones con solo ícono y foco visible.
- Diálogos con `role="dialog"` o `alertdialog`, cierre con Esc y retorno del foco.
- `prefers-reduced-motion` desactiva las animaciones.
- **Modo oscuro** en tonos ciruela y malva (`.dark` en `<html>`), aplicado antes del primer pintado para evitar el destello claro. Las lecciones conservan su paleta pastel (`.light-scope`).
- Tipografía: **Fraunces** (títulos y cifras) y **Nunito** (UI).

## 🗂️ Estructura

```
app/
  (auth)/login           pantalla "app privada" (+ pegar enlace)
  (app)/                 rutas con menú inferior: inicio, movimientos, jardin, presupuesto, escuelita, logros, perfil
  bienvenida/            onboarding
  leccion/[slug]/        lecciones a pantalla completa
  entrar/[key]/          enlace personal → abre la sesión
  api/export/            CSV de movimientos
  manifest.ts, icon.svg, apple-icon.png
components/
  ui/                    primitivas (button, input, sheet, segmented, confirm-dialog, money-input…)
  features/              módulos: transactions, dashboard, garden, budget, school, achievements, profile, onboarding
lib/
  actions/               Server Actions (validadas con Zod)
  data/queries.ts        lecturas del servidor
  finance/               cálculos puros y testeables
  content/               lecciones, tips y logros (en el repo, no en la BD)
  supabase/              clientes de navegador, servidor y middleware
supabase/schema.sql      esquema completo
tests/                   pruebas de lib/finance
```

## 🛠️ Problemas comunes

| Síntoma | Solución |
|---|---|
| "permission denied for table …" | Vuelve a ejecutar `supabase/schema.sql` (incluye los `GRANT`). |
| El enlace lleva a "app privada" con error de servidor | Revisa `OWNER_EMAIL` y `OWNER_PASSWORD` en Vercel y que el usuario exista y esté confirmado. |
| La app instalada en iPhone pide acceso | Pega el enlace personal en la pantalla de entrada (solo la primera vez). |
| Los cambios de variables no se reflejan | En Vercel: *Deployments* → ⋯ → *Redeploy*. |
