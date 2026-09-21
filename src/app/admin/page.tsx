import { Suspense } from "react";
import { Dashboard } from "@/components/admin/Dashboard";

export const metadata = { title: "Resumen", robots: { index: false, follow: false } };

export default function PaginaAdmin() {
  return (
    <Suspense fallback={<p className="text-texto-suave">Cargando…</p>}>
      <Dashboard />
    </Suspense>
  );
}
