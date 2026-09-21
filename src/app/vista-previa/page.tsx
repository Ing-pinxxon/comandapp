import { notFound } from "next/navigation";
import { ColaPedidos } from "@/components/comandas/ColaPedidos";
import { catalogoDemo, crearPedidosDemo, empleadoDemo } from "./datos-demo";

export const metadata = { title: "Vista previa · Cola" };
export const dynamic = "force-dynamic";

/** Solo desarrollo: cola con pedidos de ejemplo, sin base de datos */
export default function VistaPreviaCola() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <ColaPedidos inicial={crearPedidosDemo()} catalogoInicial={catalogoDemo} empleado={empleadoDemo} demo />;
}
