import { notFound } from "next/navigation";
import { FormularioPedido } from "@/components/pedido/FormularioPedido";
import { catalogoDemo, empleadoDemo } from "../datos-demo";

export const metadata = { title: "Vista previa · Nuevo pedido" };
export const dynamic = "force-dynamic";

/** Solo desarrollo: formulario de pedido con catálogo de ejemplo, sin base de datos */
export default function VistaPreviaPedido() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <FormularioPedido catalogo={catalogoDemo} empleadoId={empleadoDemo.id} demo />;
}
