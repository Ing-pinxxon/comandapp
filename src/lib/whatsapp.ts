// Enlaces wa.me para escribirle al cliente con un mensaje listo.

import { formatoCOP } from "./fechas";

/** Deja solo dígitos y antepone el indicativo 57 a celulares colombianos de 10 dígitos */
export function normalizarTelefono(telefono: string | null | undefined): string | null {
  if (!telefono) return null;
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.length === 0) return null;
  if (digitos.length === 10 && digitos.startsWith("3")) return "57" + digitos;
  if (digitos.length === 12 && digitos.startsWith("57")) return digitos;
  return digitos;
}

/** Muestra el teléfono como 322 243 0079 */
export function telefonoBonito(telefono: string | null | undefined): string {
  if (!telefono) return "";
  const d = telefono.replace(/\D/g, "").replace(/^57(?=\d{10}$)/, "");
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return d;
}

export interface DatosMensaje {
  nombre: string;
  numero: number | string;
  total: number;
}

/** Reemplaza {nombre}, {numero} y {total} en una plantilla */
export function plantillaMensaje(plantilla: string, datos: DatosMensaje): string {
  return plantilla
    .replaceAll("{nombre}", datos.nombre.trim().split(/\s+/)[0] || datos.nombre)
    .replaceAll("{numero}", String(datos.numero))
    .replaceAll("{total}", formatoCOP(datos.total));
}

export function urlWhatsApp(telefono: string | null | undefined, mensaje: string): string | null {
  const tel = normalizarTelefono(telefono);
  if (!tel) return null;
  return `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`;
}
