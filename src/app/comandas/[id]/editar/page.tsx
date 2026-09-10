import { notFound } from "next/navigation";
import { catalogoServidor, pedidoServidor } from "@/lib/catalogo-servidor";
import { FormularioPedido } from "@/components/pedido/FormularioPedido";

export const metadata = { title: "Editar pedido · Comandas Saboratto" };
export const dynamic = "force-dynamic";

export default async function PaginaEditarPedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) notFound();
  const [catalogo, pedido] = await Promise.all([catalogoServidor(), pedidoServidor(idNum)]);
  if (!pedido) notFound();
  return <FormularioPedido catalogo={catalogo} pedidoExistente={pedido} />;
}
