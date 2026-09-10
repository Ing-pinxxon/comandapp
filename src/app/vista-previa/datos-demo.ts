// Datos de ejemplo para la vista previa (solo desarrollo). No tocan la base de datos.
import type { Catalogo } from "@/lib/catalogo";
import { CONFIG_DEFAULT, type PedidoConItems, type PedidoItem } from "@/lib/tipos";
import { fechaISOBogota } from "@/lib/fechas";

export const catalogoDemo: Catalogo = {
  config: CONFIG_DEFAULT,
  categorias: [
    { id: 1, nombre: "Hamburguesas", emoji: "🍔", orden: 1, lleva_icopor: false, permite_combo: true },
    { id: 2, nombre: "Perros", emoji: "🌭", orden: 2, lleva_icopor: true, permite_combo: false },
    { id: 3, nombre: "Salchipapas", emoji: "🍟", orden: 3, lleva_icopor: true, permite_combo: false },
    { id: 4, nombre: "Sándwiches", emoji: "🥪", orden: 4, lleva_icopor: false, permite_combo: false },
    { id: 5, nombre: "Bebidas", emoji: "🥤", orden: 5, lleva_icopor: false, permite_combo: false },
    { id: 6, nombre: "Adicionales", emoji: "➕", orden: 6, lleva_icopor: false, permite_combo: false },
  ],
  productos: [
    { id: 1, categoria_id: 1, nombre: "Hamburguesa Tradicional", precio: 11500, precio_combo: 17500, ingredientes: ["Queso", "Cebolla Saboratto", "Lechuga", "Tomate", "Papa ripio", "Salsa de la casa"], activo: true, agotado: false, orden: 1 },
    { id: 2, categoria_id: 1, nombre: "Hamburguesa Especial", precio: 15000, precio_combo: 21000, ingredientes: ["Queso", "Cebolla Saboratto", "Lechuga", "Tomate", "Papa ripio", "Salsa de la casa", "Jamón ahumado", "Tocineta", "Huevo de codorniz"], activo: true, agotado: false, orden: 2 },
    { id: 3, categoria_id: 1, nombre: "Hamburguesa Ranchera", precio: 15000, precio_combo: 21000, ingredientes: ["Queso", "Cebolla Saboratto", "Lechuga", "Tomate", "Papa ripio", "Salsa de la casa", "Tocineta", "Huevo de codorniz"], activo: true, agotado: false, orden: 3 },
    { id: 4, categoria_id: 1, nombre: "Hamburguesa Con Todo", precio: 22000, precio_combo: 28000, ingredientes: ["Queso", "Cebolla Saboratto", "Lechuga", "Tomate", "Papa ripio", "Salsa de la casa", "Jamón ahumado", "Tocineta", "Huevo de codorniz"], activo: true, agotado: true, orden: 4 },
    { id: 5, categoria_id: 2, nombre: "Perro Caliente Tradicional", precio: 9000, precio_combo: null, ingredientes: ["Queso doble crema", "Cebolla Saboratto", "Papa ripio", "Salsa de la casa"], activo: true, agotado: false, orden: 1 },
    { id: 6, categoria_id: 2, nombre: "Perro Caliente Especial", precio: 13000, precio_combo: null, ingredientes: ["Queso doble crema", "Cebolla Saboratto", "Papa ripio", "Salsa de la casa", "Jamón ahumado", "Tocineta", "Huevo de codorniz"], activo: true, agotado: false, orden: 2 },
    { id: 7, categoria_id: 2, nombre: "Perro Caliente Ranchero", precio: 13000, precio_combo: null, ingredientes: ["Queso doble crema", "Cebolla Saboratto", "Papa ripio", "Salsa de la casa", "Tocineta"], activo: true, agotado: false, orden: 3 },
    { id: 8, categoria_id: 3, nombre: "Salchipapa Tradicional", precio: 10000, precio_combo: null, ingredientes: ["Queso", "Huevo de codorniz", "Salsa cheddar"], activo: true, agotado: false, orden: 1 },
    { id: 9, categoria_id: 3, nombre: "Salchipapa Ranchera", precio: 15000, precio_combo: null, ingredientes: ["Queso", "Huevo de codorniz", "Salsa cheddar", "Tocineta"], activo: true, agotado: false, orden: 2 },
    { id: 10, categoria_id: 3, nombre: "Salchipapa Doble", precio: 22000, precio_combo: null, ingredientes: ["Queso", "Huevo de codorniz", "Salsa cheddar", "Tocineta"], activo: true, agotado: false, orden: 3 },
    { id: 11, categoria_id: 4, nombre: "Sándwich con carne de hamburguesa", precio: 12000, precio_combo: null, ingredientes: ["Queso", "Cebolla Saboratto", "Lechuga", "Tomate", "Papa ripio", "Salsa de la casa"], activo: true, agotado: false, orden: 1 },
    { id: 12, categoria_id: 5, nombre: "Coca Cola pequeña original", precio: 2500, precio_combo: null, ingredientes: [], activo: true, agotado: false, orden: 1 },
    { id: 13, categoria_id: 5, nombre: "Coca Cola personal", precio: 3500, precio_combo: null, ingredientes: [], activo: true, agotado: false, orden: 2 },
    { id: 14, categoria_id: 5, nombre: "Coca Cola 1.5L", precio: 6500, precio_combo: null, ingredientes: [], activo: true, agotado: false, orden: 3 },
    { id: 15, categoria_id: 5, nombre: "Manzana pequeña", precio: 1500, precio_combo: null, ingredientes: [], activo: true, agotado: false, orden: 4 },
    { id: 16, categoria_id: 6, nombre: "Porción de papas", precio: 4000, precio_combo: null, ingredientes: [], activo: true, agotado: false, orden: 1 },
  ],
};

const hace = (min: number) => new Date(Date.now() - min * 60000).toISOString();

function pedido(id: number, numero: number, minutos: number, nombre: string, tel: string, items: Omit<PedidoItem, "pedido_id">[], extra: Partial<PedidoConItems> = {}): PedidoConItems {
  const subtotal = items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);
  const unidadesIcopor = items.filter((i) => i.categoria_nombre === "Perros" || i.categoria_nombre === "Salchipapas").reduce((s, i) => s + i.cantidad, 0);
  const costoIcopor = unidadesIcopor * 500;
  const esDomicilio = extra.es_domicilio ?? true;
  const costoDomicilio = esDomicilio ? 1000 : 0;
  return {
    id,
    numero_dia: numero,
    dia_negocio: fechaISOBogota(),
    cliente_nombre: nombre,
    cliente_telefono: tel,
    metodo_pago: "efectivo",
    es_domicilio: esDomicilio,
    subtotal,
    unidades_icopor: unidadesIcopor,
    costo_icopor: costoIcopor,
    costo_domicilio: costoDomicilio,
    total: subtotal + costoIcopor + costoDomicilio,
    notas: null,
    estado: "pendiente",
    motivo_cancelacion: null,
    creado_en: hace(minutos),
    entregado_en: null,
    cancelado_en: null,
    editado_en: null,
    tomado_por: null,
    pedido_items: items.map((i, k) => ({ ...i, id: id * 100 + k, pedido_id: id })),
    ...extra,
  };
}

const item = (nombre: string, categoria: string, precio: number, cantidad = 1, extra: Partial<PedidoItem> = {}): Omit<PedidoItem, "pedido_id"> => ({
  producto_id: null,
  nombre,
  categoria_nombre: categoria,
  precio_unitario: precio,
  cantidad,
  es_combo: false,
  exclusiones: [],
  nota: null,
  es_personalizado: false,
  ...extra,
});

export const pedidosDemo: PedidoConItems[] = [
  pedido(1, 1, 31, "Carlos Gómez", "3001234567", [item("Hamburguesa Ranchera", "Hamburguesas", 21000, 2, { es_combo: true }), item("Coca Cola 1.5L", "Bebidas", 6500)], { metodo_pago: "nequi" }),
  pedido(2, 2, 19, "Ana María Ruiz", "3109876543", [item("Perro Caliente Especial", "Perros", 13000, 2, { exclusiones: ["Cebolla Saboratto"] }), item("Salchipapa Tradicional", "Salchipapas", 10000)]),
  pedido(3, 3, 7, "Julián Torres", "3205551212", [item("Hamburguesa Tradicional", "Hamburguesas", 11500, 1, { exclusiones: ["Tomate", "Lechuga"], nota: "bien asada" }), item("Porción de papas", "Adicionales", 4000)], { notas: "Timbrar dos veces", metodo_pago: "daviplata" }),
  pedido(4, 4, 2, "Laura P.", "3157778899", [item("Sándwich con carne de hamburguesa", "Sándwiches", 12000), item("Coca-Cola Cero 400ml", "Bebidas", 3000, 1, { es_personalizado: true })], { es_domicilio: false }),
  pedido(5, 5, 55, "Pedro Díaz", "3012223344", [item("Salchipapa Doble", "Salchipapas", 22000)], { estado: "entregado", entregado_en: hace(20) }),
  pedido(6, 6, 40, "Sin nombre", "", [item("Perro Caliente Tradicional", "Perros", 9000)], { estado: "cancelado", cancelado_en: hace(35), motivo_cancelacion: "Cliente no contesta" }),
];
