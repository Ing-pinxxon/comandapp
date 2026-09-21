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

/** WhatsApp de ventas de Comandapp (no el de un negocio cliente) */
export const WHATSAPP_VENTAS = "573222430079";

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
