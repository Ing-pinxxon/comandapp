// Agregaciones para el panel del administrador. Funciones puras sobre los pedidos de un rango.

import { etiquetaMetodoPago, type PedidoConItems } from "./tipos";
import { diaSemanaDeISO, minutosEntre, nombreDiaSemana, partesBogota } from "./fechas";

export interface Resumen {
  pedidos: number; // pedidos no cancelados
  cancelados: number;
  ventas: number; // suma de totales de pedidos no cancelados
  ticketPromedio: number;
  tiempoPromedioMin: number | null; // creado → entregado
  porcentajeCancelados: number;
  unidades: number;
}

export interface Serie {
  etiqueta: string;
  valor: number;
}

export interface SerieDoble {
  etiqueta: string;
  pedidos: number;
  ventas: number;
}

const vendidos = (pedidos: PedidoConItems[]) => pedidos.filter((p) => p.estado !== "cancelado");

export function resumen(pedidos: PedidoConItems[]): Resumen {
  const ok = vendidos(pedidos);
  const cancelados = pedidos.length - ok.length;
  const ventas = ok.reduce((s, p) => s + p.total, 0);
  const entregados = ok.filter((p) => p.entregado_en);
  const tiempos = entregados.map((p) => minutosEntre(p.creado_en, p.entregado_en!));
  const unidades = ok.reduce((s, p) => s + p.pedido_items.reduce((t, i) => t + i.cantidad, 0), 0);
  return {
    pedidos: ok.length,
    cancelados,
    ventas,
    ticketPromedio: ok.length ? Math.round(ventas / ok.length) : 0,
    tiempoPromedioMin: tiempos.length ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : null,
    porcentajeCancelados: pedidos.length ? Math.round((cancelados / pedidos.length) * 100) : 0,
    unidades,
  };
}

/** Ventas y pedidos por día de negocio, ordenado por fecha */
export function porDia(pedidos: PedidoConItems[]): SerieDoble[] {
  const mapa = new Map<string, SerieDoble>();
  for (const p of vendidos(pedidos)) {
    const fila = mapa.get(p.dia_negocio) ?? { etiqueta: p.dia_negocio, pedidos: 0, ventas: 0 };
    fila.pedidos += 1;
    fila.ventas += p.total;
    mapa.set(p.dia_negocio, fila);
  }
  return [...mapa.values()].sort((a, b) => a.etiqueta.localeCompare(b.etiqueta));
}

/** Pedidos y ventas por día de la semana (Lunes → Domingo) */
export function porDiaSemana(pedidos: PedidoConItems[]): SerieDoble[] {
  const orden = [1, 2, 3, 4, 5, 6, 0];
  const acum = new Map<number, SerieDoble>(orden.map((d) => [d, { etiqueta: nombreDiaSemana(d), pedidos: 0, ventas: 0 }]));
  for (const p of vendidos(pedidos)) {
    const fila = acum.get(diaSemanaDeISO(p.dia_negocio))!;
    fila.pedidos += 1;
    fila.ventas += p.total;
  }
  return orden.map((d) => acum.get(d)!);
}

/** Pedidos por hora del día (solo horas con actividad, ordenadas) */
export function porHora(pedidos: PedidoConItems[]): SerieDoble[] {
  const acum = new Map<number, SerieDoble>();
  for (const p of vendidos(pedidos)) {
    const h = partesBogota(p.creado_en).hora;
    const fila = acum.get(h) ?? { etiqueta: `${h}:00`, pedidos: 0, ventas: 0 };
    fila.pedidos += 1;
    fila.ventas += p.total;
    acum.set(h, fila);
  }
  return [...acum.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

/** Unidades vendidas por categoría */
export function unidadesPorCategoria(pedidos: PedidoConItems[]): Serie[] {
  const acum = new Map<string, number>();
  for (const p of vendidos(pedidos))
    for (const i of p.pedido_items) acum.set(i.categoria_nombre, (acum.get(i.categoria_nombre) ?? 0) + i.cantidad);
  return [...acum.entries()].map(([etiqueta, valor]) => ({ etiqueta, valor })).sort((a, b) => b.valor - a.valor);
}

export interface ProductoTop {
  nombre: string;
  categoria: string;
  unidades: number;
  ventas: number;
  combos: number;
}

export function topProductos(pedidos: PedidoConItems[], limite = 10): ProductoTop[] {
  const acum = new Map<string, ProductoTop>();
  for (const p of vendidos(pedidos))
    for (const i of p.pedido_items) {
      const fila = acum.get(i.nombre) ?? { nombre: i.nombre, categoria: i.categoria_nombre, unidades: 0, ventas: 0, combos: 0 };
      fila.unidades += i.cantidad;
      fila.ventas += i.cantidad * i.precio_unitario;
      if (i.es_combo) fila.combos += i.cantidad;
      acum.set(i.nombre, fila);
    }
  return [...acum.values()].sort((a, b) => b.unidades - a.unidades).slice(0, limite);
}

/** Hamburguesas en combo vs sin combo */
export function combosVsSinCombo(pedidos: PedidoConItems[], categoriaCombo = "Hamburguesas"): Serie[] {
  let con = 0;
  let sin = 0;
  for (const p of vendidos(pedidos))
    for (const i of p.pedido_items) {
      if (i.categoria_nombre !== categoriaCombo) continue;
      if (i.es_combo) con += i.cantidad;
      else sin += i.cantidad;
    }
  return [
    { etiqueta: "Combo", valor: con },
    { etiqueta: "Sin combo", valor: sin },
  ];
}

export function porMetodoPago(pedidos: PedidoConItems[]): SerieDoble[] {
  const acum = new Map<string, SerieDoble>();
  for (const p of vendidos(pedidos)) {
    const k = etiquetaMetodoPago(p.metodo_pago);
    const fila = acum.get(k) ?? { etiqueta: k, pedidos: 0, ventas: 0 };
    fila.pedidos += 1;
    fila.ventas += p.total;
    acum.set(k, fila);
  }
  return [...acum.values()].sort((a, b) => b.ventas - a.ventas);
}

/** Ingredientes que más se quitan */
export function ingredientesQuitados(pedidos: PedidoConItems[], limite = 10): Serie[] {
  const acum = new Map<string, number>();
  for (const p of vendidos(pedidos))
    for (const i of p.pedido_items) for (const ex of i.exclusiones) acum.set(ex, (acum.get(ex) ?? 0) + i.cantidad);
  return [...acum.entries()]
    .map(([etiqueta, valor]) => ({ etiqueta, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, limite);
}

/** Tiempo promedio de entrega (min) por hora del día */
export function tiempoEntregaPorHora(pedidos: PedidoConItems[]): Serie[] {
  const acum = new Map<number, { suma: number; n: number }>();
  for (const p of vendidos(pedidos)) {
    if (!p.entregado_en) continue;
    const h = partesBogota(p.creado_en).hora;
    const fila = acum.get(h) ?? { suma: 0, n: 0 };
    fila.suma += minutosEntre(p.creado_en, p.entregado_en);
    fila.n += 1;
    acum.set(h, fila);
  }
  return [...acum.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([h, v]) => ({ etiqueta: `${h}:00`, valor: Math.round(v.suma / v.n) }));
}

export function motivosCancelacion(pedidos: PedidoConItems[]): Serie[] {
  const acum = new Map<string, number>();
  for (const p of pedidos) {
    if (p.estado !== "cancelado") continue;
    const m = p.motivo_cancelacion || "Sin motivo";
    acum.set(m, (acum.get(m) ?? 0) + 1);
  }
  return [...acum.entries()].map(([etiqueta, valor]) => ({ etiqueta, valor })).sort((a, b) => b.valor - a.valor);
}

export interface ClienteFrecuente {
  telefono: string;
  nombre: string;
  pedidos: number;
  total: number;
  ultimo: string;
  favorito: string;
}

export function clientesFrecuentes(pedidos: PedidoConItems[], limite = 20): ClienteFrecuente[] {
  const acum = new Map<string, ClienteFrecuente & { productos: Map<string, number> }>();
  for (const p of vendidos(pedidos)) {
    const tel = p.cliente_telefono || `sin-tel:${p.cliente_nombre.toLowerCase()}`;
    const fila = acum.get(tel) ?? {
      telefono: p.cliente_telefono ?? "",
      nombre: p.cliente_nombre,
      pedidos: 0,
      total: 0,
      ultimo: p.creado_en,
      favorito: "",
      productos: new Map<string, number>(),
    };
    fila.pedidos += 1;
    fila.total += p.total;
    if (p.creado_en > fila.ultimo) {
      fila.ultimo = p.creado_en;
      fila.nombre = p.cliente_nombre;
    }
    for (const i of p.pedido_items) fila.productos.set(i.nombre, (fila.productos.get(i.nombre) ?? 0) + i.cantidad);
    acum.set(tel, fila);
  }
  return [...acum.values()]
    .map((f) => {
      const fav = [...f.productos.entries()].sort((a, b) => b[1] - a[1])[0];
      const { productos: _omitir, ...resto } = f;
      void _omitir;
      return { ...resto, favorito: fav ? fav[0] : "" };
    })
    .sort((a, b) => b.pedidos - a.pedidos || b.total - a.total)
    .slice(0, limite);
}

/** Productos "X" (fuera de menú) más repetidos: candidatos a entrar al menú */
export function productosPersonalizados(pedidos: PedidoConItems[]): ProductoTop[] {
  const acum = new Map<string, ProductoTop>();
  for (const p of vendidos(pedidos))
    for (const i of p.pedido_items) {
      if (!i.es_personalizado) continue;
      const k = i.nombre.trim().toLowerCase();
      const fila = acum.get(k) ?? { nombre: i.nombre.trim(), categoria: i.categoria_nombre, unidades: 0, ventas: 0, combos: 0 };
      fila.unidades += i.cantidad;
      fila.ventas += i.cantidad * i.precio_unitario;
      acum.set(k, fila);
    }
  return [...acum.values()].sort((a, b) => b.unidades - a.unidades);
}

/** Filas planas para exportar a CSV (una por item) */
export function filasCSV(pedidos: PedidoConItems[]): string {
  const enc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[";\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const cab = [
    "pedido_id", "numero_dia", "dia_negocio", "hora", "estado", "cliente", "telefono", "metodo_pago",
    "domicilio", "producto", "categoria", "cantidad", "precio_unitario", "combo", "sin", "nota_item",
    "subtotal_pedido", "icopor", "costo_domicilio", "total_pedido", "minutos_entrega", "motivo_cancelacion",
  ];
  const filas = [cab.join(";")];
  for (const p of pedidos) {
    const { hora, minuto } = partesBogota(p.creado_en);
    const minutos = p.entregado_en ? minutosEntre(p.creado_en, p.entregado_en) : "";
    for (const i of p.pedido_items) {
      filas.push(
        [
          p.id, p.numero_dia, p.dia_negocio, `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`,
          p.estado, p.cliente_nombre, p.cliente_telefono, p.metodo_pago, p.es_domicilio ? "si" : "no",
          i.nombre, i.categoria_nombre, i.cantidad, i.precio_unitario, i.es_combo ? "si" : "no",
          i.exclusiones.join(", "), i.nota, p.subtotal, p.costo_icopor, p.costo_domicilio, p.total, minutos, p.motivo_cancelacion,
        ]
          .map(enc)
          .join(";"),
      );
    }
  }
  return "﻿" + filas.join("\r\n"); // BOM para que Excel lea acentos
}
