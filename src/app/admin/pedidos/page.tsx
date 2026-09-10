import { Suspense } from "react";
import { TablaPedidos } from "@/components/admin/TablaPedidos";

export const metadata = { title: "Pedidos · Admin Saboratto" };

export default function PaginaPedidosAdmin() {
  return (
    <Suspense fallback={<p className="text-texto-suave">Cargando…</p>}>
      <TablaPedidos />
    </Suspense>
  );
}
