"use client";

import { ResumenPanel } from "./ResumenPanel";
import { usePedidosRango, useRangoURL } from "./usePedidosRango";

/** Panel del dueño con los datos reales del negocio */
export function Dashboard() {
  const { clave, rango, cambiar } = useRangoURL();
  const { pedidos, anteriores, cargando, error } = usePedidosRango(rango);

  return (
    <ResumenPanel
      pedidos={pedidos}
      anteriores={anteriores}
      cargando={cargando}
      error={error}
      clave={clave}
      rango={rango}
      cambiar={cambiar}
      enlaceMenu="/admin/productos"
    />
  );
}
