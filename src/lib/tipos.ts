// Tipos compartidos de la base de datos (espejo de supabase/01_schema.sql)

export type Rol = "admin" | "personal";
export type MetodoPago = "efectivo" | "nequi" | "daviplata" | "breb" | "otro";
export type EstadoPedido = "pendiente" | "entregado" | "cancelado";
export type NivelSemaforo = "verde" | "amarillo" | "naranja";

export interface Categoria {
  id: number;
  nombre: string;
  emoji: string;
  orden: number;
  lleva_icopor: boolean;
  permite_combo: boolean;
}

export interface Producto {
  id: number;
  categoria_id: number;
  nombre: string;
  precio: number;
  precio_combo: number | null;
  ingredientes: string[];
  activo: boolean;
  agotado: boolean;
  orden: number;
}

export interface Umbrales {
  verde: number; // minutos hasta los que el pedido se ve verde
  amarillo: number; // minutos hasta los que se ve amarillo; después naranja
}

export interface MensajesWhatsApp {
  listo: string;
  en_camino: string;
}

export interface Configuracion {
  umbrales_min: Umbrales;
  costo_domicilio: number;
  costo_icopor: number;
  extra_combo: number;
  mensajes_whatsapp: MensajesWhatsApp;
}

export const CONFIG_DEFAULT: Configuracion = {
  umbrales_min: { verde: 15, amarillo: 25 },
  costo_domicilio: 1000,
  costo_icopor: 500,
  extra_combo: 6000,
  mensajes_whatsapp: {
    listo: "¡Hola {nombre}! 👋 Tu pedido #{numero} de Saboratto ya está listo 🍔✅",
    en_camino: "¡Hola {nombre}! 👋 Tu pedido #{numero} de Saboratto va en camino 🛵 Total: {total}",
  },
};

export interface PedidoItem {
  id?: number;
  pedido_id?: number;
  producto_id: number | null;
  nombre: string;
  categoria_nombre: string;
  precio_unitario: number; // precio cobrado por unidad (ya incluye el combo)
  cantidad: number;
  es_combo: boolean;
  exclusiones: string[];
  nota: string | null;
  es_personalizado: boolean;
}

export interface Pedido {
  id: number;
  numero_dia: number;
  dia_negocio: string;
  cliente_nombre: string;
  cliente_telefono: string | null;
  metodo_pago: MetodoPago;
  es_domicilio: boolean;
  subtotal: number;
  unidades_icopor: number;
  costo_icopor: number;
  costo_domicilio: number;
  total: number;
  notas: string | null;
  estado: EstadoPedido;
  motivo_cancelacion: string | null;
  creado_en: string;
  entregado_en: string | null;
  cancelado_en: string | null;
  editado_en: string | null;
  tomado_por: string | null;
}

export interface PedidoConItems extends Pedido {
  pedido_items: PedidoItem[];
}

/** Datos que el formulario envía a la RPC guardar_pedido */
export interface PedidoEntrada {
  id?: number;
  cliente_nombre: string;
  cliente_telefono: string;
  metodo_pago: MetodoPago;
  es_domicilio: boolean;
  notas: string;
}

export const METODOS_PAGO: { valor: MetodoPago; etiqueta: string }[] = [
  { valor: "efectivo", etiqueta: "Efectivo" },
  { valor: "nequi", etiqueta: "Nequi" },
  { valor: "daviplata", etiqueta: "Daviplata" },
  { valor: "breb", etiqueta: "Bre-B" },
  { valor: "otro", etiqueta: "Otro" },
];

export const MOTIVOS_CANCELACION = [
  "Cliente no contesta",
  "Cliente canceló",
  "Sin ingredientes",
  "Error al tomar el pedido",
  "Fuera de zona de domicilio",
  "Otro",
];

export function etiquetaMetodoPago(valor: MetodoPago): string {
  return METODOS_PAGO.find((m) => m.valor === valor)?.etiqueta ?? valor;
}
