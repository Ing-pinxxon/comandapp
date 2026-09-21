"use client";

import { useEffect, useRef } from "react";
import { createTour, type OpcionesTour, type Tour } from "@/lib/tour";

/**
 * Arranca el tutorial guiado al montar y lo apaga al desmontar.
 * Devuelve una función para volver a verlo desde un botón.
 */
export function useTour(opciones: OpcionesTour, arrancarSolo = true): { volverAVer: () => void } {
  const ref = useRef<Tour | null>(null);
  // Las opciones se leen una sola vez: el recorrido no cambia durante la visita.
  const guardadas = useRef(opciones);

  useEffect(() => {
    const tour = createTour(guardadas.current);
    ref.current = tour;
    if (arrancarSolo) tour.startIfFirstTime(700);
    return () => {
      tour.end();
      ref.current = null;
    };
  }, [arrancarSolo]);

  return {
    volverAVer: () => {
      ref.current?.reset();
      ref.current?.start(0);
    },
  };
}

/** Le avisa al tutorial que el visitante hizo la acción que estaba esperando */
export function avisarTour(evento: string) {
  if (typeof document !== "undefined") document.dispatchEvent(new CustomEvent(evento));
}
