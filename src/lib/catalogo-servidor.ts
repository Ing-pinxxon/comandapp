// Lecturas iniciales desde Server Components (misma forma que lib/datos.ts pero con el cliente de servidor)

import { supabaseServidor } from "./supabase/server";
import { armarConfig, type Catalogo } from "./catalogo";
import type { Cargo, Categoria, Empleado, Negocio, PedidoConItems, Producto } from "./tipos";
import { fechaISOBogota } from "./fechas";

export const SELECT_PEDIDO = "*, pedido_items(*), empleados(nombre)";
export const SELECT_EMPLEADO = "id, negocio_id, nombre, es_dueno, activo, creado_en";

export async function catalogoServidor(negocio: Negocio): Promise<Catalogo> {
  const sb = await supabaseServidor();
  const [cat, prod, cargos, conf] = await Promise.all([
    sb.from("categorias").select("*").eq("negocio_id", negocio.id).order("orden"),
    sb.from("productos").select("*").eq("negocio_id", negocio.id).order("orden").order("nombre"),
    sb.from("cargos").select("*").eq("negocio_id", negocio.id).order("orden"),
    sb.from("configuracion").select("clave, valor").eq("negocio_id", negocio.id),
  ]);
  return {
    negocio,
    categorias: (cat.data ?? []) as Categoria[],
    productos: (prod.data ?? []) as Producto[],
    cargos: (cargos.data ?? []) as Cargo[],
    config: armarConfig(conf.data),
  };
}

export async function pedidosHoyServidor(negocioId: string): Promise<PedidoConItems[]> {
  const sb = await supabaseServidor();
  const hoy = fechaISOBogota();
  const { data } = await sb
    .from("pedidos")
    .select(SELECT_PEDIDO)
    .eq("negocio_id", negocioId)
    .or(`dia_negocio.eq.${hoy},estado.eq.pendiente`)
    .order("creado_en", { ascending: true });
  return (data ?? []) as PedidoConItems[];
}

export async function pedidoServidor(negocioId: string, id: number): Promise<PedidoConItems | null> {
  const sb = await supabaseServidor();
  const { data } = await sb.from("pedidos").select(SELECT_PEDIDO).eq("negocio_id", negocioId).eq("id", id).maybeSingle();
  return (data as PedidoConItems | null) ?? null;
}

export async function empleadosServidor(negocioId: string): Promise<Empleado[]> {
  const sb = await supabaseServidor();
  const { data } = await sb.from("empleados").select(SELECT_EMPLEADO).eq("negocio_id", negocioId).eq("activo", true).order("es_dueno", { ascending: false }).order("nombre");
  return (data ?? []) as Empleado[];
}
