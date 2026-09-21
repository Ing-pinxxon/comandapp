// Tipos compartidos de la base de datos (espejo de supabase/01…06_*.sql)

export type MetodoPago = "efectivo" | "nequi" | "daviplata" | "breb" | "otro";
export type EstadoPedido = "pendiente" | "entregado" | "cancelado";
export type OrigenPedido = "manual" | "whatsapp";
export type NivelSemaforo = "verde" | "amarillo" | "naranja";
export type TipoCargo = "por_unidad_categoria" | "por_pedido";

// ---------- Negocio y equipo ----------

export interface Negocio {
  id: string;
  nombre: string;
  slug: string;
  logo_url: string | null;
  telefono_whatsapp: string | null;
  moneda: string;
  zona_horaria: string;
  combo_descripcion: string;
  clave_integracion: string;
  activo: boolean;
  creado_por: string | null;
  creado_en: string;
}

/** Empleado tal como lo ve la app (nunca incluye el PIN) */
export interface Empleado {
  id: string;
  negocio_id: string;
  nombre: string;
  es_dueno: boolean;
  activo: boolean;
  creado_en: string;
}

/** Empleado identificado con PIN en esta tablet (se guarda en cookie) */
export interface EmpleadoActual {
  id: string;
  nombre: string;
  es_dueno: boolean;
  desde: string; // ISO: cuándo escribió el PIN
}

export interface Cargo {
  id: number;
  negocio_id: string;
  nombre: string;
  tipo: TipoCargo;
  valor: number;
  categorias: number[]; // ids de categorías (solo por_unidad_categoria)
  solo_domicilio: boolean;
  activo: boolean;
  orden: number;
}

/** Cargo aplicado a un pedido concreto (snapshot guardado en pedidos.cargos) */
export interface CargoAplicado {
  nombre: string;
  valor: number;
}

// ---------- Catálogo ----------

export interface Categoria {
  id: number;
  negocio_id: string;
  nombre: string;
  emoji: string;
  orden: number;
  permite_combo: boolean;
}

export interface Producto {
  id: number;
  negocio_id: string;
  categoria_id: number;
  nombre: string;
  precio: number;
  precio_combo: number | null;
  /** Lo que le cuesta al negocio producirlo. Vacío = todavía no lo cargó */
  costo: number | null;
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
  extra_combo: number;
  mensajes_whatsapp: MensajesWhatsApp;
}

export const CONFIG_DEFAULT: Configuracion = {
  umbrales_min: { verde: 15, amarillo: 25 },
  extra_combo: 6000,
  mensajes_whatsapp: {
    listo: "¡Hola {nombre}! 👋 Tu pedido #{numero} ya está listo ✅",
    en_camino: "¡Hola {nombre}! 👋 Tu pedido #{numero} va en camino 🛵 Total: {total}",
  },
};

// ---------- Importación de menú por foto ----------

export type EstadoImportacion = "procesando" | "listo" | "aplicado" | "error";

export interface ProductoImportado {
  nombre: string;
  precio: number | null; // null = la IA no pudo leerlo; hay que completarlo
  precio_combo?: number | null;
  descripcion?: string | null;
  ingredientes?: string[];
}

export interface CategoriaImportada {
  nombre: string;
  emoji?: string;
  permite_combo?: boolean;
  productos: ProductoImportado[];
}

export interface MenuImportado {
  categorias: CategoriaImportada[];
}

export interface ImportacionMenu {
  id: string;
  negocio_id: string;
  rutas_imagenes: string[];
  estado: EstadoImportacion;
  resultado: MenuImportado | null;
  error: string | null;
  creado_en: string;
}

// ---------- Pedidos ----------

export interface PedidoItem {
  id?: number;
  pedido_id?: number;
  producto_id: number | null;
  nombre: string;
  categoria_nombre: string;
  precio_unitario: number; // precio cobrado por unidad (ya incluye el combo)
  /** Costo del producto el día de la venta; se copia al guardar para no reescribir la historia */
  costo_unitario?: number | null;
  cantidad: number;
  es_combo: boolean;
  exclusiones: string[];
  nota: string | null;
  es_personalizado: boolean;
}

export interface Pedido {
  id: number;
  negocio_id: string;
  empleado_id: string | null;
  numero_dia: number;
  dia_negocio: string;
  cliente_nombre: string;
  cliente_telefono: string | null;
  metodo_pago: MetodoPago;
  es_domicilio: boolean;
  subtotal: number;
  cargos: CargoAplicado[];
  total_cargos: number;
  total: number;
  notas: string | null;
  estado: EstadoPedido;
  motivo_cancelacion: string | null;
  /** De dónde vino el pedido: tomado a mano o traído por el bot de WhatsApp */
  origen: OrigenPedido;
  /** Los del bot llegan en false hasta que el personal los aprueba */
  revisado: boolean;
  revisado_en: string | null;
  /** Resumen tal cual lo escribió el bot, para comparar si algo se ve raro */
  texto_original: string | null;
  creado_en: string;
  entregado_en: string | null;
  cancelado_en: string | null;
  editado_en: string | null;
  tomado_por: string | null;
}

export interface PedidoConItems extends Pedido {
  pedido_items: PedidoItem[];
  /** Nombre del empleado que lo tomó (join opcional) */
  empleados?: { nombre: string } | null;
}

/** Datos que el formulario envía a la RPC guardar_pedido */
export interface PedidoEntrada {
  id?: number;
  negocio_id: string;
  empleado_id: string | null;
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

/** Iniciales para mostrar cuando un negocio o producto no tiene imagen */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}
