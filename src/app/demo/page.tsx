import type { Metadata } from "next";
import { DemoInteractiva } from "@/components/demo/DemoInteractiva";

export const metadata: Metadata = {
  title: "Demo: prueba Comandapp sin registrarte",
  description:
    "Recorre Comandapp con datos de ejemplo: toma un pedido, míralo en la cola de cocina con el semáforo de tiempos y entra al panel de ventas. Sin cuenta y sin instalar nada.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "Demo de Comandapp: la cola, el pedido y el panel",
    description: "Pruébala sin registrarte, con un tutorial que te lleva paso a paso.",
    url: "/demo",
  },
};

// Los pedidos de ejemplo se arman con la hora actual ("hace 7 minutos"), así que
// la página se dibuja en cada visita; si se congelara, los relojes no cuadrarían.
export const dynamic = "force-dynamic";

export default function PaginaDemo() {
  return <DemoInteractiva />;
}
