"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cargarPedidosRango, mensajeError } from "@/lib/datos";
import { useNegocio } from "@/components/NegocioProvider";
import { rangoPredefinido, type Rango, type RangoClave } from "@/lib/fechas";
import type { PedidoConItems } from "@/lib/tipos";

/** Rango de fechas guardado en la URL (?rango=hoy | ayer | semana | mes | personalizado&desde&hasta) */
export function useRangoURL() {
  const params = useSearchParams();
  const router = useRouter();
  const ruta = usePathname();

  const clave = (params.get("rango") as RangoClave | null) ?? "hoy";
  const desdeParam = params.get("desde");
  const hastaParam = params.get("hasta");
  const rango: Rango = useMemo(() => {
    if (clave === "personalizado" && desdeParam && hastaParam) return { desde: desdeParam, hasta: hastaParam };
    return rangoPredefinido(clave === "personalizado" ? "hoy" : clave);
  }, [clave, desdeParam, hastaParam]);

  const cambiar = useCallback(
    (nuevaClave: RangoClave, personalizado?: Rango) => {
      const q = new URLSearchParams();
      q.set("rango", nuevaClave);
      if (nuevaClave === "personalizado" && personalizado) {
        q.set("desde", personalizado.desde);
        q.set("hasta", personalizado.hasta);
      }
      router.replace(`${ruta}?${q.toString()}`);
    },
    [router, ruta],
  );

  return { clave, rango, cambiar };
}

/** Carga los pedidos del rango y los mantiene actualizados al cambiar el rango */
export function usePedidosRango(rango: Rango) {
  const { negocio } = useNegocio();
  const negocioId = negocio.id;
  const [pedidos, setPedidos] = useState<PedidoConItems[]>([]);
  const [rangoCargado, setRangoCargado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const claveRango = `${negocioId}|${rango.desde}|${rango.hasta}`;

  useEffect(() => {
    let vigente = true;
    cargarPedidosRango(negocioId, rango)
      .then((p) => {
        if (!vigente) return;
        setPedidos(p);
        setError(null);
      })
      .catch((e) => vigente && setError(mensajeError(e)))
      .finally(() => vigente && setRangoCargado(claveRango));
    return () => {
      vigente = false;
    };
  }, [rango, claveRango, negocioId]);

  const recargar = useCallback(async () => {
    try {
      setPedidos(await cargarPedidosRango(negocioId, rango));
      setError(null);
    } catch (e) {
      setError(mensajeError(e));
    }
  }, [rango, negocioId]);

  return { pedidos, cargando: rangoCargado !== claveRango, error, recargar };
}
