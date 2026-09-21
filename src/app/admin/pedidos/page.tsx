import { Suspense } from "react";
import { TablaPedidos } from "@/components/admin/TablaPedidos";

export const metadata = { title: "Pedidos", robots: { index: false, follow: false } };

export default function PaginaPedidosAdmin() {
  return (
    <Suspense fallback={<p className="text-texto-suave">Cargando…</p>}>
      <TablaPedidos />
    </Suspense>
  );
}
