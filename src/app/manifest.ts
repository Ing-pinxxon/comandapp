import type { MetadataRoute } from "next";

// Permite instalar Comandapp como app en la tablet o el celular.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Comandapp · Comandas para tu negocio de comida",
    short_name: "Comandapp",
    description: "Toma pedidos, míralos en cocina con semáforo de tiempos y conoce qué vendes.",
    start_url: "/comandas",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f6f3ec",
    theme_color: "#f6f3ec",
    lang: "es",
    categories: ["business", "food", "productivity"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
