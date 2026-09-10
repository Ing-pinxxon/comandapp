// Tipos y utilidades del catálogo compartidos entre servidor y navegador.
// Este archivo NO lleva "use client": lo usan tanto los Server Components
// (lib/catalogo-servidor.ts) como los componentes del navegador (lib/datos.ts).

import { CONFIG_DEFAULT, type Categoria, type Configuracion, type Producto } from "./tipos";

export interface Catalogo {
  categorias: Categoria[];
  productos: Producto[];
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
      case "costo_domicilio":
        cfg.costo_domicilio = Number(f.valor);
        break;
      case "costo_icopor":
        cfg.costo_icopor = Number(f.valor);
        break;
      case "extra_combo":
        cfg.extra_combo = Number(f.valor);
        break;
      case "mensajes_whatsapp": {
        const v = f.valor as Partial<Configuracion["mensajes_whatsapp"]>;
        cfg.mensajes_whatsapp = { listo: v?.listo ?? cfg.mensajes_whatsapp.listo, en_camino: v?.en_camino ?? cfg.mensajes_whatsapp.en_camino };
        break;
      }
    }
  }
  return cfg;
}
