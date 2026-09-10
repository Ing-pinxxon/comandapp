import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/supabase/server";
import { catalogoServidor, pedidosHoyServidor } from "@/lib/catalogo-servidor";
import { ColaPedidos } from "@/components/comandas/ColaPedidos";

export const metadata = { title: "Cola de pedidos · Comandas Saboratto" };
export const dynamic = "force-dynamic";

export default async function PaginaComandas() {
  // Las tres consultas van a la vez: si fueran en fila, la pantalla tardaría el triple.
  const [sesion, pedidos, catalogo] = await Promise.all([sesionActual(), pedidosHoyServidor(), catalogoServidor()]);
  if (!sesion) redirect("/login");
  return <ColaPedidos inicial={pedidos} catalogoInicial={catalogo} rol={sesion.rol} />;
}
