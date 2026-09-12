"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { supabaseNavegador } from "@/lib/supabase/client";
import { mensajeError } from "@/lib/datos";
import { fechaCorta } from "@/lib/fechas";
import { iniciales } from "@/lib/tipos";
import { Aviso } from "@/components/ui/Aviso";
import { Logotipo } from "@/components/ui/Logotipo";

interface FilaNegocio {
  id: string;
  nombre: string;
  slug: string;
  logo_url: string | null;
  activo: boolean;
  creado_en: string;
  dueno_email: string | null;
  pedidos_total: number;
  pedidos_7d: number;
  ultimo_pedido: string | null;
  empleados: number;
}

export function PanelPlataforma() {
  const [filas, setFilas] = useState<FilaNegocio[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    const { data, error } = await supabaseNavegador().rpc("resumen_plataforma");
    if (error) setError(mensajeError(error));
    else setFilas((data ?? []) as FilaNegocio[]);
    setCargando(false);
  }, []);

  useEffect(() => {
    let vigente = true;
    Promise.resolve(supabaseNavegador().rpc("resumen_plataforma"))
      .then(({ data, error }) => {
        if (!vigente) return;
        if (error) setError(mensajeError(error));
        else setFilas((data ?? []) as FilaNegocio[]);
        setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, []);

  async function alternar(n: FilaNegocio) {
    const accion = n.activo ? "desactivar" : "activar";
    if (!confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} el negocio "${n.nombre}"?`)) return;
    const { error } = await supabaseNavegador().rpc("cambiar_estado_negocio", { p_negocio: n.id, p_activo: !n.activo });
    if (error) setError(mensajeError(error));
    else await recargar();
  }

  const totales = {
    negocios: filas.length,
    activos: filas.filter((f) => f.activo).length,
    pedidos: filas.reduce((s, f) => s + Number(f.pedidos_total), 0),
    pedidos7d: filas.reduce((s, f) => s + Number(f.pedidos_7d), 0),
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Logotipo />
          <span className="rounded-md bg-negro px-2 py-0.5 text-xs font-bold text-marca">Plataforma</span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void recargar()} className="btn bg-panel-2 px-3" aria-label="Actualizar"><RefreshCw className={`size-5 ${cargando ? "animate-spin" : ""}`} /></button>
          <Link href="/comandas" className="btn bg-panel-2"><ArrowLeft className="size-5" /> Mi cola</Link>
        </div>
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi etiqueta="Negocios" valor={totales.negocios} />
        <Kpi etiqueta="Activos" valor={totales.activos} />
        <Kpi etiqueta="Pedidos totales" valor={totales.pedidos} />
        <Kpi etiqueta="Pedidos últimos 7 días" valor={totales.pedidos7d} destacado />
      </div>

      <div className="tarjeta overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-texto-suave">
            <tr>
              <th className="px-3 py-2">Negocio</th>
              <th>Dueño</th>
              <th>Creado</th>
              <th className="text-right">Empleados</th>
              <th className="text-right">Pedidos</th>
              <th className="text-right">7 días</th>
              <th>Último pedido</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((n) => (
              <tr key={n.id} className={`border-t border-borde ${n.activo ? "" : "opacity-60"}`}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {n.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.logo_url} alt="" className="size-8 rounded-lg object-cover" />
                    ) : (
                      <span className="flex size-8 items-center justify-center rounded-lg bg-marca text-xs font-black text-black">{iniciales(n.nombre)}</span>
                    )}
                    <div>
                      <div className="font-bold">{n.nombre}</div>
                      <div className="text-xs text-texto-suave">{n.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="text-texto-suave">{n.dueno_email ?? "—"}</td>
                <td className="tabular-nums">{fechaCorta(n.creado_en)}</td>
                <td className="text-right tabular-nums">{n.empleados}</td>
                <td className="text-right font-bold tabular-nums">{n.pedidos_total}</td>
                <td className="text-right tabular-nums">{n.pedidos_7d}</td>
                <td className="tabular-nums text-texto-suave">{n.ultimo_pedido ? fechaCorta(n.ultimo_pedido) : "nunca"}</td>
                <td>
                  <button type="button" onClick={() => void alternar(n)} className={`btn min-h-9 px-3 text-xs ${n.activo ? "bg-ok/20 text-ok" : "bg-peligro/20 text-peligro"}`}>
                    {n.activo ? "Activo" : "Desactivado"}
                  </button>
                </td>
              </tr>
            ))}
            {!cargando && filas.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-texto-suave">Todavía no hay negocios registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ etiqueta, valor, destacado }: { etiqueta: string; valor: number; destacado?: boolean }) {
  return (
    <div className={`tarjeta p-4 ${destacado ? "border-marca/60 bg-marca/10" : ""}`}>
      <div className="text-xs uppercase tracking-wide text-texto-suave">{etiqueta}</div>
      <div className="mt-1 text-2xl font-black tabular-nums">{valor}</div>
    </div>
  );
}
