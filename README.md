# Comandapp

Pantalla de comandas para negocios de comida. Cada negocio crea su cuenta, sube una foto de su carta para que la IA arme el menú, define su equipo con PIN y queda tomando pedidos en la tablet: cola con semáforo de tiempos, avisos por WhatsApp al cliente y un panel con lo que se vende.

- **Web:** Next.js 16 (App Router, TypeScript, Tailwind v4).
- **Datos:** Supabase (Postgres, Auth con correo y Google, Storage, Realtime). Cada negocio ve solo lo suyo (RLS por `negocio_id`).
- **IA del menú:** Gemini (`@google/genai`) lee las fotos y devuelve productos y precios; el dueño revisa antes de guardar.
- **Look:** crema, negro y acento mostaza. Tema claro en toda la app, pensado para tablet en horizontal.

---

## 1. Cómo funciona para un negocio

1. **Crea su cuenta** en `/registro` (correo y contraseña o Google) y confirma el correo.
2. **Configura el negocio** en `/onboarding`: nombre, WhatsApp, logo y su **PIN de dueño**.
3. **Sube fotos de la carta**: la IA propone categorías, productos, precios e ingredientes; se revisan y se guardan.
4. **Crea empleados** con nombre y PIN.
5. En la tablet, `/quien`: cada empleado toca su nombre y escribe su PIN. La cola queda en `/comandas`.
6. El dueño entra al **panel** (`/admin`) con su PIN: resumen, pedidos, clientes, menú, cargos, equipo, mi negocio y configuración.

Los **cargos** (domicilio, empaque, propina…) se definen por negocio en `/admin/cargos`: por pedido o por cada unidad de ciertas categorías, y opcionalmente solo para domicilios. No hay descuentos.

Daniel, como dueño de la plataforma, ve todos los negocios en `/plataforma` y puede desactivar cuentas.

---

## 2. Instalar desde cero (una sola vez)

### 2.1 Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (región South America / São Paulo).
2. **SQL Editor → New query**: ejecuta, en orden y uno por uno:
   1. `supabase/01_schema.sql`
   2. `supabase/02_policies.sql`
   3. `supabase/03_seed.sql` **solo si es la base de Saboratto** (carga su menú). En una instalación limpia para varios negocios, sáltalo.
   4. `supabase/04_realtime.sql`
   5. `supabase/05_integracion_bot.sql`
   6. `supabase/06_multinegocio.sql` ← convierte la base en multinegocio. Si había datos de Saboratto, los migra al negocio "Saboratto" y hace dueño y superadmin al usuario que tenía `perfiles.rol = 'admin'`.
3. **Authentication → Providers → Email:** activo, con **"Confirm email" activado**.
4. **Authentication → URL Configuration:** *Site URL* = la URL de la app (en local `http://localhost:3000`), y en *Redirect URLs* agrega `http://localhost:3000/auth/callback` y la de producción (`https://tu-dominio/auth/callback`).
5. **Google (opcional pero recomendado):**
   1. En [console.cloud.google.com](https://console.cloud.google.com) → APIs y servicios → Credenciales → **Crear credenciales → ID de cliente OAuth** (tipo *Aplicación web*).
   2. En *URI de redirección autorizados* pega la URL que muestra Supabase en **Authentication → Providers → Google** (termina en `/auth/v1/callback`).
   3. Copia *Client ID* y *Client secret* en Supabase → Providers → Google y actívalo.
6. Los buckets de Storage `logos` (público) y `menus` (privado) los crea el script 06. Si tu proyecto no lo permite, créalos a mano en **Storage** con esos nombres y esa visibilidad.

### 2.2 Variables de entorno

Copia `.env.local.example` a `.env.local` y completa:

| Variable | Dónde se consigue |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (anon public) |
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Solo servidor: no lleva `NEXT_PUBLIC_`. |

### 2.3 Correr en el PC

Este equipo tiene Node 24 en `%LOCALAPPDATA%\Programs\nodejs`. Doble clic en `iniciar.bat` o:

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>. Otros comandos: `npm test`, `npm run lint`, `npm run build`.

En desarrollo hay tres páginas de apoyo que no existen en producción: `/vista-previa` (cola con datos de ejemplo), `/vista-previa/pedido` (formulario) y `/vista-previa/conexion` (diagnóstico: sesión, negocio, menú, cargos, empleados, llave de Gemini).

---

## 3. Publicar en Vercel

1. El repositorio ya está en GitHub (`Ing-pinxxon/comandapp`). En [vercel.com](https://vercel.com) → **Add New Project** → importa el repo.
2. **Environment Variables:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`.
3. Deploy. Luego en Supabase → Authentication → URL Configuration pon la URL de Vercel como *Site URL* y agrega `https://…vercel.app/auth/callback` a *Redirect URLs*.
4. En la tablet, abre la URL y agrégala a la pantalla de inicio.

---

## 4. Conectar un bot de WhatsApp (Saboratto)

Cuando un cliente confirma un pedido con el bot, entra solo a la cola marcado como **"Llegó por WhatsApp · Revisar"**. El personal lo aprueba con un toque.

En Railway (proyecto del bot) → Variables:

| Variable | Valor |
|---|---|
| `COMANDAS_SUPABASE_URL` | URL del proyecto de Supabase |
| `COMANDAS_SERVICE_KEY` | clave `service_role` (Project Settings → API). **Nunca** en el código ni en un repositorio. |
| `COMANDAS_CLAVE_NEGOCIO` | la clave que aparece en Comandapp → Panel del dueño → **Mi negocio** |

Si faltan variables el bot sigue funcionando igual y solo deja un aviso en sus registros.

---

## 5. Seguridad de la tablet

La tablet queda con la sesión del dueño abierta y los empleados se identifican por PIN. El PIN protege la pantalla, no la base de datos: alguien con la tablet en la mano y conocimientos técnicos podría leer los datos del negocio. **No dejes la tablet con la sesión abierta fuera del local** y cierra sesión si la prestas. Es el mismo funcionamiento de los sistemas de punto de venta.

---

## 6. Estructura

```
supabase/                 Scripts SQL (01 esquema … 06 multinegocio)
src/proxy.ts              Rutas públicas y protección por sesión
src/app/
  page.tsx                Landing pública
  registro, login, recuperar, auth/callback, auth/cambiar-clave
  onboarding              Asistente: negocio → menú por foto → equipo
  quien                   Elegir empleado + PIN
  comandas                Cola, nuevo pedido, editar
  admin/                  Resumen, pedidos, clientes, productos (+menu/importar), cargos, equipo, negocio, configuración
  plataforma              Solo superadmin: todos los negocios
  api/menu/analizar       Lee las fotos del menú con Gemini
src/components/           comandas, pedido, admin, menu (ImportadorMenu), login, onboarding, plataforma, ui
src/lib/                  tipos, precios (cargos), menu-ia, datos (Supabase), catalogo(-servidor), analitica, fechas, whatsapp
```

Los totales se calculan en el navegador para mostrarlos en vivo **y** se recalculan en la base al guardar (`guardar_pedido`), así el registro siempre es consistente.
