// Dirección pública del sitio y datos de contacto de Comandapp.
// Cuando haya dominio propio, basta con poner NEXT_PUBLIC_SITE_URL en Vercel.

/** URL base del sitio, sin barra al final */
export function sitioUrl(): string {
  const propia = process.env.NEXT_PUBLIC_SITE_URL;
  if (propia) return propia.replace(/\/+$/, "");
  // Vercel expone sola la URL de producción del proyecto
  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}

/**
 * La misma ruta, pero en la dirección principal del sitio.
 *
 * Vercel publica la producción en varias direcciones a la vez: la principal, la
 * del equipo (`comandapp-ing-pinxxons-projects.vercel.app`) y la propia de cada
 * despliegue. La sesión y la llave con la que vuelve Google son cookies de una
 * sola dirección: si se empieza en una y se termina en otra, la persona queda
 * sin sesión y sin saber por qué.
 *
 * `host` es la dirección que pidió el navegador (cabecera Host), no la de
 * `request.nextUrl`: esa puede ser la interna del servidor.
 *
 * Devuelve null si no hay que mover nada: ya se está en la principal, o no es
 * producción (en local y en las vistas previas de Vercel cada uno usa la suya).
 */
export function enDireccionPrincipal(host: string | null, url: Pick<URL, "pathname" | "search">): URL | null {
  if (process.env.VERCEL_ENV !== "production" || !host) return null;
  const principal = new URL(sitioUrl());
  if (host.toLowerCase() === principal.host) return null;
  return new URL(`${url.pathname}${url.search}`, principal);
}

/**
 * El `?volver=` del login, solo si es una ruta de Comandapp. Sin esto, un enlace
 * con `volver=https://otro-sitio` mandaría a la persona afuera justo después de
 * iniciar sesión. `//` y `/\` también son otro sitio para el navegador.
 */
export function rutaInterna(ruta: string | null, porDefecto = "/comandas"): string {
  if (!ruta || !ruta.startsWith("/") || ruta.startsWith("//") || ruta.startsWith("/\\")) return porDefecto;
  return ruta;
}

/** WhatsApp de contacto de Comandapp: el personal de Daniel, no el de un negocio cliente */
export const WHATSAPP_VENTAS = "573147167595";

/** El mismo número, escrito como lo lee la gente */
export const WHATSAPP_VENTAS_BONITO = "+57 314 716 7595";

/** Quién hizo Comandapp; alimenta el sello del pie y los datos estructurados */
export const PERFIL_AUTOR = "https://www.linkedin.com/in/daniel-pinzon-976751250";

export const MENSAJE_VENTAS = "¡Hola! Vi Comandapp y quiero saber más para mi negocio.";

export function urlWhatsAppVentas(mensaje: string = MENSAJE_VENTAS): string {
  return `https://wa.me/${WHATSAPP_VENTAS}?text=${encodeURIComponent(mensaje)}`;
}

/** Frases cortas que describen el producto; se reutilizan en metadata y en la landing */
export const TITULO_SITIO = "Comandapp · Comandas y pedidos para restaurantes y comidas rápidas";
export const DESCRIPCION_SITIO =
  "Toma pedidos en la tablet y míralos en cocina con semáforo de tiempos. Sube una foto de tu carta y la IA arma tu menú. Avisa al cliente por WhatsApp y descubre qué vendes. Gratis durante el lanzamiento.";

export const PALABRAS_CLAVE = [
  "comandas",
  "sistema de comandas",
  "comandas para restaurantes",
  "software para restaurantes",
  "app para comidas rápidas",
  "pedidos a domicilio",
  "pantalla de cocina",
  "toma de pedidos",
  "punto de venta restaurante",
  "pedidos por WhatsApp",
];
