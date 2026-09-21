"use client";

import { useMemo } from "react";
import { MessageCircle } from "lucide-react";
import { clientesFrecuentes } from "@/lib/analitica";
import { fechaCorta, formatoCOP } from "@/lib/fechas";
import { telefonoBonito, urlWhatsApp } from "@/lib/whatsapp";
import { Aviso } from "@/components/ui/Aviso";
import { FiltroRango } from "./FiltroRango";
import { usePedidosRango, useRangoURL } from "./usePedidosRango";
import { useNegocio } from "@/components/NegocioProvider";

export function TablaClientes() {
  const { negocio } = useNegocio();
  const { clave, rango, cambiar } = useRangoURL();
  const { pedidos, cargando, error } = usePedidosRango(rango);
  const clientes = useMemo(() => clientesFrecuentes(pedidos, 100), [pedidos]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Clientes frecuentes</h1>
      <FiltroRango clave={clave} rango={rango} onCambiar={cambiar} />
      {error && <Aviso tipo="error">{error}</Aviso>}
      <p className="text-sm text-texto-suave">Agrupados por teléfono. Útil para reconocer a quien más nos compra y su producto favorito.</p>
      <div className="tarjeta overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-texto-suave">
            <tr>
              <th className="px-3 py-2">Cliente</th>
              <th>Teléfono</th>
              <th className="text-right">Pedidos</th>
              <th className="text-right">Total gastado</th>
              <th className="text-right">Promedio</th>
              <th>Favorito</th>
              <th>Último pedido</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => {
              const wa = urlWhatsApp(c.telefono, `¡Hola ${c.nombre.split(" ")[0]}! 👋 Te escribimos de ${negocio.nombre}`);
              return (
                <tr key={c.telefono || c.nombre} className="border-t border-borde">
                  <td className="px-3 py-2 font-bold">{c.nombre}</td>
                  <td className="tabular-nums text-texto-suave">{telefonoBonito(c.telefono) || "—"}</td>
                  <td className="text-right font-black tabular-nums">{c.pedidos}</td>
                  <td className="text-right tabular-nums">{formatoCOP(c.total)}</td>
                  <td className="text-right tabular-nums text-texto-suave">{formatoCOP(c.total / c.pedidos)}</td>
                  <td className="text-texto-suave">{c.favorito}</td>
                  <td className="tabular-nums text-texto-suave">{fechaCorta(c.ultimo)}</td>
                  <td className="px-2">
                    {wa && (
                      <a href={wa} target="_blank" rel="noopener" className="btn min-h-9 bg-whatsapp/20 px-2 text-whatsapp" title="Escribir por WhatsApp">
                        <MessageCircle className="size-4" />
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
            {!cargando && clientes.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-texto-suave">Sin clientes en este rango.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
