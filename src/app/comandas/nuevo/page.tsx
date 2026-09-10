import { catalogoServidor } from "@/lib/catalogo-servidor";
import { FormularioPedido } from "@/components/pedido/FormularioPedido";

export const metadata = { title: "Nuevo pedido · Comandas Saboratto" };
export const dynamic = "force-dynamic";

export default async function PaginaNuevoPedido() {
  const catalogo = await catalogoServidor();
  return <FormularioPedido catalogo={catalogo} />;
}
