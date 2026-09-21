// Textos de la landing. Están aquí para que las preguntas frecuentes se usen
// dos veces: en la página y en los datos estructurados que lee Google.

export interface Pregunta {
  pregunta: string;
  respuesta: string;
}

/** Redactadas como la gente las escribe en el buscador */
export const PREGUNTAS: Pregunta[] = [
  {
    pregunta: "¿Cuánto cuesta Comandapp?",
    respuesta:
      "Es gratis durante el lanzamiento, sin límite de pedidos ni de empleados y sin tarjeta de crédito. Cuando empecemos a cobrar te avisamos con un mes de anticipación.",
  },
  {
    pregunta: "¿Sirve para un negocio de comidas rápidas con domicilios?",
    respuesta:
      "Sí, es justamente para lo que está hecho: hamburgueserías, perros calientes, pizzerías, salchipapas y cualquier negocio que venda para llevar o a domicilio. Cobra el domicilio y el empaque automáticamente según las reglas que configures.",
  },
  {
    pregunta: "¿Sirve para un restaurante con mesas y meseros?",
    respuesta:
      "Hoy no. Comandapp maneja pedidos para llevar y a domicilio: no tiene mapa de mesas ni cuentas por mesa. Si tu restaurante también vende para llevar, te sirve para esa parte.",
  },
  {
    pregunta: "¿Necesito instalar algo o comprar un equipo especial?",
    respuesta:
      "No. Funciona en el navegador de cualquier tablet, computador o celular. Abres la dirección, la agregas a la pantalla de inicio y se comporta como una app. No hay que comprar ni instalar nada.",
  },
  {
    pregunta: "¿Funciona sin internet?",
    respuesta:
      "No. Comandapp necesita internet porque los pedidos se sincronizan entre la tablet de la caja y la de la cocina al instante. Con el internet del local o datos del celular es suficiente.",
  },
  {
    pregunta: "¿Cómo cargo mi menú? ¿Toca escribir producto por producto?",
    respuesta:
      "Le tomas una foto a tu carta y la inteligencia artificial arma el menú con nombres, precios e ingredientes. Tú revisas y corriges lo que haga falta antes de guardarlo. Si prefieres, también puedes escribir los productos a mano.",
  },
  {
    pregunta: "¿Se conecta con WhatsApp?",
    respuesta:
      "Sí, de dos formas. Con un toque le avisas al cliente que su pedido está listo o va en camino. Y si tienes un bot de pedidos por WhatsApp, puede mandar los pedidos directo a tu cola de cocina.",
  },
  {
    pregunta: "¿Cada empleado necesita una cuenta de correo?",
    respuesta:
      "No. El dueño abre sesión una vez en la tablet y cada empleado entra con un PIN de cuatro a seis dígitos. Así queda registrado quién tomó cada pedido sin pedirle correo a nadie.",
  },
  {
    pregunta: "¿Mis datos están seguros?",
    respuesta:
      "Cada negocio solo ve lo suyo: la base de datos lo separa por cuenta, no por lo que muestre la pantalla. Tus ventas no las ve ningún otro negocio de la plataforma.",
  },
  {
    pregunta: "¿Puedo saber cuánto estoy ganando y no solo cuánto vendo?",
    respuesta:
      "Sí. Si cargas cuánto te cuesta cada producto, el panel te muestra la ganancia y el margen, además de compararte con el periodo anterior para saber si vas mejor o peor.",
  },
];

export const INCLUYE_PLAN = [
  "Pedidos ilimitados",
  "Todos los empleados que necesites",
  "Menú a partir de una foto de tu carta",
  "Cola de cocina con semáforo de tiempos",
  "Avisos al cliente por WhatsApp",
  "Panel de ventas, ganancia y clientes",
  "Conexión con tu bot de WhatsApp",
];
