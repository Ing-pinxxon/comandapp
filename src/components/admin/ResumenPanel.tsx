"use client";

import { useMemo } from "react";
import Link from "next/link";
import * as A from "@/lib/analitica";
import { formatoCOP, rangoAnterior, type Rango, type RangoClave } from "@/lib/fechas";
import type { PedidoConItems } from "@/lib/tipos";
import { Aviso } from "@/components/ui/Aviso";
import { FiltroRango } from "./FiltroRango";
import { GraficaBarrasDoble, GraficaBarrasSimple, GraficaTorta, GraficaVentasPorDia } from "./Graficas";

export interface ResumenPanelProps {
  pedidos: PedidoConItems[];
  /** Pedidos del periodo inmediatamente anterior, para las flechas de comparación */
  anteriores: PedidoConItems[];
  cargando?: boolean;
  error?: string | null;
  clave: RangoClave;
  rango: Rango;
  cambiar: (clave: RangoClave, personalizado?: Rango) => void;
  /** Enlace al menú para cargar costos; la demo no lo pasa */
  enlaceMenu?: string;
}

/**
 * Dibujo del panel del dueño. No carga nada: recibe los pedidos ya listos,
 * así la demo pública puede mostrarlo con datos de ejemplo.
 */
export function ResumenPanel({ pedidos, anteriores, cargando, error, clave, rango, cambiar, enlaceMenu }: ResumenPanelProps) {
  const r = useMemo(() => A.resumen(pedidos), [pedidos]);
  const antes = useMemo(() => A.resumen(anteriores), [anteriores]);
  const g = useMemo(() => A.ganancia(pedidos), [pedidos]);
  const gAntes = useMemo(() => A.ganancia(anteriores), [anteriores]);
  const categorias = useMemo(() => A.unidadesPorCategoria(pedidos), [pedidos]);
  const top = useMemo(() => A.topProductos(pedidos), [pedidos]);
  const margenes = useMemo(() => A.margenPorProducto(pedidos), [pedidos]);
  const hayCostos = g.ventasConCosto > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Resumen</h1>
        {cargando && <span className="text-sm text-texto-suave">Actualizando…</span>}
      </div>
      <FiltroRango clave={clave} rango={rango} onCambiar={cambiar} />
      {error && <Aviso tipo="error">{error}</Aviso>}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" data-tour="kpis">
        <Kpi etiqueta="Pedidos" valor={r.pedidos} variacion={A.variacion(r.pedidos, antes.pedidos)} />
        <Kpi etiqueta="Ventas" valor={formatoCOP(r.ventas)} destacado variacion={A.variacion(r.ventas, antes.ventas)} />
        <Kpi etiqueta="Ticket promedio" valor={formatoCOP(r.ticketPromedio)} variacion={A.variacion(r.ticketPromedio, antes.ticketPromedio)} />
        <Kpi
          etiqueta="Tiempo prom. entrega"
          valor={r.tiempoPromedioMin === null ? "—" : `${r.tiempoPromedioMin} min`}
          variacion={r.tiempoPromedioMin === null ? undefined : A.variacion(r.tiempoPromedioMin, antes.tiempoPromedioMin ?? 0)}
          subirEsMalo
        />
        <Kpi etiqueta="Unidades" valor={r.unidades} variacion={A.variacion(r.unidades, antes.unidades)} />
        <Kpi
          etiqueta="Cancelados"
          valor={`${r.cancelados} (${r.porcentajeCancelados}%)`}
          alerta={r.cancelados > 0}
          variacion={A.variacion(r.porcentajeCancelados, antes.porcentajeCancelados)}
          subirEsMalo
        />
      </div>

      {/* Ganancia */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Kpi
          etiqueta="Ganancia estimada"
          valor={hayCostos ? formatoCOP(g.ganancia) : "—"}
          apagado={!hayCostos}
          variacion={hayCostos && gAntes.ventasConCosto > 0 ? A.variacion(g.ganancia, gAntes.ganancia) : undefined}
          pie={hayCostos ? `Sobre el ${g.cobertura}% de lo vendido` : "Carga el costo de tus productos"}
        />
        <Kpi
          etiqueta="Margen"
          valor={hayCostos ? `${g.margen}%` : "—"}
          apagado={!hayCostos}
          variacion={hayCostos && gAntes.ventasConCosto > 0 ? A.variacion(g.margen, gAntes.margen) : undefined}
          pie={hayCostos ? `Costo: ${formatoCOP(g.costo)}` : undefined}
        />
        <Kpi
          etiqueta="Cobertura de costos"
          valor={`${g.cobertura}%`}
          apagado={g.cobertura === 0}
          pie={g.sinCosto.length ? `${g.sinCosto.length} producto(s) sin costo` : "Todo lo vendido tiene costo"}
        />
      </div>

      {hayCostos && (
        <p className="text-xs text-texto-suave">
          La ganancia resta el costo de cada producto vendido. No descuenta domicilio, empaque, arriendo ni el acompañamiento de los combos, así que el número
          real es un poco menor.
        </p>
      )}

      {g.sinCosto.length > 0 && (
        <Aviso tipo="info">
          <p className="font-bold">La ganancia es parcial</p>
          <p className="mt-1">
            Estos productos todavía no tienen costo, así que no se cuentan: {g.sinCosto.slice(0, 8).join(", ")}
            {g.sinCosto.length > 8 ? ` y ${g.sinCosto.length - 8} más` : ""}. Tampoco se descuenta el domicilio ni el empaque.
          </p>
          {enlaceMenu && (
            <Link href={enlaceMenu} className="mt-2 inline-block font-bold underline">
              Cargar costos en el menú
            </Link>
          )}
        </Aviso>
      )}

      {/* Unidades por categoría */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {categorias.map((c) => (
          <Kpi key={c.etiqueta} etiqueta={c.etiqueta} valor={c.valor} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GraficaVentasPorDia datos={A.porDiaEnRango(pedidos, rango)} anteriores={A.porDiaEnRango(anteriores, rangoAnterior(rango))} />
        <GraficaBarrasDoble titulo="Pedidos por día de la semana" datos={A.porDiaSemana(pedidos)} />
        <GraficaBarrasDoble titulo="Pedidos por hora (horas pico)" datos={A.porHora(pedidos)} />
        <GraficaTorta titulo="Unidades por categoría" datos={categorias} />
        <GraficaBarrasSimple titulo="Top 10 productos (unidades)" datos={top.map((t) => ({ etiqueta: t.nombre, valor: t.unidades }))} horizontal color="#f97316" />
        {hayCostos && (
          <GraficaBarrasSimple
            titulo="Ganancia por producto"
            datos={margenes.slice(0, 10).map((m) => ({ etiqueta: m.nombre, valor: m.ganancia }))}
            horizontal
            color="#22c55e"
          />
        )}
        <GraficaTorta titulo="Combos vs. sin combo" datos={A.combosVsSinCombo(pedidos)} />
        <GraficaTorta titulo="Ventas por método de pago" datos={A.porMetodoPago(pedidos)} esDinero />
        <GraficaTorta titulo="Pedidos por origen: bot vs a mano" datos={A.porOrigen(pedidos)} />
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
              {hayCostos && <th className="text-right">Ganancia</th>}
            </tr>
          </thead>
          <tbody>
            {top.map((t) => {
              const m = margenes.find((x) => x.nombre === t.nombre);
              return (
                <tr key={t.nombre} className="border-t border-borde">
                  <td className="py-2 font-bold">{t.nombre}</td>
                  <td className="text-texto-suave">{t.categoria}</td>
                  <td className="text-right tabular-nums">{t.unidades}</td>
                  <td className="text-right tabular-nums">{t.combos || "—"}</td>
                  <td className="text-right tabular-nums">{formatoCOP(t.ventas)}</td>
                  {hayCostos && <td className="text-right tabular-nums">{m ? `${formatoCOP(m.ganancia)} · ${m.margen}%` : "—"}</td>}
                </tr>
              );
            })}
            {top.length === 0 && (
              <tr>
                <td colSpan={hayCostos ? 6 : 5} className="py-6 text-center text-texto-suave">
                  Sin ventas en este rango.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

interface KpiProps {
  etiqueta: string;
  valor: string | number;
  destacado?: boolean;
  alerta?: boolean;
  apagado?: boolean;
  /** Cuando subir es malo (cancelados, tiempo de entrega) se invierten los colores */
  subirEsMalo?: boolean;
  variacion?: A.Variacion;
  pie?: string;
}

function Kpi({ etiqueta, valor, destacado, alerta, apagado, subirEsMalo, variacion, pie }: KpiProps) {
  return (
    <div className={`tarjeta p-4 ${destacado ? "border-marca/60 bg-marca/10" : ""} ${alerta ? "border-peligro/50" : ""}`}>
      <div className="text-xs uppercase tracking-wide text-texto-suave">{etiqueta}</div>
      <div className={`mt-1 text-2xl font-black tabular-nums ${destacado ? "text-marca-oscuro" : ""} ${apagado ? "text-texto-suave" : ""}`}>{valor}</div>
      {variacion && <Comparacion variacion={variacion} subirEsMalo={subirEsMalo} />}
      {pie && <div className="mt-1 text-xs text-texto-suave">{pie}</div>}
    </div>
  );
}

function Comparacion({ variacion, subirEsMalo }: { variacion: A.Variacion; subirEsMalo?: boolean }) {
  if (variacion.porcentaje === null) return <div className="mt-1 text-xs text-texto-suave">Sin datos antes</div>;
  if (variacion.porcentaje === 0) return <div className="mt-1 text-xs text-texto-suave">= igual que antes</div>;
  const bueno = variacion.subio !== Boolean(subirEsMalo);
  return (
    <div className={`mt-1 text-xs font-bold ${bueno ? "text-ok" : "text-peligro"}`}>
      {variacion.subio ? "↑" : "↓"} {Math.abs(variacion.porcentaje)}% vs. periodo anterior
    </div>
  );
}
