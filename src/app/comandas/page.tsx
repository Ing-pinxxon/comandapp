import { redirect } from "next/navigation";
import { empleadoActual, negocioActual, sesionActual } from "@/lib/supabase/server";
import { catalogoServidor, pedidosHoyServidor } from "@/lib/catalogo-servidor";
import { ColaPedidos } from "@/components/comandas/ColaPedidos";

export const metadata = { title: "Cola de pedidos · Comandapp" };
export const dynamic = "force-dynamic";

export default async function PaginaComandas() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login");
  const negocio = await negocioActual();
  if (!negocio) redirect("/onboarding");
  const empleado = await empleadoActual(negocio.id);
  if (!empleado) redirect("/quien");

  const [pedidos, catalogo] = await Promise.all([pedidosHoyServidor(negocio.id), catalogoServidor(negocio)]);
  return <ColaPedidos inicial={pedidos} catalogoInicial={catalogo} empleado={empleado} />;
}
