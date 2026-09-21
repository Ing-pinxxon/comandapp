import { notFound, redirect } from "next/navigation";
import { empleadoActual, negocioActual } from "@/lib/supabase/server";
import { catalogoServidor, pedidoServidor } from "@/lib/catalogo-servidor";
import { FormularioPedido } from "@/components/pedido/FormularioPedido";

export const metadata = { title: "Editar pedido", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PaginaEditarPedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) notFound();
  const negocio = await negocioActual();
  if (!negocio) redirect("/onboarding");
  const empleado = await empleadoActual(negocio.id);
  if (!empleado) redirect(`/quien?volver=/comandas/${idNum}/editar`);
  const [catalogo, pedido] = await Promise.all([catalogoServidor(negocio), pedidoServidor(negocio.id, idNum)]);
  if (!pedido) notFound();
  return <FormularioPedido catalogo={catalogo} pedidoExistente={pedido} empleadoId={empleado.id} />;
}
