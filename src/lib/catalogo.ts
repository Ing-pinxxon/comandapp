// Tipos y utilidades del catálogo compartidos entre servidor y navegador.
// Este archivo NO lleva "use client": lo usan tanto los Server Components
// (lib/catalogo-servidor.ts) como los componentes del navegador (lib/datos.ts).

import { CONFIG_DEFAULT, METODOS_PAGO, type Cargo, type Categoria, type Configuracion, type MetodoPago, type Negocio, type Producto } from "./tipos";

export interface Catalogo {
  negocio: Negocio;
  categorias: Categoria[];
  productos: Producto[];
  cargos: Cargo[];
  config: Configuracion;
}

/** Convierte las filas clave/valor de `configuracion` en el objeto tipado */
export function armarConfig(filas: { clave: string; valor: unknown }[] | null | undefined): Configuracion {
  const cfg: Configuracion = structuredClone(CONFIG_DEFAULT);
  for (const f of filas ?? []) {
    switch (f.clave) {
      case "umbrales_min": {
        const v = f.valor as Partial<Configuracion["umbrales_min"]>;
        cfg.umbrales_min = { verde: Number(v?.verde ?? cfg.umbrales_min.verde), amarillo: Number(v?.amarillo ?? cfg.umbrales_min.amarillo) };
        break;
      }
      case "extra_combo":
        cfg.extra_combo = Number(f.valor);
        break;
      case "mensajes_whatsapp": {
        const v = f.valor as Partial<Configuracion["mensajes_whatsapp"]>;
        cfg.mensajes_whatsapp = { listo: v?.listo ?? cfg.mensajes_whatsapp.listo, en_camino: v?.en_camino ?? cfg.mensajes_whatsapp.en_camino };
        break;
      }
      case "metodos_pago": {
        // Si la fila viene vacía o con basura, se quedan los de por defecto:
        // sin métodos no se puede cobrar y la pantalla quedaría inservible.
        const validos = (Array.isArray(f.valor) ? f.valor : []).filter((v): v is MetodoPago => METODOS_PAGO.some((m) => m.valor === v));
        if (validos.length > 0) cfg.metodos_pago = validos;
        break;
      }
    }
  }
  return cfg;
}

/** Nombre de la cookie con el negocio elegido y la del empleado identificado por PIN */
export const COOKIE_NEGOCIO = "negocio_actual";
export const COOKIE_EMPLEADO = "empleado_actual";
/** Horas que dura la identificación por PIN antes de pedirla de nuevo */
export const HORAS_PIN = 8;
