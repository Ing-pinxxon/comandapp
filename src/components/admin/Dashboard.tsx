"use client";

import { useMemo } from "react";
import * as A from "@/lib/analitica";
import { formatoCOP } from "@/lib/fechas";
import { Aviso } from "@/components/ui/Aviso";
import { FiltroRango } from "./FiltroRango";
import { usePedidosRango, useRangoURL } from "./usePedidosRango";
import { GraficaBarrasDoble, GraficaBarrasSimple, GraficaTorta, GraficaVentasPorDia } from "./Graficas";

export function Dashboard() {
  const { clave, rango, cambiar } = useRangoURL();
  const { pedidos, cargando, error } = usePedidosRango(rango);

  const r = useMemo(() => A.resumen(pedidos), [pedidos]);
  const categorias = useMemo(() => A.unidadesPorCategoria(pedidos), [pedidos]);
  const top = useMemo(() => A.topProductos(pedidos), [pedidos]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Resumen</h1>
        {cargando && <span className="text-sm text-texto-suave">Actualizando…</span>}
      </div>
      <FiltroRango clave={clave} rango={rango} onCambiar={cambiar} />
      {error && <Aviso tipo="error">{error}</Aviso>}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi etiqueta="Pedidos" valor={r.pedidos} />
        <Kpi etiqueta="Ventas" valor={formatoCOP(r.ventas)} destacado />
        <Kpi etiqueta="Ticket promedio" valor={formatoCOP(r.ticketPromedio)} />
        <Kpi etiqueta="Tiempo prom. entrega" valor={r.tiempoPromedioMin === null ? "—" : `${r.tiempoPromedioMin} min`} />
        <Kpi etiqueta="Unidades" valor={r.unidades} />
        <Kpi etiqueta="Cancelados" valor={`${r.cancelados} (${r.porcentajeCancelados}%)`} alerta={r.cancelados > 0} />
      </div>

      {/* Unidades por categoría */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {categorias.map((c) => (
          <Kpi key={c.etiqueta} etiqueta={c.etiqueta} valor={c.valor} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GraficaVentasPorDia datos={A.porDia(pedidos)} />
        <GraficaBarrasDoble titulo="Pedidos por día de la semana" datos={A.porDiaSemana(pedidos)} />
        <GraficaBarrasDoble titulo="Pedidos por hora (horas pico)" datos={A.porHora(pedidos)} />
        <GraficaTorta titulo="Unidades por categoría" datos={categorias} />
        <GraficaBarrasSimple titulo="Top 10 productos (unidades)" datos={top.map((t) => ({ etiqueta: t.nombre, valor: t.unidades }))} horizontal color="#f97316" />
        <GraficaTorta titulo="Hamburguesas: combo vs sin combo" datos={A.combosVsSinCombo(pedidos)} />
        <GraficaTorta titulo="Ventas por método de pago" datos={A.porMetodoPago(pedidos)} esDinero />
        <GraficaBarrasSimple titulo="Ingredientes más quitados" datos={A.ingredientesQuitados(pedidos)} horizontal color="#ef4444" />
        <GraficaBarrasSimple titulo="Tiempo promedio de entrega por hora (min)" datos={A.tiempoEntregaPorHora(pedidos)} color="#3b82f6" sufijo=" min" />
        <GraficaBarrasSimple titulo="Motivos de cancelación" datos={A.motivosCancelacion(pedidos)} horizontal color="#a855f7" />
      </div>

      {/* Tabla top productos */}
      <section className="tarjeta overflow-x-auto p-4">
        <h3 className="mb-3 text-base font-extrabold">Detalle de productos más vendidos</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-texto-suave">
            <tr>
              <th className="py-2">Producto</th>
              <th>Categoría</th>
              <th className="text-right">Unidades</th>
              <th className="text-right">En combo</th>
              <th className="text-right">Ventas</th>
            </tr>
          </thead>
          <tbody>
            {top.map((t) => (
              <tr key={t.nombre} className="border-t border-borde">
                <td className="py-2 font-bold">{t.nombre}</td>
                <td className="text-texto-suave">{t.categoria}</td>
                <td className="text-right tabular-nums">{t.unidades}</td>
                <td className="text-right tabular-nums">{t.combos || "—"}</td>
                <td className="text-right tabular-nums">{formatoCOP(t.ventas)}</td>
              </tr>
            ))}
            {top.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-texto-suave">Sin ventas en este rango.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Kpi({ etiqueta, valor, destacado, alerta }: { etiqueta: string; valor: string | number; destacado?: boolean; alerta?: boolean }) {
  return (
    <div className={`tarjeta p-4 ${destacado ? "border-marca/60 bg-marca/10" : ""} ${alerta ? "border-peligro/50" : ""}`}>
      <div className="text-xs uppercase tracking-wide text-texto-suave">{etiqueta}</div>
      <div className={`mt-1 text-2xl font-black tabular-nums ${destacado ? "text-marca-claro" : ""}`}>{valor}</div>
    </div>
  );
}
