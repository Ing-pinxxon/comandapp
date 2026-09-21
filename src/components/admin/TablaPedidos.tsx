"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Download, Search } from "lucide-react";
import { filasCSV } from "@/lib/analitica";
import { fechaCorta, formatoCOP, hora12, minutosEntre } from "@/lib/fechas";
import { etiquetaMetodoPago, type EstadoPedido } from "@/lib/tipos";
import { telefonoBonito } from "@/lib/whatsapp";
import { Aviso } from "@/components/ui/Aviso";
import { FiltroRango } from "./FiltroRango";
import { usePedidosRango, useRangoURL } from "./usePedidosRango";
import { useNegocio } from "@/components/NegocioProvider";

const ESTADOS: { valor: EstadoPedido | "todos"; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "pendiente", etiqueta: "Pendientes" },
  { valor: "entregado", etiqueta: "Entregados" },
  { valor: "cancelado", etiqueta: "Cancelados" },
];

export function TablaPedidos() {
  const { negocio } = useNegocio();
  const { clave, rango, cambiar } = useRangoURL();
  const { pedidos, cargando, error } = usePedidosRango(rango);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoPedido | "todos">("todos");
  const [abierto, setAbierto] = useState<number | null>(null);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (estado !== "todos" && p.estado !== estado) return false;
      if (!q) return true;
      return (
        p.cliente_nombre.toLowerCase().includes(q) ||
        (p.cliente_telefono ?? "").includes(q.replace(/\D/g, "") || "∅") ||
        String(p.numero_dia) === q ||
        p.pedido_items.some((i) => i.nombre.toLowerCase().includes(q))
      );
    });
  }, [pedidos, busqueda, estado]);

  function exportarCSV() {
    const contenido = filasCSV(filtrados);
    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pedidos_${negocio.slug}_${rango.desde}_${rango.hasta}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Pedidos</h1>
        <button type="button" onClick={exportarCSV} disabled={filtrados.length === 0} className="btn bg-panel-2">
          <Download className="size-5" /> Exportar CSV ({filtrados.length})
        </button>
      </div>
      <FiltroRango clave={clave} rango={rango} onCambiar={cambiar} />
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex-1 min-w-60">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-texto-dim" />
          <input className="campo pl-10" placeholder="Buscar por nombre, teléfono, #, producto" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </label>
        {ESTADOS.map((e) => (
          <button key={e.valor} type="button" onClick={() => setEstado(e.valor)} className={`btn min-h-11 px-3 ${estado === e.valor ? "bg-marca text-black" : "bg-panel-2 text-texto-suave"}`}>
            {e.etiqueta}
          </button>
        ))}
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}

      <div className="tarjeta overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-texto-suave">
            <tr>
              <th className="px-3 py-2">#</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Pago</th>
              <th className="text-right">Total</th>
              <th className="text-right">Min.</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => {
              const expandido = abierto === p.id;
              const minutos = p.entregado_en ? minutosEntre(p.creado_en, p.entregado_en) : null;
              return (
                <FilaPedido key={p.id} expandido={expandido} onToggle={() => setAbierto(expandido ? null : p.id)}>
                  <td className="px-3 py-2 font-black">#{p.numero_dia}</td>
                  <td className="tabular-nums">{fechaCorta(p.creado_en)}</td>
                  <td className="tabular-nums">{hora12(p.creado_en)}</td>
                  <td className="font-bold">{p.cliente_nombre}</td>
                  <td className="tabular-nums text-texto-suave">{telefonoBonito(p.cliente_telefono)}</td>
                  <td className="text-texto-suave">{etiquetaMetodoPago(p.metodo_pago)}</td>
                  <td className="text-right font-bold tabular-nums">{formatoCOP(p.total)}</td>
                  <td className="text-right tabular-nums">{minutos ?? "—"}</td>
                  <td><Estado estado={p.estado} /></td>
                  <td className="px-2 text-texto-suave">{expandido ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}</td>
                  {expandido && (
                    <tr className="bg-panel-2">
                      <td colSpan={10} className="px-4 py-3">
                        <ul className="grid gap-1 sm:grid-cols-2">
                          {p.pedido_items.map((i, k) => (
                            <li key={i.id ?? k}>
                              <b>{i.cantidad}×</b> {i.nombre}
                              {i.es_combo && " (Combo)"}
                              {i.es_personalizado && " [X]"} · {formatoCOP(i.precio_unitario * i.cantidad)}
                              {i.exclusiones.length > 0 && <span className="text-peligro"> · Sin: {i.exclusiones.join(", ")}</span>}
                              {i.nota && <span className="text-marca-oscuro"> · {i.nota}</span>}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 flex flex-wrap gap-4 text-texto-suave">
                          <span>Subtotal {formatoCOP(p.subtotal)}</span>
                          {(p.cargos ?? []).map((c) => (
                            <span key={c.nombre}>{c.nombre} {formatoCOP(c.valor)}</span>
                          ))}
                          <span>{p.es_domicilio ? "Domicilio" : "Recoge"}</span>
                          {p.empleados?.nombre && <span>Tomó: {p.empleados.nombre}</span>}
                          {p.notas && <span>📝 {p.notas}</span>}
                          {p.motivo_cancelacion && <span className="text-peligro">Motivo: {p.motivo_cancelacion}</span>}
                          {p.editado_en && <span>Editado {hora12(p.editado_en)}</span>}
                        </div>
                      </td>
                    </tr>
                  )}
                </FilaPedido>
              );
            })}
            {!cargando && filtrados.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-texto-suave">No hay pedidos con estos filtros.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Fila clicable + fila de detalle (la fila de detalle viene como último hijo) */
function FilaPedido({ children, expandido, onToggle }: { children: React.ReactNode; expandido: boolean; onToggle: () => void }) {
  const hijos = Array.isArray(children) ? children : [children];
  const detalle = expandido ? hijos[hijos.length - 1] : null;
  const celdas = expandido ? hijos.slice(0, -1) : hijos.filter(Boolean);
  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer border-t border-borde hover:bg-panel-2">{celdas}</tr>
      {detalle}
    </>
  );
}

function Estado({ estado }: { estado: EstadoPedido }) {
  const estilos: Record<EstadoPedido, string> = {
    pendiente: "bg-semaforo-amarillo/20 text-marca-oscuro",
    entregado: "bg-ok/20 text-ok",
    cancelado: "bg-peligro/20 text-peligro",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${estilos[estado]}`}>{estado}</span>;
}
