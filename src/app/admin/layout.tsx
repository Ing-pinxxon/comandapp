import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { sesionActual } from "@/lib/supabase/server";
import { NavAdmin } from "@/components/admin/NavAdmin";

export const dynamic = "force-dynamic";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login");
  if (sesion.rol !== "admin") redirect("/comandas");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex flex-col gap-2 border-b border-borde bg-panel p-3 lg:w-60 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 px-1 py-1">
          <span className="flex size-9 items-center justify-center rounded-lg bg-marca text-lg">🍔</span>
          <div className="leading-tight">
            <div className="font-black">Saboratto</div>
            <div className="text-xs text-texto-suave">Panel administrador</div>
          </div>
        </div>
        <NavAdmin />
        <Link href="/comandas" className="btn mt-auto justify-start bg-panel-2 text-texto-suave">
          <ArrowLeft className="size-5" /> Ir a la cola
        </Link>
      </aside>
      <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
    </div>
  );
}
