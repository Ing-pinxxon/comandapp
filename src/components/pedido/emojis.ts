// Emoji por ingrediente, para reconocerlos de un vistazo sin leer.
// Tomado de EMOJIS_INGREDIENTES en WebSaboratto/src/cart.js.

const EMOJIS: Record<string, string> = {
  Queso: "🧀",
  "Queso doble crema": "🧀",
  "Salsa cheddar": "🧀",
  "Queso costeño": "🧀",
  "Cebolla Saboratto": "🧅",
  Cebolla: "🧅",
  Lechuga: "🥬",
  Tomate: "🍅",
  "Papa ripio": "🍟",
  Papas: "🍟",
  "Salsa de la casa": "🥣",
  Salsas: "🥣",
  "Salsa de ajo": "🥣",
  "Jamón ahumado": "🍖",
  Jamón: "🍖",
  Tocineta: "🥓",
  "Huevo de codorniz": "🥚",
  Huevo: "🥚",
  Salchicha: "🌭",
  Carne: "🥩",
  Maíz: "🌽",
  Plátano: "🍌",
  Aguacate: "🥑",
  Piña: "🍍",
};

/** Devuelve el emoji del ingrediente; si no está en la lista, uno genérico */
export function emojiIngrediente(nombre: string): string {
  if (EMOJIS[nombre]) return EMOJIS[nombre];
  const clave = Object.keys(EMOJIS).find((k) => nombre.toLowerCase().includes(k.toLowerCase()));
  return clave ? EMOJIS[clave] : "🔸";
}
