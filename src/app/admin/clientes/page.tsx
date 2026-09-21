import { Suspense } from "react";
import { TablaClientes } from "@/components/admin/TablaClientes";

export const metadata = { title: "Clientes", robots: { index: false, follow: false } };

export default function PaginaClientes() {
  return (
    <Suspense fallback={<p className="text-texto-suave">Cargando…</p>}>
      <TablaClientes />
    </Suspense>
  );
}
