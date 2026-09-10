import type { Configuracion, PedidoConItems, Producto, Categoria } from "@/lib/tipos";
import type { ItemEntrada } from "@/lib/datos";

/** Item del pedido mientras se está armando en el formulario */
export interface ItemBorrador {
  clave: string;
  producto_id: number | null;
  nombre: string;
  categoria_nombre: string;
  precio_base: number;
  precio_combo: number | null;
  cantidad: number;
  es_combo: boolean;
  exclusiones: string[];
  nota: string;
  es_personalizado: boolean;
  ingredientes: string[];
  permite_combo: boolean;
}

export function precioUnitarioBorrador(it: ItemBorrador, cfg: Configuracion): number {
  if (!it.es_combo) return it.precio_base;
  return it.precio_combo ?? it.precio_base + cfg.extra_combo;
}

export function nuevaClave(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function borradorDesdeProducto(p: Producto, categoria: Categoria): ItemBorrador {
  return {
    clave: nuevaClave(),
    producto_id: p.id,
    nombre: p.nombre,
    categoria_nombre: categoria.nombre,
    precio_base: p.precio,
    precio_combo: p.precio_combo,
    cantidad: 1,
    es_combo: false,
    exclusiones: [],
    nota: "",
    es_personalizado: false,
    ingredientes: p.ingredientes ?? [],
    permite_combo: categoria.permite_combo,
  };
}

/** Reconstruye los borradores de un pedido guardado (para editar) */
export function borradoresDesdePedido(pedido: PedidoConItems, productos: Producto[], categorias: Categoria[], cfg: Configuracion): ItemBorrador[] {
  return pedido.pedido_items.map((it) => {
    const prod = it.producto_id ? productos.find((p) => p.id === it.producto_id) : undefined;
    const cat = categorias.find((c) => c.nombre === it.categoria_nombre);
    const precioBase = prod ? prod.precio : it.es_combo ? Math.max(0, it.precio_unitario - cfg.extra_combo) : it.precio_unitario;
    return {
      clave: nuevaClave(),
      producto_id: it.producto_id,
      nombre: it.nombre,
      categoria_nombre: it.categoria_nombre,
      precio_base: precioBase,
      precio_combo: prod?.precio_combo ?? (it.es_combo ? it.precio_unitario : null),
      cantidad: it.cantidad,
      es_combo: it.es_combo,
      exclusiones: [...it.exclusiones],
      nota: it.nota ?? "",
      es_personalizado: it.es_personalizado,
      ingredientes: prod?.ingredientes ?? [],
      permite_combo: cat?.permite_combo ?? false,
    };
  });
}

/** Dos items son "iguales" si tienen la misma configuración (para agrupar cantidades) */
export function mismaConfiguracion(a: ItemBorrador, b: ItemBorrador): boolean {
  return (
    a.producto_id === b.producto_id &&
    a.nombre === b.nombre &&
    a.es_combo === b.es_combo &&
    a.precio_base === b.precio_base &&
    a.nota.trim() === b.nota.trim() &&
    [...a.exclusiones].sort().join("|") === [...b.exclusiones].sort().join("|")
  );
}

export function aItemsEntrada(items: ItemBorrador[], cfg: Configuracion): ItemEntrada[] {
  return items.map((it) => ({
    producto_id: it.producto_id,
    nombre: it.nombre.trim(),
    categoria_nombre: it.categoria_nombre,
    precio_unitario: precioUnitarioBorrador(it, cfg),
    cantidad: it.cantidad,
    es_combo: it.es_combo,
    exclusiones: it.exclusiones,
    nota: it.nota.trim() || null,
    es_personalizado: it.es_personalizado,
  }));
}
