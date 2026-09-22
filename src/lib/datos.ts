"use client";

// Acceso a datos desde el navegador (lecturas, RPC y tiempo real), siempre
// acotado a un negocio. Las escrituras pasan por las funciones RPC de
// supabase/06_multinegocio.sql, que recalculan totales y validan pertenencia.

import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabaseNavegador } from "./supabase/client";
import {
  type Cargo,
  type Categoria,
  type Empleado,
  type EstadoPedido,
  type EventoPedido,
  type ImportacionMenu,
  type MenuImportado,
  type Negocio,
  type PedidoConItems,
  type PedidoEntrada,
  type PedidoItem,
  type Producto,
} from "./tipos";
import { fechaISOBogota, type Rango } from "./fechas";
import { armarConfig, type Catalogo } from "./catalogo";

export type { Catalogo };

const SELECT_PEDIDO = "*, pedido_items(*), empleados(nombre)";
const SELECT_EMPLEADO = "id, negocio_id, nombre, es_dueno, activo, creado_en";

// ---------- Negocio ----------

export async function cargarNegocio(negocioId: string): Promise<Negocio> {
  const { data, error } = await supabaseNavegador().from("negocios").select("*").eq("id", negocioId).single();
  if (error) throw new Error(mensajeError(error));
  return data as Negocio;
}

export async function actualizarNegocio(negocioId: string, cambios: Partial<Pick<Negocio, "nombre" | "logo_url" | "telefono_whatsapp" | "combo_descripcion">>): Promise<void> {
  const { error } = await supabaseNavegador().from("negocios").update(cambios).eq("id", negocioId);
  if (error) throw new Error(mensajeError(error));
}

export async function regenerarClaveIntegracion(negocioId: string): Promise<string> {
  const { data, error } = await supabaseNavegador().rpc("regenerar_clave_integracion", { p_negocio: negocioId });
  if (error) throw new Error(mensajeError(error));
  return String(data);
}

/** Sube el logo al bucket público y devuelve la URL */
export async function subirLogo(negocioId: string, archivo: File): Promise<string> {
  const sb = supabaseNavegador();
  const ext = (archivo.name.split(".").pop() || "png").toLowerCase();
  const ruta = `${negocioId}/logo-${Date.now()}.${ext}`;
  const { error } = await sb.storage.from("logos").upload(ruta, archivo, { upsert: true, contentType: archivo.type });
  if (error) throw new Error(mensajeError(error));
  return sb.storage.from("logos").getPublicUrl(ruta).data.publicUrl;
}

// ---------- Catálogo ----------

export async function cargarCatalogo(negocioId: string): Promise<Catalogo> {
  const sb = supabaseNavegador();
  const [neg, cat, prod, cargos, conf] = await Promise.all([
    sb.from("negocios").select("*").eq("id", negocioId).single(),
    sb.from("categorias").select("*").eq("negocio_id", negocioId).order("orden"),
    sb.from("productos").select("*").eq("negocio_id", negocioId).order("orden").order("nombre"),
    sb.from("cargos").select("*").eq("negocio_id", negocioId).order("orden"),
    sb.from("configuracion").select("clave, valor").eq("negocio_id", negocioId),
  ]);
  for (const r of [neg, cat, prod, cargos, conf]) if (r.error) throw new Error(mensajeError(r.error));
  return {
    negocio: neg.data as Negocio,
    categorias: cat.data as Categoria[],
    productos: prod.data as Producto[],
    cargos: cargos.data as Cargo[],
    config: armarConfig(conf.data),
  };
}

export async function crearCategoria(negocioId: string, nombre: string, emoji = "🍽️", permiteCombo = false): Promise<Categoria> {
  const sb = supabaseNavegador();
  const { count } = await sb.from("categorias").select("id", { count: "exact", head: true }).eq("negocio_id", negocioId);
  const { data, error } = await sb
    .from("categorias")
    .insert({ negocio_id: negocioId, nombre: nombre.trim(), emoji, permite_combo: permiteCombo, orden: (count ?? 0) + 1 })
    .select("*")
    .single();
  if (error) throw new Error(mensajeError(error));
  return data as Categoria;
}

export async function actualizarCategoria(id: number, cambios: Partial<Pick<Categoria, "nombre" | "emoji" | "permite_combo" | "orden">>): Promise<void> {
  const { error } = await supabaseNavegador().from("categorias").update(cambios).eq("id", id);
  if (error) throw new Error(mensajeError(error));
}

// ---------- Cargos ----------

export async function guardarCargo(cargo: Omit<Cargo, "id"> & { id?: number }): Promise<void> {
  const sb = supabaseNavegador();
  const { id, ...resto } = cargo;
  const { error } = id ? await sb.from("cargos").update(resto).eq("id", id) : await sb.from("cargos").insert(resto);
  if (error) throw new Error(mensajeError(error));
}

export async function eliminarCargo(id: number): Promise<void> {
  const { error } = await supabaseNavegador().from("cargos").delete().eq("id", id);
  if (error) throw new Error(mensajeError(error));
}

// ---------- Empleados ----------

export async function cargarEmpleados(negocioId: string, soloActivos = false): Promise<Empleado[]> {
  let q = supabaseNavegador().from("empleados").select(SELECT_EMPLEADO).eq("negocio_id", negocioId);
  if (soloActivos) q = q.eq("activo", true);
  const { data, error } = await q.order("es_dueno", { ascending: false }).order("nombre");
  if (error) throw new Error(mensajeError(error));
  return data as Empleado[];
}

export async function crearEmpleado(negocioId: string, nombre: string, pin: string, esDueno = false): Promise<string> {
  const { data, error } = await supabaseNavegador().rpc("crear_empleado", { p_negocio: negocioId, p_nombre: nombre, p_pin: pin, p_es_dueno: esDueno });
  if (error) throw new Error(mensajeError(error));
  return String(data);
}

export async function cambiarPin(empleadoId: string, pin: string): Promise<void> {
  const { error } = await supabaseNavegador().rpc("cambiar_pin", { p_empleado: empleadoId, p_pin: pin });
  if (error) throw new Error(mensajeError(error));
}

export async function actualizarEmpleado(id: string, cambios: Partial<Pick<Empleado, "nombre" | "es_dueno" | "activo">>): Promise<void> {
  const { error } = await supabaseNavegador().from("empleados").update(cambios).eq("id", id);
  if (error) throw new Error(mensajeError(error));
}

/** Devuelve el empleado si el PIN es correcto, null si no */
export async function verificarPin(negocioId: string, empleadoId: string, pin: string): Promise<{ id: string; nombre: string; es_dueno: boolean } | null> {
  const { data, error } = await supabaseNavegador().rpc("verificar_pin", { p_negocio: negocioId, p_empleado: empleadoId, p_pin: pin });
  if (error) throw new Error(mensajeError(error));
  const filas = (data ?? []) as { id: string; nombre: string; es_dueno: boolean }[];
  return filas[0] ?? null;
}

// ---------- Importación de menú ----------

export async function cargarImportaciones(negocioId: string): Promise<ImportacionMenu[]> {
  const { data, error } = await supabaseNavegador().from("importaciones_menu").select("*").eq("negocio_id", negocioId).order("creado_en", { ascending: false }).limit(10);
  if (error) throw new Error(mensajeError(error));
  return data as ImportacionMenu[];
}

export async function importarMenu(negocioId: string, resultado: MenuImportado, importacionId?: string): Promise<{ nuevos: number; actualizados: number }> {
  const sb = supabaseNavegador();
  const { data, error } = await sb.rpc("importar_menu", { p_negocio: negocioId, p_resultado: resultado });
  if (error) throw new Error(mensajeError(error));
  if (importacionId) await sb.from("importaciones_menu").update({ estado: "aplicado", resultado }).eq("id", importacionId);
  return data as { nuevos: number; actualizados: number };
}

// ---------- Pedidos ----------

/** Pedidos del día de negocio actual (todos los estados) + pendientes de días anteriores */
export async function cargarPedidosHoy(negocioId: string): Promise<PedidoConItems[]> {
  const hoy = fechaISOBogota();
  const { data, error } = await supabaseNavegador()
    .from("pedidos")
    .select(SELECT_PEDIDO)
    .eq("negocio_id", negocioId)
    .or(`dia_negocio.eq.${hoy},estado.eq.pendiente`)
    .order("creado_en", { ascending: true });
  if (error) throw error;
  return ordenarItems(data as PedidoConItems[]);
}

export async function cargarPedido(negocioId: string, id: number): Promise<PedidoConItems | null> {
  const { data, error } = await supabaseNavegador().from("pedidos").select(SELECT_PEDIDO).eq("negocio_id", negocioId).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? ordenarItems([data as PedidoConItems])[0] : null;
}

/** Pedidos de un rango de días de negocio (para el panel) */
export async function cargarPedidosRango(negocioId: string, rango: Rango): Promise<PedidoConItems[]> {
  const { data, error } = await supabaseNavegador()
    .from("pedidos")
    .select(SELECT_PEDIDO)
    .eq("negocio_id", negocioId)
    .gte("dia_negocio", rango.desde)
    .lte("dia_negocio", rango.hasta)
    .order("creado_en", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return ordenarItems(data as PedidoConItems[]);
}

/**
 * Historial de un pedido: cuándo se creó, cada edición con cómo estaba antes,
 * y cuándo se entregó o canceló. Es lo que se mira cuando un cliente reclama.
 */
export async function cargarHistorialPedido(negocioId: string, pedidoId: number): Promise<EventoPedido[]> {
  const { data, error } = await supabaseNavegador()
    .from("pedido_eventos")
    .select("id, pedido_id, tipo, datos, creado_en")
    .eq("negocio_id", negocioId)
    .eq("pedido_id", pedidoId)
    .order("creado_en", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventoPedido[];
}

function ordenarItems(pedidos: PedidoConItems[]): PedidoConItems[] {
  for (const p of pedidos) p.pedido_items = (p.pedido_items ?? []).sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  return pedidos;
}

export type ItemEntrada = Omit<PedidoItem, "id" | "pedido_id">;

export async function guardarPedido(pedido: PedidoEntrada, items: ItemEntrada[]): Promise<number> {
  const { data, error } = await supabaseNavegador().rpc("guardar_pedido", { p_pedido: pedido, p_items: items });
  if (error) throw new Error(mensajeError(error));
  return Number(data);
}

/** Marca como revisado un pedido que trajo el bot de WhatsApp */
export async function aprobarPedido(id: number): Promise<void> {
  const { error } = await supabaseNavegador().rpc("aprobar_pedido", { p_id: id });
  if (error) throw new Error(mensajeError(error));
}

export async function cambiarEstado(id: number, estado: EstadoPedido, motivo?: string): Promise<void> {
  const { error } = await supabaseNavegador().rpc("cambiar_estado", { p_id: id, p_estado: estado, p_motivo: motivo ?? null });
  if (error) throw new Error(mensajeError(error));
}

export type TablaCambiada = "pedidos" | "pedido_items" | "configuracion" | "productos" | "cargos" | "categorias";

/**
 * Se suscribe a los cambios del negocio y avisa qué tabla cambió (con debounce),
 * para que la pantalla recargue solo lo necesario.
 */
export function suscribirPedidos(negocioId: string, alCambiar: (tabla: TablaCambiada) => void): () => void {
  const sb = supabaseNavegador();
  const temporizadores = new Map<TablaCambiada, ReturnType<typeof setTimeout>>();
  const avisar = (tabla: TablaCambiada) => () => {
    const previo = temporizadores.get(tabla);
    if (previo) clearTimeout(previo);
    temporizadores.set(tabla, setTimeout(() => alCambiar(tabla), 250));
  };
  const filtro = `negocio_id=eq.${negocioId}`;
  const canal: RealtimeChannel = sb
    .channel(`negocio-${negocioId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "pedidos", filter: filtro }, avisar("pedidos"))
    // pedido_items no tiene negocio_id: se escucha sin filtro y la recarga ya filtra por negocio
    .on("postgres_changes", { event: "*", schema: "public", table: "pedido_items" }, avisar("pedido_items"))
    .on("postgres_changes", { event: "*", schema: "public", table: "configuracion", filter: filtro }, avisar("configuracion"))
    .on("postgres_changes", { event: "*", schema: "public", table: "productos", filter: filtro }, avisar("productos"))
    .on("postgres_changes", { event: "*", schema: "public", table: "cargos", filter: filtro }, avisar("cargos"))
    .subscribe();
  return () => {
    for (const t of temporizadores.values()) clearTimeout(t);
    sb.removeChannel(canal);
  };
}

// ---------- Sesión ----------

export async function cerrarSesion(): Promise<void> {
  await supabaseNavegador().auth.signOut();
}

export function mensajeError(e: unknown): string {
  if (!e) return "Error desconocido";
  if (typeof e === "string") return e;
  const err = e as { message?: string; details?: string; hint?: string };
  return err.message || err.details || err.hint || "Error inesperado";
}
