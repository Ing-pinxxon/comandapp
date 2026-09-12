"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import type { Cargo, Categoria, TipoCargo } from "@/lib/tipos";
import { cargarCatalogo, eliminarCargo, guardarCargo, mensajeError } from "@/lib/datos";
import { formatoCOP } from "@/lib/fechas";
import { Aviso } from "@/components/ui/Aviso";
import { Modal } from "@/components/ui/Modal";
import { useNegocio } from "@/components/NegocioProvider";

type Borrador = Omit<Cargo, "id" | "negocio_id"> & { id?: number };

const vacio = (): Borrador => ({ nombre: "", tipo: "por_pedido", valor: 0, categorias: [], solo_domicilio: false, activo: true, orden: 0 });

export function GestionCargos() {
  const { negocio } = useNegocio();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [editando, setEditando] = useState<Borrador | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const recargar = useCallback(async () => {
    try {
      const c = await cargarCatalogo(negocio.id);
      setCargos(c.cargos);
      setCategorias(c.categorias);
    } catch (e) {
      setError(mensajeError(e));
    }
  }, [negocio.id]);

  useEffect(() => {
    let vigente = true;
    cargarCatalogo(negocio.id)
      .then((c) => {
        if (!vigente) return;
        setCargos(c.cargos);
        setCategorias(c.categorias);
      })
      .catch((e) => vigente && setError(mensajeError(e)));
    return () => {
      vigente = false;
    };
  }, [negocio.id]);

  function avisar(msg: string) {
    setOk(msg);
    setError(null);
    setTimeout(() => setOk(null), 2500);
  }

  async function guardar() {
    if (!editando || !editando.nombre.trim()) return;
    if (editando.tipo === "por_unidad_categoria" && editando.categorias.length === 0) {
      setError("Elige al menos una categoría para un cargo por unidad.");
      return;
    }
    setGuardando(true);
    try {
      await guardarCargo({ ...editando, negocio_id: negocio.id, nombre: editando.nombre.trim(), orden: editando.orden || cargos.length + 1 });
      setEditando(null);
      await recargar();
      avisar("Cargo guardado");
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(id: number) {
    try {
      await eliminarCargo(id);
      await recargar();
      avisar("Cargo eliminado");
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  async function alternar(c: Cargo) {
    try {
      await guardarCargo({ ...c, activo: !c.activo });
      await recargar();
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  const nombreCategorias = (ids: number[]) => ids.map((id) => categorias.find((c) => c.id === id)?.nombre).filter(Boolean).join(", ");

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Cargos</h1>
          <p className="text-texto-suave">Domicilio, empaques, propinas o cualquier recargo que se sume al pedido.</p>
        </div>
        <button type="button" onClick={() => setEditando(vacio())} className="btn bg-marca text-black"><Plus className="size-5" /> Nuevo cargo</button>
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      {ok && <Aviso tipo="ok">{ok}</Aviso>}

      {cargos.length === 0 ? (
        <Aviso tipo="info">Sin cargos: el total del pedido es la suma de los productos. Agrega uno si cobras domicilio o empaque.</Aviso>
      ) : (
        <ul className="space-y-2">
          {cargos.map((c) => (
            <li key={c.id} className={`tarjeta flex flex-wrap items-center gap-3 p-4 ${c.activo ? "" : "opacity-50"}`}>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-extrabold">{c.nombre} <span className="text-texto-suave">· {formatoCOP(c.valor)}</span></div>
                <div className="text-sm text-texto-suave">
                  {c.tipo === "por_pedido" ? "Por pedido" : `Por cada unidad de: ${nombreCategorias(c.categorias) || "(sin categorías)"}`}
                  {c.solo_domicilio ? " · solo domicilio" : ""}
                </div>
              </div>
              <button type="button" onClick={() => void alternar(c)} className={`btn min-h-10 px-3 ${c.activo ? "bg-ok/20 text-ok" : "bg-panel-2"}`}>{c.activo ? "Activo" : "Inactivo"}</button>
              <button type="button" onClick={() => setEditando({ ...c })} className="btn min-h-10 bg-panel-2 px-3">Editar</button>
              <button type="button" onClick={() => void borrar(c.id)} className="btn min-h-10 bg-panel-2 px-3 text-peligro" aria-label="Eliminar"><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
      )}

      <Modal abierto={Boolean(editando)} titulo={editando?.id ? "Editar cargo" : "Nuevo cargo"} onCerrar={() => setEditando(null)} ancho="sm">
        {editando && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void guardar(); }}>
            <label className="block">
              <span className="mb-1 block text-sm text-texto-suave">Nombre *</span>
              <input className="campo" value={editando.nombre} onChange={(e) => setEditando({ ...editando, nombre: e.target.value })} placeholder="Ej: Domicilio, Empaque, Propina" autoFocus />
            </label>
            <div>
              <span className="mb-1 block text-sm text-texto-suave">Cómo se cobra</span>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["por_pedido", "Una vez por pedido"],
                  ["por_unidad_categoria", "Por cada unidad"],
                ] as [TipoCargo, string][]).map(([t, etiqueta]) => (
                  <button key={t} type="button" onClick={() => setEditando({ ...editando, tipo: t })} className={`btn ${editando.tipo === t ? "bg-marca text-black" : "bg-panel-2"}`}>{etiqueta}</button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm text-texto-suave">Valor ($) *</span>
              <input className="campo" inputMode="numeric" value={editando.valor || ""} onChange={(e) => setEditando({ ...editando, valor: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
            </label>
            {editando.tipo === "por_unidad_categoria" && (
              <div>
                <span className="mb-1 block text-sm text-texto-suave">Se cobra por cada unidad de estas categorías</span>
                <div className="flex flex-wrap gap-2">
                  {categorias.map((c) => {
                    const marcado = editando.categorias.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setEditando({ ...editando, categorias: marcado ? editando.categorias.filter((x) => x !== c.id) : [...editando.categorias, c.id] })}
                        className={`btn min-h-10 px-3 ${marcado ? "bg-marca text-black" : "bg-panel-2"}`}
                      >
                        {c.emoji} {c.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-5" checked={editando.solo_domicilio} onChange={(e) => setEditando({ ...editando, solo_domicilio: e.target.checked })} />
              Solo cuando el pedido es a domicilio
            </label>
            <button type="submit" disabled={guardando || !editando.nombre.trim() || editando.valor <= 0} className="btn w-full bg-ok text-white"><Save className="size-5" /> Guardar</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
