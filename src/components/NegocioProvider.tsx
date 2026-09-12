"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { EmpleadoActual, Negocio } from "@/lib/tipos";

interface Valor {
  negocio: Negocio;
  empleado: EmpleadoActual | null;
}

const Ctx = createContext<Valor | null>(null);

/** Pone a disposición de los componentes cliente el negocio y el empleado actuales */
export function NegocioProvider({ negocio, empleado, children }: Valor & { children: ReactNode }) {
  return <Ctx.Provider value={{ negocio, empleado }}>{children}</Ctx.Provider>;
}

export function useNegocio(): Valor {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNegocio debe usarse dentro de NegocioProvider");
  return v;
}
