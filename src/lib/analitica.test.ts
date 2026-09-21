import { describe, expect, it } from "vitest";
import { ganancia, margenPorProducto, porDiaEnRango, variacion } from "./analitica";
import { diasDelRango, rangoAnterior } from "./fechas";
import type { PedidoConItems, PedidoItem } from "./tipos";

const item = (nombre: string, precio: number, costo: number | null, cantidad = 1): PedidoItem => ({
  producto_id: null,
  nombre,
  categoria_nombre: "Hamburguesas",
  precio_unitario: precio,
  costo_unitario: costo,
  cantidad,
  es_combo: false,
  exclusiones: [],
  nota: null,
  es_personalizado: false,
});

function pedido(dia: string, items: PedidoItem[], estado: PedidoConItems["estado"] = "entregado"): PedidoConItems {
  const subtotal = items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);
  return {
    id: 1,
    negocio_id: "n",
    empleado_id: null,
    numero_dia: 1,
    dia_negocio: dia,
    cliente_nombre: "Ana",
    cliente_telefono: null,
    metodo_pago: "efectivo",
    es_domicilio: true,
    subtotal,
    cargos: [],
    total_cargos: 0,
    total: subtotal,
    notas: null,
    estado,
    motivo_cancelacion: null,
    origen: "manual",
    revisado: true,
    revisado_en: null,
    texto_original: null,
    creado_en: `${dia}T12:00:00-05:00`,
    entregado_en: null,
    cancelado_en: null,
    editado_en: null,
    tomado_por: null,
    pedido_items: items,
  };
}

describe("periodo anterior", () => {
  it("de un solo día devuelve el día de antes", () => {
    expect(rangoAnterior({ desde: "2026-09-21", hasta: "2026-09-21" })).toEqual({ desde: "2026-09-20", hasta: "2026-09-20" });
  });

  it("de una semana devuelve los siete días previos", () => {
    const previo = rangoAnterior({ desde: "2026-09-14", hasta: "2026-09-20" });
    expect(previo).toEqual({ desde: "2026-09-07", hasta: "2026-09-13" });
    expect(diasDelRango(previo)).toBe(7);
  });

  it("cruza el cambio de mes sin perder días", () => {
    const rango = { desde: "2026-03-01", hasta: "2026-03-10" }; // 10 días
    expect(rangoAnterior(rango)).toEqual({ desde: "2026-02-19", hasta: "2026-02-28" });
  });

  it("respeta el mismo largo aunque el mes anterior sea más corto", () => {
    const rango = { desde: "2026-09-01", hasta: "2026-09-21" };
    const previo = rangoAnterior(rango);
    expect(diasDelRango(previo)).toBe(diasDelRango(rango));
    expect(previo.hasta).toBe("2026-08-31");
  });
});

describe("variación contra el periodo anterior", () => {
  it("calcula el porcentaje y la dirección", () => {
    expect(variacion(120, 100)).toEqual({ porcentaje: 20, subio: true });
    expect(variacion(80, 100)).toEqual({ porcentaje: -20, subio: false });
    expect(variacion(100, 100)).toEqual({ porcentaje: 0, subio: true });
  });

  it("sin datos antes no inventa un porcentaje", () => {
    expect(variacion(50, 0)).toEqual({ porcentaje: null, subio: true });
  });
});

describe("ganancia", () => {
  it("resta el costo solo de lo que tiene costo cargado", () => {
    const g = ganancia([pedido("2026-09-20", [item("Hamburguesa", 10000, 4000), item("Gaseosa", 3000, null)])]);
    expect(g.ventasProductos).toBe(13000);
    expect(g.ventasConCosto).toBe(10000);
    expect(g.costo).toBe(4000);
    expect(g.ganancia).toBe(6000);
    expect(g.margen).toBe(60);
    expect(g.cobertura).toBe(77); // 10.000 de 13.000
    expect(g.sinCosto).toEqual(["Gaseosa"]);
  });

  it("multiplica por la cantidad y no cuenta los cancelados", () => {
    const g = ganancia([
      pedido("2026-09-20", [item("Hamburguesa", 10000, 4000, 3)]),
      pedido("2026-09-20", [item("Hamburguesa", 10000, 4000, 5)], "cancelado"),
    ]);
    expect(g.ventasConCosto).toBe(30000);
    expect(g.ganancia).toBe(18000);
  });

  it("sin ningún costo cargado no muestra ganancia ni cobertura", () => {
    const g = ganancia([pedido("2026-09-20", [item("Gaseosa", 3000, null)])]);
    expect(g.ventasConCosto).toBe(0);
    expect(g.ganancia).toBe(0);
    expect(g.margen).toBe(0);
    expect(g.cobertura).toBe(0);
  });
});

describe("margen por producto", () => {
  it("ordena de mayor a menor ganancia y omite los que no tienen costo", () => {
    const filas = margenPorProducto([
      pedido("2026-09-20", [item("Hamburguesa", 10000, 4000, 2), item("Gaseosa", 3000, null)]),
      pedido("2026-09-20", [item("Perro", 9000, 3000, 1)]),
    ]);
    expect(filas.map((f) => f.nombre)).toEqual(["Hamburguesa", "Perro"]);
    expect(filas[0]).toMatchObject({ unidades: 2, ventas: 20000, costo: 8000, ganancia: 12000, margen: 60 });
    expect(filas[1]).toMatchObject({ ganancia: 6000, margen: 67 });
  });
});

describe("serie diaria comparable", () => {
  it("rellena con ceros los días sin ventas para que dos periodos se alineen", () => {
    const rango = { desde: "2026-09-18", hasta: "2026-09-20" };
    const serie = porDiaEnRango([pedido("2026-09-19", [item("Hamburguesa", 10000, 4000)])], rango);
    expect(serie.map((d) => d.etiqueta)).toEqual(["2026-09-18", "2026-09-19", "2026-09-20"]);
    expect(serie.map((d) => d.ventas)).toEqual([0, 10000, 0]);
  });
});
