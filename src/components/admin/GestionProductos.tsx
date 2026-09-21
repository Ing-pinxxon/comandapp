"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, Eye, EyeOff, FolderPlus, Plus, Save, Sparkles } from "lucide-react";
import { supabaseNavegador } from "@/lib/supabase/client";
import { cargarCatalogo, cargarPedidosRango, crearCategoria, mensajeError } from "@/lib/datos";
import { useNegocio } from "@/components/NegocioProvider";
import type { Catalogo } from "@/lib/catalogo";
import { productosPersonalizados, type ProductoTop } from "@/lib/analitica";
import { fechaISOBogota, formatoCOP, sumarDias } from "@/lib/fechas";
import type { Producto } from "@/lib/tipos";
import { Aviso } from "@/components/ui/Aviso";
import { Modal } from "@/components/ui/Modal";

interface Borrador {
  nombre: string;
  precio: string;
  precio_combo: string;
  costo: string;
  ingredientes: string;
  categoria_id: number;
}

const VACIO: Omit<Borrador, "categoria_id"> = { nombre: "", precio: "", precio_combo: "", costo: "", ingredientes: "" };

/** Lo que deja el producto por unidad, al lado del costo */
function MargenProducto({ precio, costo }: { precio: number; costo: number }) {
  if (!precio) return null;
  const ganancia = precio - costo;
  const porcentaje = Math.round((ganancia / precio) * 100);
  return (
    <div className={`text-xs font-bold ${ganancia < 0 ? "text-peligro" : "text-ok"}`}>
      {formatoCOP(ganancia)} · {porcentaje}%
    </div>
  );
}

export function GestionProductos() {
  const { negocio } = useNegocio();
  const negocioId = negocio.id;
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [editando, setEditando] = useState<Record<number, Borrador>>({});
  const [nuevo, setNuevo] = useState<Borrador | null>(null);
  const [nuevaCategoria, setNuevaCategoria] = useState<{ nombre: string; emoji: string; permite_combo: boolean } | null>(null);
  const [candidatos, setCandidatos] = useState<ProductoTop[]>([]);

  const recargar = useCallback(async () => {
    try {
      const hoy = fechaISOBogota();
      const [cat, pedidos] = await Promise.all([cargarCatalogo(negocioId), cargarPedidosRango(negocioId, { desde: sumarDias(hoy, -30), hasta: hoy })]);
      setCatalogo(cat);
      setCandidatos(productosPersonalizados(pedidos));
    } catch (e) {
      setError(mensajeError(e));
    }
  }, [negocioId]);

  useEffect(() => {
    let vigente = true;
    const hoy = fechaISOBogota();
    Promise.all([cargarCatalogo(negocioId), cargarPedidosRango(negocioId, { desde: sumarDias(hoy, -30), hasta: hoy })])
      .then(([cat, pedidos]) => {
        if (!vigente) return;
        setCatalogo(cat);
        setCandidatos(productosPersonalizados(pedidos));
      })
      .catch((e) => vigente && setError(mensajeError(e)));
    return () => {
      vigente = false;
    };
  }, [negocioId]);

  const porCategoria = useMemo(() => {
    if (!catalogo) return [];
    return catalogo.categorias.map((c) => ({ categoria: c, productos: catalogo.productos.filter((p) => p.categoria_id === c.id) }));
  }, [catalogo]);

  function avisarOk(msg: string) {
    setOk(msg);
    setError(null);
    setTimeout(() => setOk(null), 2500);
  }

  async function actualizar(id: number, cambios: Partial<Producto>) {
    const { error } = await supabaseNavegador().from("productos").update(cambios).eq("id", id);
    if (error) {
      setError(mensajeError(error));
      return false;
    }
    await recargar();
    return true;
  }

  function borradorDe(p: Producto): Borrador {
    return {
      nombre: p.nombre,
      precio: String(p.precio),
      precio_combo: p.precio_combo ? String(p.precio_combo) : "",
      costo: p.costo === null ? "" : String(p.costo),
      ingredientes: p.ingredientes.join(", "),
      categoria_id: p.categoria_id,
    };
  }

  function desdeBorrador(b: Borrador) {
    return {
      nombre: b.nombre.trim(),
      precio: Number(b.precio.replace(/\D/g, "")) || 0,
      precio_combo: b.precio_combo.trim() ? Number(b.precio_combo.replace(/\D/g, "")) : null,
      costo: b.costo.trim() ? Number(b.costo.replace(/\D/g, "")) : null,
      ingredientes: b.ingredientes.split(",").map((s) => s.trim()).filter(Boolean),
      categoria_id: b.categoria_id,
    };
  }

  async function guardarEdicion(id: number) {
    const b = editando[id];
    if (!b || !b.nombre.trim()) return;
    if (await actualizar(id, desdeBorrador(b))) {
      setEditando((e) => {
        const n = { ...e };
        delete n[id];
        return n;
      });
      avisarOk("Producto actualizado");
    }
  }

  async function crear() {
    if (!nuevo || !nuevo.nombre.trim()) return;
    const datos = desdeBorrador(nuevo);
    const orden = (catalogo?.productos.filter((p) => p.categoria_id === datos.categoria_id).length ?? 0) + 1;
    const { error } = await supabaseNavegador().from("productos").insert({ ...datos, negocio_id: negocioId, orden });
    if (error) {
      setError(mensajeError(error));
      return;
    }
    setNuevo(null);
    await recargar();
    avisarOk("Producto agregado al menú");
  }

  async function crearCat() {
    if (!nuevaCategoria || !nuevaCategoria.nombre.trim()) return;
    try {
      await crearCategoria(negocioId, nuevaCategoria.nombre, nuevaCategoria.emoji || "🍽️", nuevaCategoria.permite_combo);
      setNuevaCategoria(null);
      await recargar();
      avisarOk("Categoría creada");
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  if (!catalogo) return <p className="text-texto-suave">{error ?? "Cargando…"}</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Menú</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/menu/importar" className="btn bg-panel-2">
            <Camera className="size-5" /> Importar desde foto
          </Link>
          <button type="button" onClick={() => setNuevaCategoria({ nombre: "", emoji: "🍽️", permite_combo: false })} className="btn bg-panel-2">
            <FolderPlus className="size-5" /> Nueva categoría
          </button>
          <button
            type="button"
            disabled={catalogo.categorias.length === 0}
            onClick={() => setNuevo({ ...VACIO, categoria_id: catalogo.categorias[0]?.id ?? 0 })}
            className="btn bg-marca text-black"
          >
            <Plus className="size-5" /> Nuevo producto
          </button>
        </div>
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      <p className="text-sm text-texto-suave">
        <b>Agotado</b> lo deja visible pero sin poder agregarse hoy. <b>Oculto</b> lo quita del menú. Los cambios se ven de inmediato en las tablets.
      </p>
      <p className="text-sm text-texto-suave">
        El <b>costo</b> es lo que te cuesta prepararlo. Es opcional, pero sin él el panel no puede calcular tu ganancia. Se guarda con cada venta: si mañana
        cambias el costo, los pedidos viejos no se alteran.
      </p>

      {porCategoria.map(({ categoria, productos }) => (
        <section key={categoria.id} className="tarjeta overflow-x-auto p-4">
          <h2 className="mb-3 text-lg font-extrabold">
            {categoria.emoji} {categoria.nombre}
            <span className="ml-2 text-xs font-normal text-texto-suave">{categoria.permite_combo ? "· permite combo" : ""}</span>
          </h2>
          <table className="w-full text-sm">
            <thead className="text-left text-texto-suave">
              <tr>
                <th className="py-1">Nombre</th>
                <th className="w-28">Precio</th>
                {categoria.permite_combo && <th className="w-28">Combo</th>}
                <th className="w-36">Costo</th>
                <th>Ingredientes que se pueden quitar</th>
                <th className="w-56 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => {
                const b = editando[p.id];
                return (
                  <tr key={p.id} className={`border-t border-borde ${!p.activo ? "opacity-50" : ""}`}>
                    <td className="py-2 pr-2">
                      {b ? <input className="campo min-h-10" value={b.nombre} onChange={(e) => setEditando({ ...editando, [p.id]: { ...b, nombre: e.target.value } })} /> : <span className="font-bold">{p.nombre}</span>}
                      {p.agotado && <span className="ml-2 rounded-md bg-peligro/20 px-1.5 text-xs font-bold text-peligro">AGOTADO</span>}
                    </td>
                    <td className="pr-2 tabular-nums">
                      {b ? <input className="campo min-h-10" inputMode="numeric" value={b.precio} onChange={(e) => setEditando({ ...editando, [p.id]: { ...b, precio: e.target.value } })} /> : formatoCOP(p.precio)}
                    </td>
                    {categoria.permite_combo && (
                      <td className="pr-2 tabular-nums">
                        {b ? <input className="campo min-h-10" inputMode="numeric" value={b.precio_combo} onChange={(e) => setEditando({ ...editando, [p.id]: { ...b, precio_combo: e.target.value } })} placeholder="auto" /> : p.precio_combo ? formatoCOP(p.precio_combo) : <span className="text-texto-suave">+{formatoCOP(catalogo.config.extra_combo)}</span>}
                      </td>
                    )}
                    <td className="pr-2 tabular-nums">
                      {b ? (
                        <input className="campo min-h-10" inputMode="numeric" value={b.costo} onChange={(e) => setEditando({ ...editando, [p.id]: { ...b, costo: e.target.value.replace(/\D/g, "") } })} placeholder="sin costo" />
                      ) : p.costo === null ? (
                        <span className="text-texto-suave">sin costo</span>
                      ) : (
                        <>
                          {formatoCOP(p.costo)}
                          <MargenProducto precio={p.precio} costo={p.costo} />
                        </>
                      )}
                    </td>
                    <td className="pr-2 text-texto-suave">
                      {b ? <input className="campo min-h-10" value={b.ingredientes} onChange={(e) => setEditando({ ...editando, [p.id]: { ...b, ingredientes: e.target.value } })} placeholder="Queso, Cebolla, ..." /> : p.ingredientes.join(", ") || "—"}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        {b ? (
                          <>
                            <button type="button" onClick={() => void guardarEdicion(p.id)} className="btn min-h-10 bg-ok px-3 text-white"><Save className="size-4" /> Guardar</button>
                            <button type="button" onClick={() => setEditando((e) => { const n = { ...e }; delete n[p.id]; return n; })} className="btn min-h-10 bg-panel-2 px-3">Cancelar</button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => setEditando({ ...editando, [p.id]: borradorDe(p) })} className="btn min-h-10 bg-panel-2 px-3">Editar</button>
                            <button type="button" onClick={() => void actualizar(p.id, { agotado: !p.agotado })} className={`btn min-h-10 px-3 ${p.agotado ? "bg-peligro text-white" : "bg-panel-2"}`}>
                              {p.agotado ? "Disponible" : "Agotado"}
                            </button>
                            <button type="button" onClick={() => void actualizar(p.id, { activo: !p.activo })} className="btn min-h-10 bg-panel-2 px-3" title={p.activo ? "Ocultar del menú" : "Mostrar en el menú"}>
                              {p.activo ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}

      {/* Productos X repetidos */}
      <section className="tarjeta p-4">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-extrabold"><Sparkles className="size-5 text-marca" /> Productos X vendidos (últimos 30 días)</h2>
        <p className="mb-3 text-sm text-texto-suave">Cosas que se vendieron fuera del menú. Si se repiten, conviene agregarlas al menú con un toque.</p>
        {candidatos.length === 0 ? (
          <p className="text-texto-suave">Ninguno todavía.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {candidatos.map((c) => (
              <li key={c.nombre} className="flex items-center justify-between rounded-xl bg-panel-2 px-3 py-2">
                <div>
                  <div className="font-bold">{c.nombre}</div>
                  <div className="text-xs text-texto-suave">{c.categoria} · {c.unidades} unid. · {formatoCOP(c.ventas)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setNuevo({ ...VACIO, nombre: c.nombre, precio: String(Math.round(c.ventas / c.unidades)), categoria_id: catalogo.categorias.find((k) => k.nombre === c.categoria)?.id ?? catalogo.categorias[0].id })}
                  className="btn min-h-10 bg-marca/20 px-3 text-marca-oscuro"
                >
                  <Plus className="size-4" /> Al menú
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal abierto={Boolean(nuevo)} titulo="Nuevo producto" onCerrar={() => setNuevo(null)} ancho="sm">
        {nuevo && (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void crear(); }}>
            <label className="block"><span className="mb-1 block text-sm text-texto-suave">Nombre *</span><input className="campo" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} autoFocus /></label>
            <label className="block"><span className="mb-1 block text-sm text-texto-suave">Categoría</span>
              <select className="campo" value={nuevo.categoria_id} onChange={(e) => setNuevo({ ...nuevo, categoria_id: Number(e.target.value) })}>
                {catalogo.categorias.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>)}
              </select>
            </label>
            <label className="block"><span className="mb-1 block text-sm text-texto-suave">Precio *</span><input className="campo" inputMode="numeric" value={nuevo.precio} onChange={(e) => setNuevo({ ...nuevo, precio: e.target.value.replace(/\D/g, "") })} /></label>
            <label className="block"><span className="mb-1 block text-sm text-texto-suave">Precio combo (opcional)</span><input className="campo" inputMode="numeric" value={nuevo.precio_combo} onChange={(e) => setNuevo({ ...nuevo, precio_combo: e.target.value.replace(/\D/g, "") })} placeholder={`auto: precio + ${formatoCOP(catalogo.config.extra_combo)}`} /></label>
            <label className="block">
              <span className="mb-1 block text-sm text-texto-suave">Costo (opcional): lo que te cuesta prepararlo</span>
              <input className="campo" inputMode="numeric" value={nuevo.costo} onChange={(e) => setNuevo({ ...nuevo, costo: e.target.value.replace(/\D/g, "") })} placeholder="Ej: 5500" />
              {nuevo.costo && nuevo.precio && <MargenProducto precio={Number(nuevo.precio)} costo={Number(nuevo.costo)} />}
            </label>
            <label className="block"><span className="mb-1 block text-sm text-texto-suave">Ingredientes que se pueden quitar (separados por coma)</span><input className="campo" value={nuevo.ingredientes} onChange={(e) => setNuevo({ ...nuevo, ingredientes: e.target.value })} placeholder="Queso, Cebolla, Lechuga" /></label>
            <button type="submit" disabled={!nuevo.nombre.trim() || !nuevo.precio} className="btn w-full bg-marca text-black"><Plus className="size-5" /> Agregar al menú</button>
          </form>
        )}
      </Modal>

      <Modal abierto={Boolean(nuevaCategoria)} titulo="Nueva categoría" onCerrar={() => setNuevaCategoria(null)} ancho="sm">
        {nuevaCategoria && (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void crearCat(); }}>
            <label className="block"><span className="mb-1 block text-sm text-texto-suave">Nombre *</span><input className="campo" value={nuevaCategoria.nombre} onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, nombre: e.target.value })} placeholder="Ej: Postres" autoFocus /></label>
            <label className="block"><span className="mb-1 block text-sm text-texto-suave">Emoji</span><input className="campo" value={nuevaCategoria.emoji} onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, emoji: e.target.value })} maxLength={4} /></label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={nuevaCategoria.permite_combo} onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, permite_combo: e.target.checked })} className="size-5" />
              Los productos de esta categoría se pueden pedir en combo
            </label>
            <button type="submit" disabled={!nuevaCategoria.nombre.trim()} className="btn w-full bg-marca text-black"><FolderPlus className="size-5" /> Crear categoría</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
