// Pedidos inventados para la demo pública: dos meses de ventas con forma realista.
// El generador es determinista (misma semilla → mismos números), así la demo se
// ve igual para todos y las gráficas no bailan en cada recarga.
import { catalogoDemo, empleadoDemo } from "@/app/vista-previa/datos-demo";
import { calcularTotales } from "@/lib/precios";
import { diaSemanaDeISO, fechaISOBogota, sumarDias } from "@/lib/fechas";
import type { MetodoPago, PedidoConItems, PedidoItem } from "@/lib/tipos";

const DIAS = 70;
const NEGOCIO_ID = catalogoDemo.negocio.id;

const CLIENTES = [
  "Carlos Gómez", "Ana María Ruiz", "Julián Torres", "Laura Pérez", "Sandra Milena", "Pedro Díaz",
  "Valentina Ríos", "Andrés Castaño", "Marcela Ospina", "Camilo Restrepo", "Daniela Muñoz", "Felipe Arango",
  "Natalia Vargas", "Santiago Mejía", "Paula Andrea", "Jorge Iván", "Catalina Soto", "Mauricio Londoño",
];

const MOTIVOS = ["Cliente no contesta", "Cliente canceló", "Sin ingredientes", "Fuera de zona de domicilio"];
const PAGOS: MetodoPago[] = ["efectivo", "nequi", "nequi", "daviplata", "breb", "efectivo"];

/** Generador de números pseudoaleatorios con semilla (mulberry32) */
function azar(semilla: number) {
  let s = semilla;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generar(): PedidoConItems[] {
  const rnd = azar(20260921);
  const hoy = fechaISOBogota();
  const productos = catalogoDemo.productos.filter((p) => p.activo);
  const categorias = new Map(catalogoDemo.categorias.map((c) => [c.id, c]));
  const pedidos: PedidoConItems[] = [];
  let id = 1;

  for (let atras = DIAS - 1; atras >= 0; atras--) {
    const dia = sumarDias(hoy, -atras);
    const dow = diaSemanaDeISO(dia);
    // Viernes y sábado se vende más; el negocio además crece poco a poco.
    const finDeSemana = dow === 5 || dow === 6;
    const crecimiento = 1 + (DIAS - atras) / (DIAS * 2);
    const cuantos = Math.round((finDeSemana ? 22 : 13) * crecimiento * (0.8 + rnd() * 0.4));
    // El último día solo alcanzó a vender hasta media tarde.
    const delDia = atras === 0 ? Math.max(3, Math.round(cuantos * 0.45)) : cuantos;

    for (let n = 1; n <= delDia; n++) {
      const hora = 11 + Math.floor(rnd() * 10); // de 11 a. m. a 9 p. m.
      const minuto = Math.floor(rnd() * 60);
      const creado = `${dia}T${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}:00-05:00`;
      const esDomicilio = rnd() > 0.25;

      const cuantosItems = 1 + Math.floor(rnd() * 3);
      const items: Omit<PedidoItem, "pedido_id">[] = [];
      for (let k = 0; k < cuantosItems; k++) {
        const p = productos[Math.floor(rnd() * productos.length)];
        if (items.some((i) => i.nombre === p.nombre)) continue;
        const categoria = categorias.get(p.categoria_id)!;
        const esCombo = categoria.permite_combo && rnd() > 0.45;
        const cantidad = rnd() > 0.8 ? 2 : 1;
        const exclusiones = p.ingredientes.length > 0 && rnd() > 0.72 ? [p.ingredientes[Math.floor(rnd() * p.ingredientes.length)]] : [];
        items.push({
          producto_id: p.id,
          nombre: p.nombre,
          categoria_nombre: categoria.nombre,
          precio_unitario: esCombo ? (p.precio_combo ?? p.precio + catalogoDemo.config.extra_combo) : p.precio,
          costo_unitario: p.costo,
          cantidad,
          es_combo: esCombo,
          exclusiones,
          nota: null,
          es_personalizado: false,
        });
      }
      if (items.length === 0) continue;

      const t = calcularTotales(items, catalogoDemo.cargos, catalogoDemo.categorias, esDomicilio);
      const cancelado = rnd() > 0.955;
      const minutosEntrega = 12 + Math.floor(rnd() * 26);
      const entregadoEn = new Date(new Date(creado).getTime() + minutosEntrega * 60000).toISOString();
      const delBot = rnd() > 0.7;

      pedidos.push({
        id: id++,
        negocio_id: NEGOCIO_ID,
        empleado_id: delBot ? null : empleadoDemo.id,
        numero_dia: n,
        dia_negocio: dia,
        cliente_nombre: CLIENTES[Math.floor(rnd() * CLIENTES.length)],
        cliente_telefono: "300" + String(1000000 + Math.floor(rnd() * 8999999)),
        metodo_pago: PAGOS[Math.floor(rnd() * PAGOS.length)],
        es_domicilio: esDomicilio,
        subtotal: t.subtotal,
        cargos: t.cargos,
        total_cargos: t.totalCargos,
        total: t.total,
        notas: null,
        estado: cancelado ? "cancelado" : "entregado",
        motivo_cancelacion: cancelado ? MOTIVOS[Math.floor(rnd() * MOTIVOS.length)] : null,
        origen: delBot ? "whatsapp" : "manual",
        revisado: true,
        revisado_en: null,
        texto_original: null,
        creado_en: creado,
        entregado_en: cancelado ? null : entregadoEn,
        cancelado_en: cancelado ? entregadoEn : null,
        editado_en: null,
        tomado_por: null,
        pedido_items: items.map((i, k) => ({ ...i, id: id * 100 + k, pedido_id: id })),
        empleados: delBot ? null : { nombre: empleadoDemo.nombre },
      });
    }
  }
  return pedidos;
}

/** Historial de ventas de la demo: se calcula una sola vez por carga de página */
export const historialDemo: PedidoConItems[] = generar();
