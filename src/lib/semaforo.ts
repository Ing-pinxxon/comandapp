// Semáforo de la cola: verde (recién tomado) → amarillo (va tarde) → naranja (urgente)

import type { NivelSemaforo, Umbrales } from "./tipos";

export function nivelSemaforo(minutos: number, umbrales: Umbrales): NivelSemaforo {
  if (minutos < umbrales.verde) return "verde";
  if (minutos < umbrales.amarillo) return "amarillo";
  return "naranja";
}

/** Clases Tailwind por nivel (fondo, borde, texto grande) */
export const ESTILO_SEMAFORO: Record<NivelSemaforo, { tarjeta: string; badge: string; etiqueta: string }> = {
  verde: {
    tarjeta: "border-semaforo-verde bg-semaforo-verde/10",
    badge: "bg-semaforo-verde text-black",
    etiqueta: "A tiempo",
  },
  amarillo: {
    tarjeta: "border-semaforo-amarillo bg-semaforo-amarillo/10",
    badge: "bg-semaforo-amarillo text-black",
    etiqueta: "Atención",
  },
  naranja: {
    tarjeta: "border-semaforo-naranja bg-semaforo-naranja/15 animate-pulso-suave",
    badge: "bg-semaforo-naranja text-black",
    etiqueta: "¡Urgente!",
  },
};
