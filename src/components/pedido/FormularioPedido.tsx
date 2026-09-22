"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { ArrowLeft, Bike, ClipboardList, Phone, Save, Search, ShoppingBag, Sparkles, Store, Trash2, UserRound, UtensilsCrossed, X } from "lucide-react";
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

/** Quita del nombre lo que ya dice la categoría, para que quepa en la tarjeta */
const nombreCorto = (nombre: string) => nombre.replace(/^(Hamburguesa|Perro Caliente|Salchipapa)\s+/i, "");

/** Para buscar sin que estorben las tildes ni las mayúsculas */
const sinTildes = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

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
  const [busqueda, setBusqueda] = useState("");
  // Producto cuyo panel de ingredientes está desplegado (solo uno a la vez)
  const [abiertoClave, setAbiertoClave] = useState<string | null>(null);
  // Última fila tocada: se trae a la vista y se resalta, para no perderla en una lista larga
  const [ultimaClave, setUltimaClave] = useState<string | null>(null);
  const [abrirX, setAbrirX] = useState(false);
  const [panelMovil, setPanelMovil] = useState<"productos" | "pedido">("productos");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ultimoAgregado, setUltimoAgregado] = useState<string | null>(null);

  const categoria = categorias.find((c) => c.id === categoriaActiva) ?? categorias[0];
  const categoriaDe = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);
  const buscando = busqueda.trim().length > 0;

  // Buscando se mira todo el menú: la gracia es encontrar la gaseosa sin recordar
  // en qué categoría quedó.
  const productosVisibles = useMemo(() => {
    const activos = productos.filter((p) => p.activo);
    if (!buscando) return activos.filter((p) => p.categoria_id === categoria?.id);
    const q = sinTildes(busqueda.trim());
    return activos.filter((p) => sinTildes(p.nombre).includes(q));
  }, [productos, categoria, busqueda, buscando]);

  const totales = useMemo(
    () => calcularTotales(items.map((it) => ({ precio_unitario: precioUnitarioBorrador(it, config), cantidad: it.cantidad, categoria_nombre: it.categoria_nombre })), cargos, categorias, esDomicilio),
    [items, cargos, categorias, config, esDomicilio],
  );
  const unidades = items.reduce((s, i) => s + i.cantidad, 0);

  function agregarProducto(p: Producto, cat: Categoria) {
    if (p.agotado) return;
    const nuevo = borradorDesdeProducto(p, cat);
    const igual = items.find((i) => mismaConfiguracion(i, nuevo));
    if (igual) {
      // Ya estaba en la comanda: sube la cantidad y no se toca el panel abierto
      setItems((lista) => lista.map((i) => (i.clave === igual.clave ? { ...i, cantidad: i.cantidad + 1 } : i)));
      setUltimaClave(igual.clave);
    } else {
      setItems((lista) => [...lista, nuevo]);
      // Al agregar algo personalizable se despliegan sus ingredientes: quitar es un toque más.
      setAbiertoClave(nuevo.ingredientes.length > 0 || nuevo.permite_combo ? nuevo.clave : null);
      setUltimaClave(nuevo.clave);
    }
    setUltimoAgregado(p.nombre);
    setTimeout(() => setUltimoAgregado(null), 1200);
  }

  function cambiarCantidad(clave: string, delta: number) {
    setItems((lista) => lista.map((i) => (i.clave === clave ? { ...i, cantidad: i.cantidad + delta } : i)).filter((i) => i.cantidad > 0));
  }

  function quitarItem(clave: string) {
    setItems((lista) => lista.filter((i) => i.clave !== clave));
    if (abiertoClave === clave) setAbiertoClave(null);
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
      setError("Esto es una demostración: el pedido no se guarda. Crea tu cuenta gratis para tomar pedidos de verdad.");
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
      {/* Cabecera: volver, título y los datos del cliente. En celular los campos
          bajan solos a una segunda fila, así no hay que duplicarlos. */}
      <header className="flex flex-wrap items-center gap-2 border-b border-borde bg-fondo px-3 py-2">
        {comoCapa ? (
          <button type="button" data-tour="volver" onClick={onCerrar} className="btn bg-panel-2 px-3" aria-label="Volver a la cola">
            <ArrowLeft className="size-6" />
          </button>
        ) : (
          <Link href="/comandas" className="btn bg-panel-2 px-3" aria-label="Volver a la cola">
            <ArrowLeft className="size-6" />
          </Link>
        )}
        <h1 className="text-xl font-black">{editando ? `Editar #${pedidoExistente!.numero_dia}` : "Nueva comanda"}</h1>
        {ultimoAgregado && <span className="hidden rounded-full bg-ok/20 px-3 py-1 text-sm font-bold text-ok xl:inline">+ {ultimoAgregado}</span>}

        {/* Conmutador móvil */}
        <div className="ml-auto flex gap-1 rounded-xl bg-panel-2 p-1 lg:hidden">
          <button type="button" onClick={() => setPanelMovil("productos")} className={`btn min-h-10 px-3 ${panelMovil === "productos" ? "bg-marca text-black" : ""}`}>
            <UtensilsCrossed className="size-5" /> Menú
          </button>
          <button type="button" onClick={() => setPanelMovil("pedido")} className={`btn min-h-10 px-3 ${panelMovil === "pedido" ? "bg-marca text-black" : ""}`}>
            <ShoppingBag className="size-5" /> Pedido ({unidades})
          </button>
        </div>

        <div className="order-last flex w-full items-center gap-2 lg:order-none lg:ml-auto lg:w-auto">
          <Campo icono={<UserRound className="size-5 shrink-0 text-texto-dim" />} ancho="lg:w-64">
            <input
              className="min-h-11 w-full bg-transparent text-base outline-none placeholder:text-texto-dim"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del cliente *"
              aria-label="Nombre del cliente"
              autoFocus={!editando}
            />
          </Campo>
          <Campo icono={<Phone className="size-5 shrink-0 text-texto-dim" />} ancho="lg:w-52">
            <input
              className="min-h-11 w-full bg-transparent text-base tabular-nums outline-none placeholder:text-texto-dim"
              inputMode="numeric"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/[^\d\s+]/g, ""))}
              placeholder="Teléfono"
              aria-label="Teléfono del cliente"
            />
          </Campo>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[2fr_3fr]">
        {/* ===== Panel izquierdo: menú ===== */}
        <section className={`${panelMovil === "productos" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col border-r border-borde lg:flex`}>
          <nav className="flex flex-wrap gap-2 border-b border-borde px-3 py-2" aria-label="Categorías">
            {categorias.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCategoriaActiva(c.id);
                  setBusqueda("");
                }}
                className={`btn shrink-0 px-4 ${!buscando && categoriaActiva === c.id ? "bg-marca text-black" : "bg-panel-2 text-texto-suave"}`}
              >
                <span className="text-lg">{c.emoji}</span> {c.nombre}
              </button>
            ))}
            <button type="button" onClick={() => setAbrirX(true)} className="btn shrink-0 border border-dashed border-texto-dim bg-transparent px-4 text-texto-suave">
              <Sparkles className="size-5" /> Producto X
            </button>
          </nav>

          <div className="border-b border-borde px-3 py-2">
            <Campo icono={<Search className="size-5 shrink-0 text-texto-dim" />}>
              <input
                className="min-h-11 w-full bg-transparent text-base outline-none placeholder:text-texto-dim"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setBusqueda("")}
                placeholder="Buscar producto…"
                aria-label="Buscar producto en todo el menú"
              />
              {buscando && (
                <button type="button" onClick={() => setBusqueda("")} className="shrink-0 rounded-lg p-1 text-texto-suave" aria-label="Limpiar búsqueda">
                  <X className="size-5" />
                </button>
              )}
            </Campo>
          </div>

          <div data-tour="productos" className="scroll-fino grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto p-3 xl:grid-cols-3">
            {productosVisibles.map((p) => {
              const cat = categoriaDe.get(p.categoria_id);
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={p.agotado}
                  onClick={() => cat && agregarProducto(p, cat)}
                  className={`tarjeta flex min-h-24 flex-col items-start justify-between p-3 text-left transition active:scale-[0.98] ${p.agotado ? "opacity-40" : "hover:border-marca/60"}`}
                >
                  {/* Dentro de una categoría sobra repetir su nombre: "Hamburguesa
                      Ranchera" es solo "Ranchera". Buscando sí va completo, que
                      ahí los resultados vienen de todo el menú. */}
                  <span className="text-base font-extrabold leading-tight">{buscando ? p.nombre : nombreCorto(p.nombre)}</span>
                  {buscando && <span className="mt-0.5 text-xs text-texto-suave">{cat?.emoji} {cat?.nombre}</span>}
                  <span className="mt-2 flex w-full items-end justify-between gap-1">
                    <span className="text-lg font-black text-marca-oscuro">{formatoCOP(p.precio)}</span>
                    {p.agotado ? (
                      <span className="rounded-md bg-peligro/20 px-1.5 text-xs font-bold text-peligro">AGOTADO</span>
                    ) : cat?.permite_combo ? (
                      <span className="text-xs text-texto-suave">Combo {formatoCOP(p.precio_combo ?? p.precio + config.extra_combo)}</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
            {productosVisibles.length === 0 && (
              <p className="col-span-full p-6 text-center text-texto-suave">
                {buscando ? `Ningún producto se llama «${busqueda.trim()}».` : "Sin productos en esta categoría."}
              </p>
            )}
          </div>
        </section>

        {/* ===== Panel derecho: la comanda ===== */}
        <section className={`${panelMovil === "pedido" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col lg:flex`}>
          {/* 1. Encabezado */}
          <div className="flex items-center gap-2 border-b border-borde px-4 py-2.5">
            <ClipboardList className="size-5 text-texto-suave" />
            <h2 className="text-base font-black uppercase tracking-wide">
              Pedido <span className="font-bold text-texto-suave">({unidades} {unidades === 1 ? "producto" : "productos"})</span>
            </h2>
            {items.length > 0 && (
              <button type="button" onClick={() => setItems([])} className="ml-auto flex items-center gap-1 text-sm text-texto-suave underline">
                <Trash2 className="size-4" /> Vaciar pedido
              </button>
            )}
          </div>

          {/* 2. Lista: se queda con toda la altura que sobra */}
          <div className="scroll-fino min-h-0 flex-1 overflow-y-auto p-3">
            {items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-borde p-6 text-center text-texto-suave">Toca los productos del menú para agregarlos.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((it) => (
                  <ItemPedido
                    key={it.clave}
                    item={it}
                    config={config}
                    abierto={abiertoClave === it.clave}
                    destacado={ultimaClave === it.clave}
                    onAlternar={() => setAbiertoClave((c) => (c === it.clave ? null : it.clave))}
                    onCambiar={actualizarItem}
                    onCantidad={(delta) => cambiarCantidad(it.clave, delta)}
                    onQuitar={() => quitarItem(it.clave)}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* 3. Pago y entrega: se tocan una vez por pedido, así que van pequeños */}
          <div className="border-t border-borde bg-panel-2/50 px-4 py-2.5">
            <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
              <div>
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-texto-suave">Método de pago</span>
                {/* En celular se deslizan de lado en vez de gastar dos filas */}
                <div className="scroll-fino flex gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-x-visible">
                  {METODOS_PAGO.map((m) => (
                    <button
                      key={m.valor}
                      type="button"
                      onClick={() => setMetodo(m.valor)}
                      className={`btn min-h-10 shrink-0 px-3 text-sm ${metodo === m.valor ? "bg-marca text-black" : "bg-panel"}`}
                    >
                      {m.etiqueta}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-texto-suave">Entrega</span>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => setEsDomicilio(true)} className={`btn min-h-10 px-3 text-sm ${esDomicilio ? "bg-marca text-black" : "bg-panel"}`}>
                    <Bike className="size-4" /> Domicilio{extraDomicilio > 0 ? ` (+${formatoCOP(extraDomicilio)})` : ""}
                  </button>
                  <button type="button" onClick={() => setEsDomicilio(false)} className={`btn min-h-10 px-3 text-sm ${!esDomicilio ? "bg-marca text-black" : "bg-panel"}`}>
                    <Store className="size-4" /> Recoge
                  </button>
                </div>
              </div>
            </div>
            <Campo className="mt-2">
              <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-texto-suave">Nota</span>
              <input
                className="min-h-10 w-full bg-transparent text-sm outline-none placeholder:text-texto-dim"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: timbrar dos veces, llevar cambio de $50.000"
                aria-label="Notas del pedido"
              />
            </Campo>
          </div>

          {/* 4. Totales */}
          <div data-tour="totales" className="border-t border-borde bg-panel p-3">
            {error && <Aviso tipo="error" className="mb-2">{error}</Aviso>}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="min-w-0 flex-1 text-sm text-texto-suave">
                Subtotal <b className="tabular-nums text-texto">{formatoCOP(totales.subtotal)}</b>
                {totales.cargos.map((c) => (
                  <Fragment key={c.nombre}>
                    {" · "}
                    {c.nombre} <b className="tabular-nums text-texto">{formatoCOP(c.valor)}</b>
                  </Fragment>
                ))}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-texto-suave">Total</span>
                <span className="text-3xl font-black tabular-nums">{formatoCOP(totales.total)}</span>
              </div>
              <button type="button" onClick={() => void guardar()} disabled={guardando} className="btn w-full bg-ok text-lg text-white sm:w-auto sm:px-8">
                <Save className="size-6" /> {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Guardar pedido"}
              </button>
            </div>
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
          setUltimaClave(item.clave);
          setUltimoAgregado(item.nombre);
          setTimeout(() => setUltimoAgregado(null), 1200);
        }}
      />
    </div>
  );
}

/**
 * Caja con ícono adentro. El borde y el foco viven en la caja, no en el input,
 * para no pelear con los padding de la utilidad `campo`.
 */
function Campo({ icono, children, ancho = "", className = "" }: { icono?: React.ReactNode; children: React.ReactNode; ancho?: string; className?: string }) {
  return (
    <label
      className={`flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-borde bg-panel px-3 focus-within:border-marca focus-within:shadow-[0_0_0_3px_rgba(217,168,51,0.25)] ${ancho} ${ancho ? "lg:flex-none" : ""} ${className}`}
    >
      {icono}
      {children}
    </label>
  );
}
