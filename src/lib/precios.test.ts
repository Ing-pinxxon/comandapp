import { describe, expect, it } from "vitest";
import { calcularTotales, precioUnitario } from "./precios";
import { CONFIG_DEFAULT } from "./tipos";
import { nivelSemaforo } from "./semaforo";
import { normalizarTelefono, plantillaMensaje, telefonoBonito, urlWhatsApp } from "./whatsapp";
import { fechaISOBogota, minutosEntre, rangoPredefinido, sumarDias } from "./fechas";

const categorias = [
  { nombre: "Hamburguesas", lleva_icopor: false },
  { nombre: "Perros", lleva_icopor: true },
  { nombre: "Salchipapas", lleva_icopor: true },
  { nombre: "Bebidas", lleva_icopor: false },
];

describe("precios (misma lógica que la web, sin descuento)", () => {
  it("cobra icopor solo a perros y salchipapas y suma el domicilio", () => {
    const t = calcularTotales(
      [
        { precio_unitario: 17500, cantidad: 1, categoria_nombre: "Hamburguesas" }, // combo
        { precio_unitario: 15000, cantidad: 1, categoria_nombre: "Hamburguesas" },
        { precio_unitario: 9000, cantidad: 1, categoria_nombre: "Perros" },
        { precio_unitario: 10000, cantidad: 1, categoria_nombre: "Salchipapas" },
        { precio_unitario: 3000, cantidad: 1, categoria_nombre: "Bebidas" }, // bebida X
      ],
      categorias,
      CONFIG_DEFAULT,
      true,
    );
    expect(t.subtotal).toBe(54500);
    expect(t.unidadesIcopor).toBe(2);
    expect(t.costoIcopor).toBe(1000);
    expect(t.costoDomicilio).toBe(1000);
    expect(t.total).toBe(56500);
  });

  it("multiplica el icopor por la cantidad y omite domicilio si no aplica", () => {
    const t = calcularTotales([{ precio_unitario: 13000, cantidad: 3, categoria_nombre: "Perros" }], categorias, CONFIG_DEFAULT, false);
    expect(t.unidadesIcopor).toBe(3);
    expect(t.costoIcopor).toBe(1500);
    expect(t.costoDomicilio).toBe(0);
    expect(t.total).toBe(40500);
  });

  it("usa precio_combo cuando existe y precio + extra cuando no", () => {
    expect(precioUnitario({ precio: 11500, precio_combo: 17500 }, true, CONFIG_DEFAULT)).toBe(17500);
    expect(precioUnitario({ precio: 11500, precio_combo: null }, true, CONFIG_DEFAULT)).toBe(17500);
    expect(precioUnitario({ precio: 11500, precio_combo: 17500 }, false, CONFIG_DEFAULT)).toBe(11500);
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
    // 02:30 UTC del 9 de sep = 21:30 del 8 de sep en Bogotá
    expect(fechaISOBogota("2026-09-09T02:30:00Z")).toBe("2026-09-08");
    expect(minutosEntre("2026-09-09T02:00:00Z", "2026-09-09T02:17:30Z")).toBe(17);
    expect(sumarDias("2026-08-31", 1)).toBe("2026-09-01");
  });
  it("calcula la semana desde el lunes", () => {
    // 2026-09-09 es miércoles
    const r = rangoPredefinido("semana", new Date("2026-09-09T20:00:00-05:00"));
    expect(r).toEqual({ desde: "2026-09-07", hasta: "2026-09-09" });
  });
});
