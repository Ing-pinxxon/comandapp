"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { ArrowLeft, Bike, Save, ShoppingBag, Sparkles, Store, UtensilsCrossed } from "lucide-react";
import type { Catalogo } from "@/lib/catalogo";
import { guardarPedido, mensajeError } from "@/lib/datos";
import { METODOS_PAGO, type Categoria, type MetodoPago, type PedidoConItems, type Producto } from "@/lib/tipos";
import { calcularTotales } from "@/lib/precios";
import { formatoCOP } from "@/lib/fechas";
import { Aviso } from "@/components/ui/Aviso";
import { ItemPedido } from "./ItemPedido";
import { ProductoX } from "./ProductoX";
import { aItemsEntrada, borradorDesdeProducto, borradoresDesdePedido, mismaConfiguracion, precioUnitarioBorrador, type ItemBorrador } from "./tipos-borrador";

interface Props {
  catalogo: Catalogo;
  pedidoExistente?: PedidoConItems;
  /** Vista previa sin base de datos */
  demo?: boolean;
  /**
   * Cuando se abre como capa sobre la cola (sin navegar), la cola pasa estas
   * dos funciones. Si no vienen, el formulario se comporta como página propia.
   */
  onCerrar?: () => void;
  onGuardado?: () => void;
  /** Empleado que está tomando el pedido (queda registrado en el pedido) */
  empleadoId?: string | null;
}

export function FormularioPedido({ catalogo, pedidoExistente, demo = false, onCerrar, onGuardado, empleadoId = null }: Props) {
  const router = useRouter();
  const comoCapa = Boolean(onCerrar);
  const { negocio, categorias, productos, cargos, config } = catalogo;
  // Lo que se suma al elegir "Domicilio" (cargos fijos que solo aplican a domicilio)
  const extraDomicilio = cargos.filter((c) => c.activo && c.tipo === "por_pedido" && c.solo_domicilio).reduce((s, c) => s + c.valor, 0);
  const editando = Boolean(pedidoExistente);

  const [nombre, setNombre] = useState(pedidoExistente?.cliente_nombre ?? "");
  const [telefono, setTelefono] = useState(pedidoExistente?.cliente_telefono ?? "");
  const [metodo, setMetodo] = useState<MetodoPago>(pedidoExistente?.metodo_pago ?? "efectivo");
  const [esDomicilio, setEsDomicilio] = useState(pedidoExistente?.es_domicilio ?? true);
  const [notas, setNotas] = useState(pedidoExistente?.notas ?? "");
  const [items, setItems] = useState<ItemBorrador[]>(() => (pedidoExistente ? borradoresDesdePedido(pedidoExistente, productos, categorias, config) : []));
  const [categoriaActiva, setCategoriaActiva] = useState<number>(categorias[0]?.id ?? 0);
  // Producto cuyo panel de ingredientes está desplegado (solo uno a la vez)
  const [abiertoClave, setAbiertoClave] = useState<string | null>(null);
  const [abrirX, setAbrirX] = useState(false);
  const [panelMovil, setPanelMovil] = useState<"productos" | "pedido">("productos");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ultimoAgregado, setUltimoAgregado] = useState<string | null>(null);

  const categoria = categorias.find((c) => c.id === categoriaActiva) ?? categorias[0];
  const productosVisibles = useMemo(() => productos.filter((p) => p.categoria_id === categoria?.id && p.activo), [productos, categoria]);

  const totales = useMemo(
    () => calcularTotales(items.map((it) => ({ precio_unitario: precioUnitarioBorrador(it, config), cantidad: it.cantidad, categoria_nombre: it.categoria_nombre })), cargos, categorias, esDomicilio),
    [items, cargos, categorias, config, esDomicilio],
  );
  const unidades = items.reduce((s, i) => s + i.cantidad, 0);

  function agregarProducto(p: Producto, cat: Categoria) {
    if (p.agotado) return;
    const nuevo = borradorDesdeProducto(p, cat);
    setItems((lista) => {
      const igual = lista.find((i) => mismaConfiguracion(i, nuevo));
      if (igual) return lista.map((i) => (i.clave === igual.clave ? { ...i, cantidad: i.cantidad + 1 } : i));
      return [...lista, nuevo];
    });
    // Al agregar algo personalizable se despliegan sus ingredientes: quitar es un toque más.
    setAbiertoClave(nuevo.ingredientes.length > 0 || nuevo.permite_combo ? nuevo.clave : null);
    setUltimoAgregado(p.nombre);
    setTimeout(() => setUltimoAgregado(null), 1200);
  }

  function cambiarCantidad(clave: string, delta: number) {
    setItems((lista) => lista.map((i) => (i.clave === clave ? { ...i, cantidad: i.cantidad + delta } : i)).filter((i) => i.cantidad > 0));
  }

  function actualizarItem(actualizado: ItemBorrador) {
    setItems((lista) => lista.map((i) => (i.clave === actualizado.clave ? actualizado : i)));
  }

  async function guardar() {
    setError(null);
    if (!nombre.trim()) {
      setError("Escribe el nombre del cliente.");
      setPanelMovil("pedido");
      return;
    }
    if (items.length === 0) {
      setError("Agrega al menos un producto.");
      setPanelMovil("productos");
      return;
    }
    if (demo) {
      setError("Vista previa: aquí se guardaría el pedido en Supabase.");
      return;
    }
    setGuardando(true);
    try {
      await guardarPedido(
        {
          id: pedidoExistente?.id,
          negocio_id: negocio.id,
          empleado_id: empleadoId,
          cliente_nombre: nombre.trim(),
          cliente_telefono: telefono.replace(/\D/g, ""),
          metodo_pago: metodo,
          es_domicilio: esDomicilio,
          notas: notas.trim(),
        },
        aItemsEntrada(items, config),
      );
      if (onGuardado) {
        onGuardado(); // capa sobre la cola: cierra y refresca sin recargar la página
      } else {
        router.replace("/comandas");
        router.refresh();
      }
    } catch (e) {
      setError(mensajeError(e));
      setGuardando(false);
    }
  }

  return (
    <div className={`flex flex-col bg-fondo ${comoCapa ? "fixed inset-0 z-40 h-dvh" : "h-dvh"}`}>
      {/* Cabecera */}
      <header className="flex items-center gap-3 border-b border-borde bg-fondo px-4 py-2.5">
        {comoCapa ? (
          <button type="button" onClick={onCerrar} className="btn bg-panel-2 px-3" aria-label="Volver a la cola">
            <ArrowLeft className="size-6" />
          </button>
        ) : (
          <Link href="/comandas" className="btn bg-panel-2 px-3" aria-label="Volver a la cola">
            <ArrowLeft className="size-6" />
          </Link>
        )}
        <h1 className="text-xl font-black">{editando ? `Editar pedido #${pedidoExistente!.numero_dia}` : "Nuevo pedido"}</h1>
        {ultimoAgregado && <span className="ml-2 hidden rounded-full bg-ok/20 px-3 py-1 text-sm font-bold text-ok sm:inline">+ {ultimoAgregado}</span>}
        {/* Conmutador móvil */}
        <div className="ml-auto flex gap-1 rounded-xl bg-panel-2 p-1 lg:hidden">
          <button type="button" onClick={() => setPanelMovil("productos")} className={`btn min-h-10 px-3 ${panelMovil === "productos" ? "bg-marca text-black" : ""}`}>
            <UtensilsCrossed className="size-5" /> Menú
          </button>
          <button type="button" onClick={() => setPanelMovil("pedido")} className={`btn min-h-10 px-3 ${panelMovil === "pedido" ? "bg-marca text-black" : ""}`}>
            <ShoppingBag className="size-5" /> Pedido ({unidades})
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[3fr_2fr]">
        {/* ===== Panel izquierdo: menú ===== */}
        <section className={`${panelMovil === "productos" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col border-r border-borde lg:flex`}>
          <nav className="flex flex-wrap gap-2 border-b border-borde px-3 py-2" aria-label="Categorías">
            {categorias.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoriaActiva(c.id)}
                className={`btn shrink-0 px-4 ${categoriaActiva === c.id ? "bg-marca text-black" : "bg-panel-2 text-texto-suave"}`}
              >
                <span className="text-lg">{c.emoji}</span> {c.nombre}
              </button>
            ))}
            <button type="button" onClick={() => setAbrirX(true)} className="btn shrink-0 border border-dashed border-texto-dim bg-transparent px-4 text-texto-suave">
              <Sparkles className="size-5" /> Producto X
            </button>
          </nav>

          <div className="scroll-fino grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto p-3 md:grid-cols-3">
            {productosVisibles.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={p.agotado}
                onClick={() => categoria && agregarProducto(p, categoria)}
                className={`tarjeta flex min-h-24 flex-col items-start justify-between p-3 text-left transition active:scale-[0.98] ${p.agotado ? "opacity-40" : "hover:border-marca/60"}`}
              >
                <span className="text-base font-extrabold leading-tight">{p.nombre.replace(/^(Hamburguesa|Perro Caliente|Salchipapa)\s+/i, "")}</span>
                <span className="mt-2 flex w-full items-end justify-between">
                  <span className="text-lg font-black text-marca-oscuro">{formatoCOP(p.precio)}</span>
                  {p.agotado ? (
                    <span className="rounded-md bg-peligro/20 px-1.5 text-xs font-bold text-peligro">AGOTADO</span>
                  ) : categoria?.permite_combo ? (
                    <span className="text-xs text-texto-suave">Combo {formatoCOP(p.precio_combo ?? p.precio + config.extra_combo)}</span>
                  ) : null}
                </span>
              </button>
            ))}
            {productosVisibles.length === 0 && <p className="col-span-full p-6 text-center text-texto-suave">Sin productos en esta categoría.</p>}
          </div>
        </section>

        {/* ===== Panel derecho: cliente + items + totales ===== */}
        <section className={`${panelMovil === "pedido" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col lg:flex`}>
          <div className="scroll-fino flex-1 overflow-y-auto p-4">
            {error && <Aviso tipo="error" className="mb-3">{error}</Aviso>}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm text-texto-suave">Nombre del cliente *</span>
                <input className="campo text-lg" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Ana María" autoFocus={!editando} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-texto-suave">Teléfono (WhatsApp)</span>
                <input className="campo text-lg tabular-nums" inputMode="numeric" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/[^\d\s+]/g, ""))} placeholder="322 243 0079" />
              </label>
            </div>

            <div className="mt-3">
              <span className="mb-1 block text-sm text-texto-suave">Método de pago</span>
              <div className="flex flex-wrap gap-2">
                {METODOS_PAGO.map((m) => (
                  <button key={m.valor} type="button" onClick={() => setMetodo(m.valor)} className={`btn min-h-11 px-4 ${metodo === m.valor ? "bg-marca text-black" : "bg-panel-2"}`}>
                    {m.etiqueta}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setEsDomicilio(true)} className={`btn ${esDomicilio ? "bg-marca text-black" : "bg-panel-2"}`}>
                <Bike className="size-5" /> Domicilio{extraDomicilio > 0 ? ` (+${formatoCOP(extraDomicilio)})` : ""}
              </button>
              <button type="button" onClick={() => setEsDomicilio(false)} className={`btn ${!esDomicilio ? "bg-marca text-black" : "bg-panel-2"}`}>
                <Store className="size-5" /> Recoge
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <h2 className="text-lg font-black">Productos ({unidades})</h2>
              {items.length > 0 && (
                <button type="button" onClick={() => setItems([])} className="text-sm text-texto-suave underline">Vaciar</button>
              )}
            </div>

            {items.length === 0 ? (
              <p className="mt-2 rounded-xl border border-dashed border-borde p-5 text-center text-texto-suave">
                Toca los productos del menú para agregarlos.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {items.map((it) => (
                  <ItemPedido
                    key={it.clave}
                    item={it}
                    config={config}
                    abierto={abiertoClave === it.clave}
                    onAlternar={() => setAbiertoClave((c) => (c === it.clave ? null : it.clave))}
                    onCambiar={actualizarItem}
                    onCantidad={(delta) => cambiarCantidad(it.clave, delta)}
                  />
                ))}
              </ul>
            )}

            <label className="mt-4 block">
              <span className="mb-1 block text-sm text-texto-suave">Notas del pedido</span>
              <textarea className="campo min-h-16" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: timbrar dos veces, llevar cambio de $50.000" />
            </label>
          </div>

          {/* Resumen fijo */}
          <div className="border-t border-borde bg-panel p-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-texto-suave">
              <dt>Subtotal</dt>
              <dd className="text-right tabular-nums">{formatoCOP(totales.subtotal)}</dd>
              {totales.cargos.map((c) => (
                <Fragment key={c.nombre}>
                  <dt>{c.nombre}</dt>
                  <dd className="text-right tabular-nums">{formatoCOP(c.valor)}</dd>
                </Fragment>
              ))}
            </dl>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-lg font-bold">Total</span>
              <span className="text-4xl font-black tabular-nums">{formatoCOP(totales.total)}</span>
            </div>
            <button type="button" onClick={() => void guardar()} disabled={guardando} className="btn mt-3 w-full bg-ok text-xl text-white">
              <Save className="size-6" /> {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Guardar pedido"}
            </button>
          </div>
        </section>
      </div>

      <ProductoX
        abierto={abrirX}
        categorias={categorias}
        categoriaInicial={categoria?.nombre ?? ""}
        onCerrar={() => setAbrirX(false)}
        onAgregar={(item) => {
          setItems((lista) => [...lista, item]);
          setAbrirX(false);
          setUltimoAgregado(item.nombre);
          setTimeout(() => setUltimoAgregado(null), 1200);
        }}
      />
    </div>
  );
}
