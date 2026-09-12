import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { empleadoActual, negocioActual, sesionActual } from "@/lib/supabase/server";
import { iniciales } from "@/lib/tipos";
import { NavAdmin } from "@/components/admin/NavAdmin";
import { NegocioProvider } from "@/components/NegocioProvider";
import { Logotipo } from "@/components/ui/Logotipo";

export const dynamic = "force-dynamic";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login");
  const negocio = await negocioActual();
  if (!negocio) redirect("/onboarding");
  // El panel es solo para el dueño: si no se ha identificado con su PIN, o es un empleado, no entra.
  const empleado = await empleadoActual(negocio.id);
  if (!empleado) redirect("/quien?volver=/admin");
  if (!empleado.es_dueno) redirect("/comandas");

  return (
    <NegocioProvider negocio={negocio} empleado={empleado}>
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Barra lateral negra (referencia de diseño): logotipo, negocio y secciones */}
        <aside className="flex flex-col gap-3 bg-negro p-3 text-white lg:sticky lg:top-0 lg:h-screen lg:w-60">
          <div className="hidden px-1 pt-1 lg:block">
            <Logotipo claro />
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-2 py-2">
            {negocio.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={negocio.logo_url} alt="" className="size-9 rounded-lg object-cover" />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-lg bg-marca text-xs font-black text-black">{iniciales(negocio.nombre)}</span>
            )}
            <div className="min-w-0 leading-tight">
              <div className="truncate font-black">{negocio.nombre}</div>
              <div className="text-xs text-white/60">Panel del dueño</div>
            </div>
          </div>
          <NavAdmin />
          <Link href="/comandas" className="btn mt-auto justify-start bg-white/10 text-white hover:bg-white/15">
            <ArrowLeft className="size-5" /> Ir a la cola
          </Link>
        </aside>
        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </NegocioProvider>
  );
}
