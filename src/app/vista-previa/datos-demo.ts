// Datos de ejemplo para la vista previa (solo desarrollo). No tocan la base de datos.
import type { Catalogo } from "@/lib/catalogo";
import { CONFIG_DEFAULT, type EmpleadoActual, type Negocio, type PedidoConItems, type PedidoItem } from "@/lib/tipos";
import { calcularTotales } from "@/lib/precios";
import { fechaISOBogota } from "@/lib/fechas";

const NEGOCIO_ID = "00000000-0000-0000-0000-000000000001";

export const negocioDemo: Negocio = {
  id: NEGOCIO_ID,
  nombre: "Saboratto",
  slug: "saboratto",
  logo_url: null,
  telefono_whatsapp: "3222430079",
  moneda: "COP",
  zona_horaria: "America/Bogota",
  combo_descripcion: "incluye papas + Coca-Cola Cero",
  clave_integracion: "demo",
  activo: true,
  creado_por: null,
  creado_en: new Date().toISOString(),
};

export const empleadoDemo: EmpleadoActual = { id: "emp-demo", nombre: "Daniel", es_dueno: true, desde: new Date().toISOString() };

export const catalogoDemo: Catalogo = {
  negocio: negocioDemo,
  config: CONFIG_DEFAULT,
  categorias: [
    { id: 1, negocio_id: NEGOCIO_ID, nombre: "Hamburguesas", emoji: "🍔", orden: 1, permite_combo: true },
    { id: 2, negocio_id: NEGOCIO_ID, nombre: "Perros", emoji: "🌭", orden: 2, permite_combo: false },
    { id: 3, negocio_id: NEGOCIO_ID, nombre: "Salchipapas", emoji: "🍟", orden: 3, permite_combo: false },
    { id: 4, negocio_id: NEGOCIO_ID, nombre: "Sándwiches", emoji: "🥪", orden: 4, permite_combo: false },
    { id: 5, negocio_id: NEGOCIO_ID, nombre: "Bebidas", emoji: "🥤", orden: 5, permite_combo: false },
    { id: 6, negocio_id: NEGOCIO_ID, nombre: "Adicionales", emoji: "➕", orden: 6, permite_combo: false },
  ],
  cargos: [
    { id: 1, negocio_id: NEGOCIO_ID, nombre: "Icopor", tipo: "por_unidad_categoria", valor: 500, categorias: [2, 3], solo_domicilio: false, activo: true, orden: 1 },
    { id: 2, negocio_id: NEGOCIO_ID, nombre: "Domicilio", tipo: "por_pedido", valor: 1000, categorias: [], solo_domicilio: true, activo: true, orden: 2 },
  ],
  productos: [
    { id: 1, negocio_id: NEGOCIO_ID, categoria_id: 1, nombre: "Hamburguesa Tradicional", precio: 11500, precio_combo: 17500, costo: 4300, ingredientes: ["Queso", "Cebolla Saboratto", "Lechuga", "Tomate", "Papa ripio", "Salsa de la casa"], activo: true, agotado: false, orden: 1 },
    { id: 2, negocio_id: NEGOCIO_ID, categoria_id: 1, nombre: "Hamburguesa Especial", precio: 15000, precio_combo: 21000, costo: 5800, ingredientes: ["Queso", "Cebolla Saboratto", "Lechuga", "Tomate", "Papa ripio", "Salsa de la casa", "Jamón ahumado", "Tocineta", "Huevo de codorniz"], activo: true, agotado: false, orden: 2 },
    { id: 3, negocio_id: NEGOCIO_ID, categoria_id: 1, nombre: "Hamburguesa Ranchera", precio: 15000, precio_combo: 21000, costo: 5600, ingredientes: ["Queso", "Cebolla Saboratto", "Lechuga", "Tomate", "Papa ripio", "Salsa de la casa", "Tocineta", "Huevo de codorniz"], activo: true, agotado: false, orden: 3 },
    { id: 4, negocio_id: NEGOCIO_ID, categoria_id: 1, nombre: "Hamburguesa Con Todo", precio: 22000, precio_combo: 28000, costo: 8400, ingredientes: ["Queso", "Cebolla Saboratto", "Lechuga", "Tomate", "Papa ripio", "Salsa de la casa", "Jamón ahumado", "Tocineta", "Huevo de codorniz"], activo: true, agotado: true, orden: 4 },
    { id: 5, negocio_id: NEGOCIO_ID, categoria_id: 2, nombre: "Perro Caliente Tradicional", precio: 9000, precio_combo: null, costo: 3200, ingredientes: ["Queso doble crema", "Cebolla Saboratto", "Papa ripio", "Salsa de la casa"], activo: true, agotado: false, orden: 1 },
    { id: 6, negocio_id: NEGOCIO_ID, categoria_id: 2, nombre: "Perro Caliente Especial", precio: 13000, precio_combo: null, costo: 4900, ingredientes: ["Queso doble crema", "Cebolla Saboratto", "Papa ripio", "Salsa de la casa", "Jamón ahumado", "Tocineta", "Huevo de codorniz"], activo: true, agotado: false, orden: 2 },
    { id: 7, negocio_id: NEGOCIO_ID, categoria_id: 2, nombre: "Perro Caliente Ranchero", precio: 13000, precio_combo: null, costo: 4700, ingredientes: ["Queso doble crema", "Cebolla Saboratto", "Papa ripio", "Salsa de la casa", "Tocineta"], activo: true, agotado: false, orden: 3 },
    { id: 8, negocio_id: NEGOCIO_ID, categoria_id: 3, nombre: "Salchipapa Tradicional", precio: 10000, precio_combo: null, costo: 3600, ingredientes: ["Queso", "Huevo de codorniz", "Salsa cheddar"], activo: true, agotado: false, orden: 1 },
    { id: 9, negocio_id: NEGOCIO_ID, categoria_id: 3, nombre: "Salchipapa Ranchera", precio: 15000, precio_combo: null, costo: 5500, ingredientes: ["Queso", "Huevo de codorniz", "Salsa cheddar", "Tocineta"], activo: true, agotado: false, orden: 2 },
    { id: 10, negocio_id: NEGOCIO_ID, categoria_id: 3, nombre: "Salchipapa Doble", precio: 22000, precio_combo: null, costo: 8200, ingredientes: ["Queso", "Huevo de codorniz", "Salsa cheddar", "Tocineta"], activo: true, agotado: false, orden: 3 },
    { id: 11, negocio_id: NEGOCIO_ID, categoria_id: 4, nombre: "Sándwich con carne de hamburguesa", precio: 12000, precio_combo: null, costo: 4300, ingredientes: ["Queso", "Cebolla Saboratto", "Lechuga", "Tomate", "Papa ripio", "Salsa de la casa"], activo: true, agotado: false, orden: 1 },
    { id: 12, negocio_id: NEGOCIO_ID, categoria_id: 5, nombre: "Coca Cola pequeña original", precio: 2500, precio_combo: null, costo: 1400, ingredientes: [], activo: true, agotado: false, orden: 1 },
    { id: 13, negocio_id: NEGOCIO_ID, categoria_id: 5, nombre: "Coca Cola personal", precio: 3500, precio_combo: null, costo: 1900, ingredientes: [], activo: true, agotado: false, orden: 2 },
    { id: 14, negocio_id: NEGOCIO_ID, categoria_id: 5, nombre: "Coca Cola 1.5L", precio: 6500, precio_combo: null, costo: 3400, ingredientes: [], activo: true, agotado: false, orden: 3 },
    { id: 15, negocio_id: NEGOCIO_ID, categoria_id: 5, nombre: "Manzana pequeña", precio: 1500, precio_combo: null, costo: 800, ingredientes: [], activo: true, agotado: false, orden: 4 },
    { id: 16, negocio_id: NEGOCIO_ID, categoria_id: 6, nombre: "Porción de papas", precio: 4000, precio_combo: null, costo: 1500, ingredientes: [], activo: true, agotado: false, orden: 1 },
  ],
};

const hace = (min: number) => new Date(Date.now() - min * 60000).toISOString();

function pedido(id: number, numero: number, minutos: number, nombre: string, tel: string, items: Omit<PedidoItem, "pedido_id">[], extra: Partial<PedidoConItems> = {}): PedidoConItems {
  const esDomicilio = extra.es_domicilio ?? true;
  const t = calcularTotales(items, catalogoDemo.cargos, catalogoDemo.categorias, esDomicilio);
  return {
    id,
    negocio_id: NEGOCIO_ID,
    empleado_id: empleadoDemo.id,
    numero_dia: numero,
    dia_negocio: fechaISOBogota(),
    cliente_nombre: nombre,
    cliente_telefono: tel,
    metodo_pago: "efectivo",
    es_domicilio: esDomicilio,
    subtotal: t.subtotal,
    cargos: t.cargos,
    total_cargos: t.totalCargos,
    total: t.total,
    notas: null,
    estado: "pendiente",
    motivo_cancelacion: null,
    origen: "manual",
    revisado: true,
    revisado_en: null,
    texto_original: null,
    creado_en: hace(minutos),
    entregado_en: null,
    cancelado_en: null,
    editado_en: null,
    tomado_por: null,
    pedido_items: items.map((i, k) => ({ ...i, id: id * 100 + k, pedido_id: id })),
    empleados: { nombre: empleadoDemo.nombre },
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

/**
 * Pedidos de ejemplo con las horas contadas desde AHORA. Es una función a
 * propósito: como constante, el servidor la congelaría en el primer arranque y
 * los minutos no cuadrarían con los que calcula el navegador.
 */
export const crearPedidosDemo = (): PedidoConItems[] => [
  pedido(1, 1, 31, "Carlos Gómez", "3001234567", [item("Hamburguesa Ranchera", "Hamburguesas", 21000, 2, { es_combo: true }), item("Coca Cola 1.5L", "Bebidas", 6500)], { metodo_pago: "nequi" }),
  pedido(2, 2, 19, "Ana María Ruiz", "3109876543", [item("Perro Caliente Especial", "Perros", 13000, 2, { exclusiones: ["Cebolla Saboratto"] }), item("Salchipapa Tradicional", "Salchipapas", 10000)]),
  pedido(3, 3, 7, "Julián Torres", "3205551212", [item("Hamburguesa Tradicional", "Hamburguesas", 11500, 1, { exclusiones: ["Tomate", "Lechuga"], nota: "bien asada" }), item("Porción de papas", "Adicionales", 4000)], { notas: "Timbrar dos veces", metodo_pago: "daviplata" }),
  pedido(4, 4, 2, "Laura P.", "3157778899", [item("Sándwich con carne de hamburguesa", "Sándwiches", 12000), item("Coca-Cola Cero 400ml", "Bebidas", 3000, 1, { es_personalizado: true })], { es_domicilio: false }),
  // Pedido traído por el bot de WhatsApp, todavía sin revisar
  pedido(
    7,
    5,
    4,
    "Sandra Milena",
    "3126667788",
    [item("Hamburguesa Especial", "Hamburguesas", 21000, 2, { es_combo: true }), item("Perro Caliente Ranchero", "Perros", 13000)],
    {
      origen: "whatsapp",
      revisado: false,
      metodo_pago: "nequi",
      empleado_id: null,
      empleados: null,
      texto_original:
        "Listo 😎 te confirmo:\n\n• 2 Combos de hamburguesa especial 🍔 - $42.000\n  (incluye papas y gaseosa en cada uno)\n\n• 1 Perro ranchero 🌭 - $13.000\n\nSubtotal: $55.000\nIcopor: $500 (1 perro)\nDomicilio: $1.000\n**Total: $56.500**\n\n¿Me confirmas? ✅",
    },
  ),
  pedido(5, 6, 55, "Pedro Díaz", "3012223344", [item("Salchipapa Doble", "Salchipapas", 22000)], { estado: "entregado", entregado_en: hace(20) }),
  pedido(6, 7, 40, "Sin nombre", "", [item("Perro Caliente Tradicional", "Perros", 9000)], { estado: "cancelado", cancelado_en: hace(35), motivo_cancelacion: "Cliente no contesta" }),
];
