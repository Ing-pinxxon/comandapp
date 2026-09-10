# 🍔 Comandas Saboratto

Sistema de comandas para Saboratto: toma de pedidos manual, cola con semáforo de tiempos (verde / amarillo / naranja), botones de **Entregado · Editar · Cancelar · WhatsApp al cliente**, y un panel de administrador con estadísticas de ventas.

- **Stack:** Next.js 16 (App Router, TypeScript, Tailwind v4) + Supabase (Postgres, Auth, Realtime) + Recharts.
- **Pensado para tablet en horizontal**, también funciona en celular y PC.
- **Reglas de cobro** (iguales a la web): icopor $500 por cada perro o salchipapa, domicilio $1.000, combo de hamburguesa +$6.000. **Sin descuentos.**

---

## 1. Requisitos

- Node.js 20.9 o superior (este equipo tiene Node 24 instalado en `%LOCALAPPDATA%\Programs\nodejs`; si una terminal nueva no lo encuentra, ciérrala y ábrela de nuevo).
- Una cuenta gratuita en [supabase.com](https://supabase.com).

## 2. Crear el proyecto en Supabase (una sola vez)

1. En Supabase: **New project** → nombre `saboratto-comandas`, región más cercana (South America / São Paulo), guarda la contraseña de la base de datos.
2. Ve a **SQL Editor → New query** y ejecuta, **en orden y uno por uno**, el contenido de:
   1. `supabase/01_schema.sql`
   2. `supabase/02_policies.sql`
   3. `supabase/03_seed.sql`
   4. `supabase/04_realtime.sql`
3. **Authentication → Providers → Email:** deja activo *Email* y **desactiva "Confirm email"**.
   En **Authentication → Sign In / Providers** (o *Settings*), **desactiva "Allow new users to sign up"** para que nadie pueda registrarse por su cuenta.
4. **Authentication → Users → Add user → Create new user**, crea dos usuarios (marca *Auto Confirm User*):
   - **Administrador:** tu correo y una contraseña fuerte.
   - **Personal:** correo `personal@saboratto.app` y contraseña = **el PIN de 6 dígitos** que usará el personal (Supabase exige mínimo 6 caracteres).
5. Vuelve al **SQL Editor** y convierte tu usuario en admin (cambia el correo por el tuyo):
   ```sql
   update perfiles set rol = 'admin'
   where user_id = (select id from auth.users where email = 'tu-correo@ejemplo.com');
   ```
6. En **Project Settings → API** copia **Project URL** y **anon public key**.

> Para cambiar el PIN del personal: *Authentication → Users → personal@saboratto.app → Reset password* (o editar el usuario) y pon el nuevo PIN.

## 3. Configurar y correr en el PC

Edita el archivo `.env.local` (ya existe con valores de ejemplo marcados como `REEMPLAZAR`; si no está, copia `.env.local.example` como `.env.local`) y pega la URL y la anon key de Supabase.

### Forma fácil de arrancar (recomendada)

**Doble clic en `iniciar.bat`.** Ese archivo instala lo que falte, prende el servidor y no depende de la configuración del sistema. Luego abre <http://localhost:3000>. Para apagarlo, cierra la ventana negra.

### Si prefieres la terminal

`npm` solo funciona en terminales abiertas **después** de instalar Node. Si te dice *"npm is not recognized"*, **cierra la terminal y abre una nueva**, o pega esta línea una vez por sesión:

```powershell
$env:Path = "$env:LOCALAPPDATA\Programs\nodejs;$env:Path"
```

Después ya puedes usar `npm install`, `npm run dev`, `npm test`, `npm run lint` y `npm run build` con normalidad.

### ¿Algo no carga?

Con el servidor prendido, abre <http://localhost:3000/vista-previa/conexion>. Esa página te dice si la conexión a Supabase funciona y si el menú está cargado. También puedes ver la interfaz con datos de ejemplo en `/vista-previa` y `/vista-previa/pedido`. Las tres solo existen en modo desarrollo.

### Desde la tablet

Con el servidor prendido en el PC, entra desde la tablet a `http://IP-DEL-PC:3000` (por ejemplo `http://192.168.1.10:3000`) estando en la misma red Wi-Fi. Si la IP del PC cambia, agrégala en `allowedDevOrigins` dentro de `next.config.ts`. Para usarla desde cualquier lugar, publícala en Vercel (paso 5).

## 4. Cómo se usa

| Pantalla | Quién | Qué hace |
|---|---|---|
| `/login` | Todos | Teclado de PIN (personal) o correo + contraseña (admin). La sesión queda guardada en el dispositivo. |
| `/comandas` | Personal y admin | Cola de pedidos. Cada tarjeta muestra #, minutos transcurridos, cliente, productos, total. Color **verde** (0–15 min), **amarillo** (15–25), **naranja** (+25). Botones: ✅ Entregado, ✏️ Editar, ❌ Cancelar (pide motivo), 💬 WhatsApp al cliente. Se sincroniza en tiempo real entre dispositivos. |
| `/comandas/nuevo` | Personal y admin | Tomar pedido: menú por categorías a la izquierda, cliente + items + **total en vivo** a la derecha. Toca un item para quitar ingredientes, ponerlo en combo o agregar nota. **Producto X** para algo fuera del menú. |
| `/admin` | Solo admin | Resumen con KPIs y gráficas (ventas por día, día de la semana, horas pico, unidades por categoría, top productos, combos, métodos de pago, ingredientes más quitados, tiempos de entrega, cancelaciones). |
| `/admin/pedidos` | Solo admin | Historial con búsqueda, detalle y **exportar CSV** (abre en Excel). |
| `/admin/clientes` | Solo admin | Clientes frecuentes por teléfono, total gastado y producto favorito. |
| `/admin/productos` | Solo admin | Editar precios, ingredientes, marcar **agotado**, ocultar, agregar productos (incluye los "productos X" que se repiten). |
| `/admin/configuracion` | Solo admin | Minutos del semáforo, costos (domicilio, icopor, combo) y textos de WhatsApp. |

## 5. Publicar en Vercel (para usar desde cualquier lugar)

1. Sube la carpeta a un repositorio de GitHub (`git init`, `git add .`, `git commit`, `git push`). El archivo `.env.local` **no** se sube (está en `.gitignore`).
2. En [vercel.com](https://vercel.com) → **Add New Project** → importa el repo.
3. En **Environment Variables** agrega `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy. Abre la URL en la tablet y agrégala a la pantalla de inicio (se comporta como app).

## 6. Estructura

```
supabase/            Scripts SQL (esquema, políticas RLS, datos iniciales, realtime)
src/proxy.ts         Protege rutas (sin sesión → /login)
src/app/             Páginas: login, comandas, comandas/nuevo, comandas/[id]/editar, admin/*
src/components/      comandas (cola, tarjeta, cancelar), pedido (formulario, editor, producto X), admin, ui
src/lib/             precios.ts (totales), semaforo.ts, whatsapp.ts, fechas.ts, analitica.ts, datos.ts (Supabase)
```

Los totales se calculan en el navegador para mostrarlos en vivo **y** se recalculan en la base de datos al guardar (`guardar_pedido`), así el registro siempre es consistente.
