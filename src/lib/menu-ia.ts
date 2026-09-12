// Lectura del menú a partir de fotos con Gemini, y limpieza del resultado.
// La parte pura (validar y normalizar) no depende de la red y tiene pruebas.

import { z } from "zod";
import type { MenuImportado } from "./tipos";

// ---------- Esquema de lo que devuelve la IA ----------

const ProductoIA = z.object({
  nombre: z.string(),
  precio: z.number().nullable(),
  descripcion: z.string().nullable().optional(),
  ingredientes: z.array(z.string()).optional(),
});

const CategoriaIA = z.object({
  nombre: z.string(),
  productos: z.array(ProductoIA),
});

export const MenuIA = z.object({ categorias: z.array(CategoriaIA) });
export type MenuIA = z.infer<typeof MenuIA>;

/** JSON Schema que se le pasa a Gemini (subconjunto que soporta) */
export const ESQUEMA_JSON_MENU = {
  type: "object",
  properties: {
    categorias: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nombre: { type: "string", description: "Nombre de la sección de la carta, ej. Hamburguesas" },
          productos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nombre: { type: "string", description: "Nombre del producto tal como aparece" },
                precio: { anyOf: [{ type: "number" }, { type: "null" }], description: "Precio en pesos, entero, sin puntos. null si no se lee" },
                descripcion: { anyOf: [{ type: "string" }, { type: "null" }], description: "Descripción corta si la carta la tiene" },
                ingredientes: { type: "array", items: { type: "string" }, description: "Ingredientes listados, uno por elemento" },
              },
              required: ["nombre", "precio"],
            },
          },
        },
        required: ["nombre", "productos"],
      },
    },
  },
  required: ["categorias"],
} as const;

export const INSTRUCCION_MENU = `Eres un asistente que transcribe cartas de restaurantes a datos. Recibes una o varias fotos de la carta de un negocio de comida (pueden ser páginas distintas del mismo menú) y devuelves SOLO un JSON con el esquema indicado.

Reglas:
1. Transcribe únicamente lo que está en las fotos. No inventes productos, precios ni ingredientes.
2. Respeta las secciones de la carta como categorías (Hamburguesas, Perros, Bebidas, Postres...). Si un producto no tiene sección visible, ponlo en "Otros".
3. Los precios van en pesos colombianos como número entero: "$12.500" → 12500, "12,5" → 12500, "12" junto a otros precios de miles → 12000. Si un precio no se puede leer con seguridad, usa null.
4. Si un producto tiene varios tamaños o presentaciones con precios distintos, crea un producto por cada uno: "Coca Cola 350ml", "Coca Cola 1.5L".
5. Si la carta ofrece "combo" para un producto con precio propio, NO lo pongas como producto aparte: usa el precio del producto solo y deja la versión combo fuera (el negocio la configura aparte).
6. Los ingredientes van como lista de palabras o frases cortas, con la primera letra en mayúscula, sin la palabra "con". Si la carta no lista ingredientes, deja la lista vacía.
7. Mantén el orden en que aparecen en la carta.
8. Si la imagen no es una carta de comida, devuelve {"categorias": []}.`;

// ---------- Normalización (pura) ----------

const capitalizar = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function limpiarNombre(s: string): string {
  return s.replace(/\s+/g, " ").replace(/[.:;]+$/, "").trim();
}

function normalizarPrecio(p: number | null | undefined): number | null {
  if (p === null || p === undefined || !Number.isFinite(p) || p <= 0) return null;
  // "12.5" o "12" son precios escritos en miles: 12.5 → 12500
  return p < 1000 ? Math.round(p * 1000) : Math.round(p);
}

/**
 * Convierte la respuesta cruda de la IA en un menú limpio:
 * quita categorías vacías, une nombres repetidos, capitaliza y normaliza precios.
 * Lanza si el JSON no cumple el esquema.
 */
export function normalizarMenu(crudo: unknown): MenuImportado {
  const datos = MenuIA.parse(crudo);
  const categorias: MenuImportado["categorias"] = [];
  const catPorNombre = new Map<string, MenuImportado["categorias"][number]>();

  for (const c of datos.categorias) {
    const nombreCat = capitalizar(limpiarNombre(c.nombre)) || "Otros";
    const clave = nombreCat.toLowerCase();
    let cat = catPorNombre.get(clave);
    if (!cat) {
      cat = { nombre: nombreCat, emoji: emojiCategoria(nombreCat), permite_combo: false, productos: [] };
      catPorNombre.set(clave, cat);
      categorias.push(cat);
    }
    const vistos = new Set(cat.productos.map((p) => p.nombre.toLowerCase()));
    for (const p of c.productos) {
      const nombre = capitalizar(limpiarNombre(p.nombre));
      if (!nombre || vistos.has(nombre.toLowerCase())) continue;
      vistos.add(nombre.toLowerCase());
      cat.productos.push({
        nombre,
        precio: normalizarPrecio(p.precio),
        descripcion: p.descripcion?.trim() || null,
        ingredientes: (p.ingredientes ?? []).map((i) => capitalizar(limpiarNombre(i))).filter(Boolean),
      });
    }
  }

  return { categorias: categorias.filter((c) => c.productos.length > 0) };
}

/** Une varios menús (una foto por página) en uno solo */
export function unirMenus(menus: MenuImportado[]): MenuImportado {
  return normalizarMenu({ categorias: menus.flatMap((m) => m.categorias) });
}

const EMOJIS_CATEGORIA: [RegExp, string][] = [
  [/hamburgues/i, "🍔"],
  [/perro|hot ?dog/i, "🌭"],
  [/salchipapa|papas|fritas/i, "🍟"],
  [/pizza/i, "🍕"],
  [/sandwich|sándwich/i, "🥪"],
  [/bebida|gaseosa|jugo|refresco|limonada/i, "🥤"],
  [/cerveza|cocteles|coctel|licor/i, "🍺"],
  [/caf[eé]|capuchino|latte/i, "☕"],
  [/postre|helado|torta|dulce/i, "🍰"],
  [/ensalada|vegetal/i, "🥗"],
  [/pollo|alitas/i, "🍗"],
  [/carne|asado|parrilla|churrasco/i, "🥩"],
  [/arroz|chino|wok/i, "🍚"],
  [/taco|burrito|mexican/i, "🌮"],
  [/sopa|caldo/i, "🍲"],
  [/desayuno|huevo/i, "🍳"],
  [/adicional|extra|porci/i, "➕"],
];

export function emojiCategoria(nombre: string): string {
  for (const [re, e] of EMOJIS_CATEGORIA) if (re.test(nombre)) return e;
  return "🍽️";
}

/** Precios que la IA no pudo leer: el dueño debe completarlos antes de importar */
export function preciosFaltantes(menu: MenuImportado): number {
  return menu.categorias.reduce((s, c) => s + c.productos.filter((p) => p.precio === null).length, 0);
}
