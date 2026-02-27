# Oro de Tamar — Documentacion de Rutas y API

## Resumen de Arquitectura

```
src/
├── app/
│   ├── page.tsx                              ← Landing publica
│   ├── layout.tsx                            ← Root layout (ClerkProvider)
│   ├── sign-in/[[...sign-in]]/page.tsx       ← Clerk Sign In
│   ├── sign-up/[[...sign-up]]/page.tsx       ← Clerk Sign Up
│   ├── api/webhooks/clerk/route.ts           ← Webhook Clerk → Supabase
│   └── (admin)/
│       ├── layout.tsx                        ← Auth guard + AdminShell
│       ├── dashboard/page.tsx                ← Dashboard (server component)
│       ├── productos/page.tsx                ← [placeholder]
│       ├── inventario/page.tsx               ← [placeholder]
│       ├── consignaciones/
│       │   ├── page.tsx                      ← [placeholder] lista
│       │   ├── nueva/page.tsx                ← [placeholder] formulario
│       │   └── [id]/page.tsx                 ← [placeholder] detalle
│       ├── pedidos/page.tsx                  ← [placeholder]
│       ├── clientes/page.tsx                 ← [placeholder]
│       ├── ventas-stand/page.tsx             ← [placeholder]
│       └── ruta/page.tsx                     ← [placeholder]
├── proxy.ts                                  ← Clerk proxy (antes middleware)
├── lib/
│   ├── supabase/client.ts                    ← Supabase client (anon key)
│   ├── supabase/server.ts                    ← Supabase server (service role)
│   ├── types/database.ts                     ← Tipos de la BD
│   ├── validations/                          ← Zod schemas (pendiente)
│   └── utils.ts                              ← cn() de shadcn
└── components/
    └── shared/
        ├── sidebar.tsx                       ← Navegacion lateral
        └── admin-shell.tsx                   ← Shell (sidebar + topbar)
```

---

## Rutas Publicas

### `GET /`
**Archivo:** `src/app/page.tsx`
**Auth:** No requiere
**Descripcion:** Landing page de Oro de Tamar. Muestra el nombre de la empresa y un boton contextual:
- Usuario autenticado → link a `/dashboard`
- Usuario no autenticado → boton "Iniciar sesion" (modal de Clerk)

### `GET /sign-in`
**Archivo:** `src/app/sign-in/[[...sign-in]]/page.tsx`
**Auth:** No requiere
**Descripcion:** Renderiza el componente `<SignIn />` de Clerk. La ruta catch-all `[[...sign-in]]` maneja las sub-rutas internas de Clerk (verificacion, MFA, etc).

### `GET /sign-up`
**Archivo:** `src/app/sign-up/[[...sign-up]]/page.tsx`
**Auth:** No requiere
**Descripcion:** Renderiza el componente `<SignUp />` de Clerk. Misma logica catch-all que sign-in.

---

## API Routes

### `POST /api/webhooks/clerk`
**Archivo:** `src/app/api/webhooks/clerk/route.ts`
**Auth:** No requiere (ruta publica en proxy.ts), verificacion por firma Svix
**Env requerida:** `CLERK_WEBHOOK_SIGNING_SECRET`

Sincroniza eventos de usuario de Clerk con la tabla `perfiles` en Supabase.

#### Headers requeridos (enviados por Clerk automaticamente)
| Header | Descripcion |
|--------|-------------|
| `svix-id` | ID unico del evento |
| `svix-timestamp` | Timestamp del evento |
| `svix-signature` | Firma HMAC para verificacion |

#### Eventos manejados

**`user.created`**
- Inserta registro en tabla `perfiles` con rol default `APOYO`
- Setea `publicMetadata.rol = 'APOYO'` en Clerk via `clerkClient`
- Campos: `clerk_id`, `nombre` (first + last name), `email`

**`user.updated`**
- Actualiza `nombre` y `email` en tabla `perfiles`
- Match por `clerk_id`

**`user.deleted`**
- Soft delete: `activo = false` en tabla `perfiles`
- Match por `clerk_id`

#### Respuestas
| Status | Body | Condicion |
|--------|------|-----------|
| 200 | `{ ok: true }` | Evento procesado correctamente |
| 400 | `{ error: "Missing svix headers" }` | Faltan headers de verificacion |
| 400 | `{ error: "Invalid signature" }` | Firma invalida |
| 500 | `{ error: "Missing CLERK_WEBHOOK_SIGNING_SECRET" }` | Env no configurada |

---

## Rutas Protegidas (Admin)

Todas las rutas bajo `(admin)/` estan protegidas por doble barrera:
1. **Proxy** (`src/proxy.ts`): `clerkMiddleware` con `auth.protect()` redirige a sign-in
2. **Layout** (`src/app/(admin)/layout.tsx`): `await auth()` server-side verifica `userId`, redirige a `/sign-in` si no existe

### `GET /dashboard`
**Archivo:** `src/app/(admin)/dashboard/page.tsx`
**Tipo:** Server Component (async)
**Data source:** Vista `v_dashboard` via `createServerSupabase()` (service role key)

Muestra 6 tarjetas con metricas del negocio:

| Metrica | Campo en vista | Formato |
|---------|---------------|---------|
| Consignaciones activas | `consignaciones_activas` | Numero entero |
| Con saldo pendiente | `consignaciones_con_saldo` | Numero entero |
| Saldo pendiente total | `saldo_pendiente_total` | `$X,XXX` (es-MX) |
| Pedidos pendientes | `pedidos_pendientes` | Numero entero |
| Productos stock bajo | `productos_stock_bajo` | Numero entero |
| Ventas de la semana | `ventas_semana` | `$X,XXX` (es-MX) |

### `GET /productos`
**Archivo:** `src/app/(admin)/productos/page.tsx`
**Estado:** Placeholder — "Modulo de productos en construccion"

### `GET /inventario`
**Archivo:** `src/app/(admin)/inventario/page.tsx`
**Estado:** Placeholder — "Modulo de inventario en construccion"

### `GET /consignaciones`
**Archivo:** `src/app/(admin)/consignaciones/page.tsx`
**Estado:** Placeholder — "Modulo de consignaciones en construccion"

### `GET /consignaciones/nueva`
**Archivo:** `src/app/(admin)/consignaciones/nueva/page.tsx`
**Estado:** Placeholder — "Formulario de nueva consignacion en construccion"

### `GET /consignaciones/:id`
**Archivo:** `src/app/(admin)/consignaciones/[id]/page.tsx`
**Estado:** Placeholder — "Detalle de consignacion en construccion"
**Params:** `id` (string) — ID de la consignacion

### `GET /pedidos`
**Archivo:** `src/app/(admin)/pedidos/page.tsx`
**Estado:** Placeholder — "Modulo de pedidos en construccion"

### `GET /clientes`
**Archivo:** `src/app/(admin)/clientes/page.tsx`
**Estado:** Placeholder — "Modulo de clientes en construccion"

### `GET /ventas-stand`
**Archivo:** `src/app/(admin)/ventas-stand/page.tsx`
**Estado:** Placeholder — "Modulo de ventas del stand en construccion"

### `GET /ruta`
**Archivo:** `src/app/(admin)/ruta/page.tsx`
**Estado:** Placeholder — "Modulo de ruta semanal en construccion"

---

## Proxy (antes Middleware)

**Archivo:** `src/proxy.ts`

Next.js 16 renombro `middleware.ts` a `proxy.ts`. Usa `clerkMiddleware` de `@clerk/nextjs/server`.

### Rutas publicas (sin auth)
```
/
/sign-in(.*)
/sign-up(.*)
/api/webhooks(.*)
```

### Matcher (rutas donde se ejecuta el proxy)
```
/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)
/(api|trpc)(.*)
```

Excluye: archivos estaticos, imagenes, fuentes, assets de `_next/`.

---

## Supabase — Acceso a BD

### Cliente browser (`src/lib/supabase/client.ts`)
```typescript
import { supabase } from '@/lib/supabase/client'
```
- Usa `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Para client components
- Sujeto a RLS (solo lectura publica en tablas con `USING (TRUE)`)

### Cliente servidor (`src/lib/supabase/server.ts`)
```typescript
import { createServerSupabase } from '@/lib/supabase/server'
const supabase = createServerSupabase()
```
- Usa `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS)
- Solo para server components, server actions, API routes
- Nunca exponer al browser

---

## Vistas de BD Disponibles

| Vista | Descripcion | Uso sugerido |
|-------|-------------|-------------|
| `v_dashboard` | Metricas generales del negocio | Dashboard principal |
| `v_stock_actual` | Stock por producto con alerta (AGOTADO/STOCK_BAJO/OK) | Inventario, alertas |
| `v_consignaciones_activas` | Consignaciones abiertas con saldos y dias transcurridos | Lista de consignaciones |
| `v_ruta_hoy` | Ubicaciones del stand para hoy | Modulo de ruta |
| `v_rentabilidad_ubicaciones` | Ranking de ventas por ubicacion (30 dias) | Analisis de ubicaciones |

### Ejemplo de consulta
```typescript
const supabase = createServerSupabase()
const { data, error } = await supabase
  .from('v_stock_actual')
  .select('*')
  .eq('alerta', 'STOCK_BAJO')
```

---

## Variables de Entorno

| Variable | Requerida | Publica | Descripcion |
|----------|-----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Si | Si | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Si | Si | Anon key (sujeta a RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Si | No | Service role (bypass RLS, solo server) |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Si* | No | Secreto para verificar webhooks de Clerk |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | No | Si | Numero de WhatsApp del negocio |

*Requerida cuando se configure el webhook en el dashboard de Clerk.

Clerk en modo keyless no requiere API keys — se generan automaticamente al correr `npm run dev`.
