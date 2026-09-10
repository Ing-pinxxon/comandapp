// Cálculo de precios. Misma lógica que WebSaboratto/src/cart.js pero SIN descuentos:
//   - icopor: $500 por cada unidad de una categoría con lleva_icopor (perros y salchipapas)
//   - domicilio: $1.000 si el pedido es a domicilio
//   - combo (solo hamburguesas): precio_combo del producto o precio + extra_combo

import type { Categoria, Configuracion, Producto } from "./tipos";

export interface ItemParaTotal {
  precio_unitario: number;
  cantidad: number;
  categoria_nombre: string;
}

export interface Totales {
  subtotal: number;
  unidadesIcopor: number;
  costoIcopor: number;
  costoDomicilio: number;
  total: number;
}

export function precioUnitario(producto: Pick<Producto, "precio" | "precio_combo">, esCombo: boolean, cfg: Configuracion): number {
  if (!esCombo) return producto.precio;
  return producto.precio_combo ?? producto.precio + cfg.extra_combo;
}

export function calcularTotales(
  items: ItemParaTotal[],
  categorias: Pick<Categoria, "nombre" | "lleva_icopor">[],
  cfg: Configuracion,
  esDomicilio: boolean,
): Totales {
  const conIcopor = new Set(categorias.filter((c) => c.lleva_icopor).map((c) => c.nombre));
  let subtotal = 0;
  let unidadesIcopor = 0;
  for (const it of items) {
    subtotal += it.precio_unitario * it.cantidad;
    if (conIcopor.has(it.categoria_nombre)) unidadesIcopor += it.cantidad;
  }
  const costoIcopor = unidadesIcopor * cfg.costo_icopor;
  const costoDomicilio = esDomicilio ? cfg.costo_domicilio : 0;
  return { subtotal, unidadesIcopor, costoIcopor, costoDomicilio, total: subtotal + costoIcopor + costoDomicilio };
}
