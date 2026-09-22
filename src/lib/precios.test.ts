import { describe, expect, it } from "vitest";
import { calcularTotales, precioUnitario } from "./precios";
import { CONFIG_DEFAULT, iniciales } from "./tipos";
import { armarConfig } from "./catalogo";
import { nivelSemaforo } from "./semaforo";
import { normalizarTelefono, plantillaMensaje, telefonoBonito, urlWhatsApp } from "./whatsapp";
import { fechaISOBogota, minutosEntre, rangoPredefinido, sumarDias } from "./fechas";
import { normalizarMenu, preciosFaltantes, unirMenus } from "./menu-ia";

const categorias = [
  { id: 1, nombre: "Hamburguesas" },
  { id: 2, nombre: "Perros" },
  { id: 3, nombre: "Salchipapas" },
  { id: 5, nombre: "Bebidas" },
];

// Los cargos de Saboratto expresados en el modelo configurable
const cargosSaboratto = [
  { nombre: "Icopor", tipo: "por_unidad_categoria" as const, valor: 500, categorias: [2, 3], solo_domicilio: false, activo: true, orden: 1 },
  { nombre: "Domicilio", tipo: "por_pedido" as const, valor: 1000, categorias: [], solo_domicilio: true, activo: true, orden: 2 },
];

describe("precios con cargos configurables (sin descuento)", () => {
  it("cobra icopor solo a perros y salchipapas y suma el domicilio", () => {
    const t = calcularTotales(
      [
        { precio_unitario: 17500, cantidad: 1, categoria_nombre: "Hamburguesas" }, // combo
        { precio_unitario: 15000, cantidad: 1, categoria_nombre: "Hamburguesas" },
        { precio_unitario: 9000, cantidad: 1, categoria_nombre: "Perros" },
        { precio_unitario: 10000, cantidad: 1, categoria_nombre: "Salchipapas" },
        { precio_unitario: 3000, cantidad: 1, categoria_nombre: "Bebidas" },
      ],
      cargosSaboratto,
      categorias,
      true,
    );
    expect(t.subtotal).toBe(54500);
    expect(t.cargos).toEqual([
      { nombre: "Icopor", valor: 1000 },
      { nombre: "Domicilio", valor: 1000 },
    ]);
    expect(t.total).toBe(56500);
  });

  it("multiplica por unidades y omite el cargo de solo domicilio si recoge", () => {
    const t = calcularTotales([{ precio_unitario: 13000, cantidad: 3, categoria_nombre: "Perros" }], cargosSaboratto, categorias, false);
    expect(t.cargos).toEqual([{ nombre: "Icopor", valor: 1500 }]);
    expect(t.total).toBe(40500);
  });

  it("ignora cargos inactivos y respeta el orden", () => {
    const cargos = [
      { nombre: "Propina", tipo: "por_pedido" as const, valor: 2000, categorias: [], solo_domicilio: false, activo: true, orden: 2 },
      { nombre: "Empaque", tipo: "por_pedido" as const, valor: 700, categorias: [], solo_domicilio: false, activo: true, orden: 1 },
      { nombre: "Viejo", tipo: "por_pedido" as const, valor: 9999, categorias: [], solo_domicilio: false, activo: false, orden: 0 },
    ];
    const t = calcularTotales([{ precio_unitario: 10000, cantidad: 1, categoria_nombre: "Bebidas" }], cargos, categorias, false);
    expect(t.cargos.map((c) => c.nombre)).toEqual(["Empaque", "Propina"]);
    expect(t.total).toBe(12700);
  });

  it("sin cargos, el total es el subtotal", () => {
    const t = calcularTotales([{ precio_unitario: 5000, cantidad: 2, categoria_nombre: "Bebidas" }], [], categorias, true);
    expect(t.cargos).toEqual([]);
    expect(t.total).toBe(10000);
  });

  it("usa precio_combo cuando existe y precio + extra cuando no", () => {
    expect(precioUnitario({ precio: 11500, precio_combo: 17500 }, true, CONFIG_DEFAULT)).toBe(17500);
    expect(precioUnitario({ precio: 11500, precio_combo: null }, true, CONFIG_DEFAULT)).toBe(17500);
    expect(precioUnitario({ precio: 11500, precio_combo: 17500 }, false, CONFIG_DEFAULT)).toBe(11500);
  });
});

describe("menú leído por IA", () => {
  it("normaliza nombres, precios en miles y quita duplicados y categorías vacías", () => {
    const menu = normalizarMenu({
      categorias: [
        {
          nombre: "hamburguesas",
          productos: [
            { nombre: "tradicional ", precio: 11.5, ingredientes: ["queso", "cebolla"] },
            { nombre: "Tradicional", precio: 11500 },
            { nombre: "especial", precio: 15000, descripcion: "  con jamón " },
          ],
        },
        { nombre: "Vacía", productos: [] },
        { nombre: "Bebidas", productos: [{ nombre: "Coca Cola", precio: null }] },
      ],
    });
    expect(menu.categorias.map((c) => c.nombre)).toEqual(["Hamburguesas", "Bebidas"]);
    expect(menu.categorias[0].emoji).toBe("🍔");
    expect(menu.categorias[0].productos).toHaveLength(2);
    expect(menu.categorias[0].productos[0]).toMatchObject({ nombre: "Tradicional", precio: 11500, ingredientes: ["Queso", "Cebolla"] });
    expect(menu.categorias[0].productos[1].descripcion).toBe("con jamón");
    expect(preciosFaltantes(menu)).toBe(1);
  });

  it("une varias fotos en un solo menú", () => {
    const a = normalizarMenu({ categorias: [{ nombre: "Perros", productos: [{ nombre: "Tradicional", precio: 9000 }] }] });
    const b = normalizarMenu({ categorias: [{ nombre: "perros", productos: [{ nombre: "Especial", precio: 13000 }] }] });
    const u = unirMenus([a, b]);
    expect(u.categorias).toHaveLength(1);
    expect(u.categorias[0].productos.map((p) => p.nombre)).toEqual(["Tradicional", "Especial"]);
  });

  it("rechaza un JSON que no cumple el esquema", () => {
    expect(() => normalizarMenu({ categorias: [{ productos: [] }] })).toThrow();
  });
});

describe("semáforo", () => {
  const u = { verde: 15, amarillo: 25 };
  it("verde 0-15, amarillo 15-25, naranja +25", () => {
    expect(nivelSemaforo(0, u)).toBe("verde");
    expect(nivelSemaforo(14, u)).toBe("verde");
    expect(nivelSemaforo(15, u)).toBe("amarillo");
    expect(nivelSemaforo(24, u)).toBe("amarillo");
    expect(nivelSemaforo(25, u)).toBe("naranja");
    expect(nivelSemaforo(90, u)).toBe("naranja");
  });
});

describe("whatsapp", () => {
  it("normaliza celulares colombianos", () => {
    expect(normalizarTelefono("322 243 0079")).toBe("573222430079");
    expect(normalizarTelefono("+57 322 243 0079")).toBe("573222430079");
    expect(normalizarTelefono("")).toBeNull();
    expect(telefonoBonito("573222430079")).toBe("322 243 0079");
  });
  it("arma la URL y reemplaza la plantilla", () => {
    const msg = plantillaMensaje("Hola {nombre}, pedido #{numero} total {total}", { nombre: "Ana María", numero: 7, total: 16000 });
    expect(msg).toBe("Hola Ana, pedido #7 total $16.000");
    expect(urlWhatsApp("3222430079", "hola")).toBe("https://wa.me/573222430079?text=hola");
    expect(urlWhatsApp(null, "hola")).toBeNull();
  });
});

describe("fechas Bogotá", () => {
  it("convierte instantes UTC al día de negocio de Bogotá", () => {
    expect(fechaISOBogota("2026-09-09T02:30:00Z")).toBe("2026-09-08");
    expect(minutosEntre("2026-09-09T02:00:00Z", "2026-09-09T02:17:30Z")).toBe(17);
    expect(sumarDias("2026-08-31", 1)).toBe("2026-09-01");
  });
  it("calcula la semana desde el lunes", () => {
    const r = rangoPredefinido("semana", new Date("2026-09-09T20:00:00-05:00"));
    expect(r).toEqual({ desde: "2026-09-07", hasta: "2026-09-09" });
  });
});

describe("iniciales", () => {
  it("toma las primeras letras del nombre", () => {
    expect(iniciales("Saboratto")).toBe("SA");
    expect(iniciales("La Casa del Perro")).toBe("LC");
    expect(iniciales("  ")).toBe("?");
  });
});

describe("configuración del negocio", () => {
  it("toma los métodos de pago que guardó el negocio", () => {
    const cfg = armarConfig([{ clave: "metodos_pago", valor: ["efectivo", "nequi"] }]);
    expect(cfg.metodos_pago).toEqual(["efectivo", "nequi"]);
  });

  it("sin fila guardada deja efectivo y Bre-B", () => {
    expect(armarConfig([]).metodos_pago).toEqual(["efectivo", "breb"]);
  });

  it("ignora valores inventados y nunca se queda sin métodos", () => {
    expect(armarConfig([{ clave: "metodos_pago", valor: ["efectivo", "bitcoin"] }]).metodos_pago).toEqual(["efectivo"]);
    expect(armarConfig([{ clave: "metodos_pago", valor: [] }]).metodos_pago).toEqual(["efectivo", "breb"]);
    expect(armarConfig([{ clave: "metodos_pago", valor: "efectivo" }]).metodos_pago).toEqual(["efectivo", "breb"]);
  });

  it("no pisa el resto de la configuración", () => {
    const cfg = armarConfig([
      { clave: "extra_combo", valor: 7000 },
      { clave: "metodos_pago", valor: ["breb"] },
    ]);
    expect(cfg.extra_combo).toBe(7000);
    expect(cfg.metodos_pago).toEqual(["breb"]);
    expect(cfg.umbrales_min).toEqual(CONFIG_DEFAULT.umbrales_min);
  });
});
