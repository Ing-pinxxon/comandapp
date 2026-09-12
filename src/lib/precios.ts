// Cálculo de precios con cargos configurables por negocio. Sin descuentos.
//   - por_unidad_categoria: valor × unidades de las categorías indicadas (ej. icopor por perro)
//   - por_pedido: valor fijo; si solo_domicilio, únicamente cuando el pedido es a domicilio
//   - combo: precio_combo del producto o precio + extra_combo del negocio
// La misma regla vive en SQL (guardar_pedido): la base recalcula al guardar.

import type { Cargo, CargoAplicado, Categoria, Configuracion, Producto } from "./tipos";

export interface ItemParaTotal {
  precio_unitario: number;
  cantidad: number;
  categoria_nombre: string;
}

export interface Totales {
  subtotal: number;
  cargos: CargoAplicado[];
  totalCargos: number;
  total: number;
}

export function precioUnitario(producto: Pick<Producto, "precio" | "precio_combo">, esCombo: boolean, cfg: Configuracion): number {
  if (!esCombo) return producto.precio;
  return producto.precio_combo ?? producto.precio + cfg.extra_combo;
}

export function calcularTotales(
  items: ItemParaTotal[],
  cargos: Pick<Cargo, "nombre" | "tipo" | "valor" | "categorias" | "solo_domicilio" | "activo" | "orden">[],
  categorias: Pick<Categoria, "id" | "nombre">[],
  esDomicilio: boolean,
): Totales {
  const subtotal = items.reduce((s, it) => s + it.precio_unitario * it.cantidad, 0);
  const nombrePorId = new Map(categorias.map((c) => [c.id, c.nombre]));
  const aplicados: CargoAplicado[] = [];

  for (const cargo of [...cargos].filter((c) => c.activo).sort((a, b) => a.orden - b.orden)) {
    let valor = 0;
    if (cargo.tipo === "por_pedido") {
      if (!cargo.solo_domicilio || esDomicilio) valor = cargo.valor;
    } else {
      const nombres = new Set(cargo.categorias.map((id) => nombrePorId.get(id)).filter(Boolean));
      const unidades = items.filter((it) => nombres.has(it.categoria_nombre)).reduce((s, it) => s + it.cantidad, 0);
      valor = unidades * cargo.valor;
    }
    if (valor > 0) aplicados.push({ nombre: cargo.nombre, valor });
  }

  const totalCargos = aplicados.reduce((s, c) => s + c.valor, 0);
  return { subtotal, cargos: aplicados, totalCargos, total: subtotal + totalCargos };
}
