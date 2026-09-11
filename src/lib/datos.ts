"use client";

// Acceso a datos desde el navegador (lecturas, RPC y tiempo real).
// Las escrituras pasan por las funciones RPC de supabase/01_schema.sql, que recalculan totales.

import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabaseNavegador } from "./supabase/client";
import { type Categoria, type EstadoPedido, type PedidoConItems, type PedidoEntrada, type PedidoItem, type Producto } from "./tipos";
import { fechaISOBogota, type Rango } from "./fechas";
// armarConfig y Catalogo viven en ./catalogo (sin "use client") para que también
// los pueda usar el servidor. Se reexporta el tipo por comodidad de los componentes.
import { armarConfig, type Catalogo } from "./catalogo";

export type { Catalogo };

export async function cargarCatalogo(): Promise<Catalogo> {
  const sb = supabaseNavegador();
  const [cat, prod, conf] = await Promise.all([
    sb.from("categorias").select("*").order("orden"),
    sb.from("productos").select("*").order("orden").order("nombre"),
    sb.from("configuracion").select("clave, valor"),
  ]);
  if (cat.error) throw cat.error;
  if (prod.error) throw prod.error;
  if (conf.error) throw conf.error;
  return { categorias: cat.data as Categoria[], productos: prod.data as Producto[], config: armarConfig(conf.data) };
}

const SELECT_PEDIDO = "*, pedido_items(*)";

/** Pedidos del día de negocio actual (todos los estados) + pendientes de días anteriores */
export async function cargarPedidosHoy(): Promise<PedidoConItems[]> {
  const sb = supabaseNavegador();
  const hoy = fechaISOBogota();
  const { data, error } = await sb
    .from("pedidos")
    .select(SELECT_PEDIDO)
    .or(`dia_negocio.eq.${hoy},estado.eq.pendiente`)
    .order("creado_en", { ascending: true });
  if (error) throw error;
  return ordenarItems(data as PedidoConItems[]);
}

export async function cargarPedido(id: number): Promise<PedidoConItems | null> {
  const sb = supabaseNavegador();
  const { data, error } = await sb.from("pedidos").select(SELECT_PEDIDO).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? ordenarItems([data as PedidoConItems])[0] : null;
}

/** Pedidos de un rango de días de negocio (para el panel) */
export async function cargarPedidosRango(rango: Rango): Promise<PedidoConItems[]> {
  const sb = supabaseNavegador();
  const { data, error } = await sb
    .from("pedidos")
    .select(SELECT_PEDIDO)
    .gte("dia_negocio", rango.desde)
    .lte("dia_negocio", rango.hasta)
    .order("creado_en", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return ordenarItems(data as PedidoConItems[]);
}

function ordenarItems(pedidos: PedidoConItems[]): PedidoConItems[] {
  for (const p of pedidos) p.pedido_items = (p.pedido_items ?? []).sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  return pedidos;
}

export type ItemEntrada = Omit<PedidoItem, "id" | "pedido_id">;

export async function guardarPedido(pedido: PedidoEntrada, items: ItemEntrada[]): Promise<number> {
  const sb = supabaseNavegador();
  const { data, error } = await sb.rpc("guardar_pedido", { p_pedido: pedido, p_items: items });
  if (error) throw new Error(mensajeError(error));
  return Number(data);
}

/** Marca como revisado un pedido que trajo el bot de WhatsApp */
export async function aprobarPedido(id: number): Promise<void> {
  const sb = supabaseNavegador();
  const { error } = await sb.rpc("aprobar_pedido", { p_id: id });
  if (error) throw new Error(mensajeError(error));
}

export async function cambiarEstado(id: number, estado: EstadoPedido, motivo?: string): Promise<void> {
  const sb = supabaseNavegador();
  const { error } = await sb.rpc("cambiar_estado", { p_id: id, p_estado: estado, p_motivo: motivo ?? null });
  if (error) throw new Error(mensajeError(error));
}

export type TablaCambiada = "pedidos" | "pedido_items" | "configuracion" | "productos";

/**
 * Se suscribe a cambios y avisa qué tabla cambió (con debounce), para que la
 * pantalla recargue solo lo necesario en vez de todo.
 */
export function suscribirPedidos(alCambiar: (tabla: TablaCambiada) => void): () => void {
  const sb = supabaseNavegador();
  const temporizadores = new Map<TablaCambiada, ReturnType<typeof setTimeout>>();
  const avisar = (tabla: TablaCambiada) => () => {
    const previo = temporizadores.get(tabla);
    if (previo) clearTimeout(previo);
    temporizadores.set(tabla, setTimeout(() => alCambiar(tabla), 250));
  };
  const canal: RealtimeChannel = sb
    .channel("cola-pedidos")
    .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, avisar("pedidos"))
    .on("postgres_changes", { event: "*", schema: "public", table: "pedido_items" }, avisar("pedido_items"))
    .on("postgres_changes", { event: "*", schema: "public", table: "configuracion" }, avisar("configuracion"))
    .on("postgres_changes", { event: "*", schema: "public", table: "productos" }, avisar("productos"))
    .subscribe();
  return () => {
    for (const t of temporizadores.values()) clearTimeout(t);
    sb.removeChannel(canal);
  };
}

export async function cerrarSesion(): Promise<void> {
  await supabaseNavegador().auth.signOut();
}

export function mensajeError(e: unknown): string {
  if (!e) return "Error desconocido";
  if (typeof e === "string") return e;
  const err = e as { message?: string; details?: string; hint?: string };
  return err.message || err.details || err.hint || "Error inesperado";
}
