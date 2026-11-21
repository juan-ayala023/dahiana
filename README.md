# 🌸 Florece

App de finanzas personales mobile-first, cálida y privada. Hecha con Next.js 15, Supabase y mucho cariño.

> Este README se completa en la fase 7. Por ahora cubre el setup de la fase 1.

## Stack

Next.js 15 (App Router) · TypeScript estricto · Tailwind CSS v4 · componentes estilo shadcn/ui · Framer Motion · Supabase (Auth + Postgres + RLS) · Zod · Server Actions.

## Setup local

1. **Instala dependencias**
   ```bash
   npm install
   ```
2. **Crea el proyecto en Supabase** → [supabase.com](https://supabase.com) → New project.
3. **Base de datos**: abre *SQL Editor*, pega todo `supabase/schema.sql` y dale *Run*. Es idempotente.
4. **Cuenta de la dueña**: Supabase → Authentication → Users → *Add user* → *Create new user*, con un correo cualquiera, una contraseña larga aleatoria y *Auto Confirm User* activado.
5. **Variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API).
   - `OWNER_EMAIL` y `OWNER_PASSWORD`: los de la cuenta del paso 4.
   - `ACCESS_KEY`: una clave aleatoria larga, por ejemplo
     `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`.
6. **Arranca**
   ```bash
   npm run dev
   ```
   Abre `http://localhost:3000/entrar/<ACCESS_KEY>` una vez. Desde ahí la app entra directo.

## Pruebas

```bash
npm test   # cálculos financieros (período, "hoy puedes gastar", metas)
```

## Acceso sin login (una sola usuaria)

- No hay correo, código ni contraseña para ella: abre su **enlace personal** (`/entrar/<ACCESS_KEY>`) una vez por dispositivo y la sesión queda guardada.
- Las credenciales de la cuenta viven solo en el servidor (variables sin `NEXT_PUBLIC_`).
- Sin el enlace, la app solo muestra "Esta app es privada".
- ¿Enlace filtrado? Cambia `ACCESS_KEY` (y `OWNER_PASSWORD` en Supabase y en el env) y vuelve a desplegar.
- Todas las tablas tienen Row Level Security: cada fila solo es visible para su dueña.

## Estructura

```
app/(auth)/login     pantalla "app privada" para quien no tiene sesión
app/entrar/[key]     enlace personal que abre la sesión
app/(app)            rutas autenticadas
components/ui        primitivas (botón, input, card…)
components/features  piezas por módulo
lib/supabase         clientes de navegador, servidor y middleware
lib/finance          cálculos financieros puros
supabase/schema.sql  esquema completo
```
