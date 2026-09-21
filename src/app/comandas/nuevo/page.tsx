import { redirect } from "next/navigation";
import { empleadoActual, negocioActual } from "@/lib/supabase/server";
import { catalogoServidor } from "@/lib/catalogo-servidor";
import { FormularioPedido } from "@/components/pedido/FormularioPedido";

export const metadata = { title: "Nuevo pedido", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PaginaNuevoPedido() {
  const negocio = await negocioActual();
  if (!negocio) redirect("/onboarding");
  const empleado = await empleadoActual(negocio.id);
  if (!empleado) redirect("/quien?volver=/comandas/nuevo");
  const catalogo = await catalogoServidor(negocio);
  return <FormularioPedido catalogo={catalogo} empleadoId={empleado.id} />;
}
