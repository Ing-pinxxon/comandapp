// Lecturas iniciales desde Server Components (misma forma que lib/datos.ts pero con el cliente de servidor)

import { supabaseServidor } from "./supabase/server";
import { armarConfig, type Catalogo } from "./catalogo";
import type { Categoria, PedidoConItems, Producto } from "./tipos";
import { fechaISOBogota } from "./fechas";

export async function catalogoServidor(): Promise<Catalogo> {
  const sb = await supabaseServidor();
  const [cat, prod, conf] = await Promise.all([
    sb.from("categorias").select("*").order("orden"),
    sb.from("productos").select("*").order("orden").order("nombre"),
    sb.from("configuracion").select("clave, valor"),
  ]);
  return {
    categorias: (cat.data ?? []) as Categoria[],
    productos: (prod.data ?? []) as Producto[],
    config: armarConfig(conf.data),
  };
}

export async function pedidosHoyServidor(): Promise<PedidoConItems[]> {
  const sb = await supabaseServidor();
  const hoy = fechaISOBogota();
  const { data } = await sb
    .from("pedidos")
    .select("*, pedido_items(*)")
    .or(`dia_negocio.eq.${hoy},estado.eq.pendiente`)
    .order("creado_en", { ascending: true });
  return (data ?? []) as PedidoConItems[];
}

export async function pedidoServidor(id: number): Promise<PedidoConItems | null> {
  const sb = await supabaseServidor();
  const { data } = await sb.from("pedidos").select("*, pedido_items(*)").eq("id", id).maybeSingle();
  return (data as PedidoConItems | null) ?? null;
}
