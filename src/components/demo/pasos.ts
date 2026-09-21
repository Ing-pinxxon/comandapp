import type { PasoTour } from "@/lib/tour";

/**
 * Recorrido guiado de la demo. Los pasos con `await` esperan a que el visitante
 * haga la acción de verdad; el evento lo dispara DemoInteractiva al detectar el clic.
 */
export const PASOS_TOUR: PasoTour[] = [
  {
    el: '[data-tour="pedido"]',
    title: "La cola de pedidos",
    text: "Cada tarjeta es un pedido. El número grande son los minutos que lleva esperando: verde va bien, amarillo apura y naranja está demorado.",
  },
  {
    el: '[data-tour="entregar"]',
    title: "Cuando sale el pedido",
    text: "Tócalo y sale de la cola. Queda guardado con la hora, así sabes cuánto te demoras de verdad.",
    await: "demo:entregado",
    hint: "Toca «Entregado» para seguir",
  },
  {
    el: '[data-tour="nuevo"]',
    title: "Tomar un pedido nuevo",
    text: "Se abre el menú completo encima de la cola. Sin esperas ni pantallas de carga.",
    await: "demo:formulario",
    hint: "Toca «Nuevo pedido» para seguir",
  },
  {
    el: '[data-tour="productos"]',
    title: "El menú del negocio",
    text: "Un toque agrega el producto. Este es un menú de ejemplo; el tuyo lo cargas con una foto de tu carta.",
    await: "demo:producto",
    hint: "Toca cualquier producto para seguir",
  },
  {
    el: '[data-tour="ingredientes"]',
    title: "Sin cebolla, sin tomate",
    text: "Apaga lo que el cliente no quiere tocando el ingrediente. Queda escrito en la comanda, sin notas a mano.",
  },
  {
    el: '[data-tour="totales"]',
    title: "El total, siempre al día",
    text: "Domicilio, empaque y combos se suman solos. Nadie vuelve a sacar la calculadora.",
  },
  {
    el: '[data-tour="volver"]',
    title: "De vuelta a la cocina",
    text: "Al guardar, el pedido entra a la cola y empieza a contar el tiempo. Aquí lo cerramos sin guardar: esto es una demostración.",
    await: "demo:volver",
    hint: "Toca la flecha para volver a la cola",
  },
  {
    el: '[data-tour="tab-panel"]',
    title: "El panel del dueño",
    text: "Aquí ves qué se vende, a qué horas y cuánto te queda.",
    await: "demo:panel",
    hint: "Toca «Panel del dueño» para seguir",
  },
  {
    el: '[data-tour="kpis"]',
    title: "¿Voy mejor o peor?",
    text: "Cada número se compara solo con el periodo anterior. Si cargas el costo de tus productos, también ves la ganancia real.",
  },
];
