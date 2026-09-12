import { redirect } from "next/navigation";
import { empleadosServidor } from "@/lib/catalogo-servidor";
import { misNegociosServidor, negocioActual, sesionActual } from "@/lib/supabase/server";
import { ElegirEmpleado } from "@/components/login/ElegirEmpleado";

export const metadata = { title: "¿Quién eres? · Comandapp" };
export const dynamic = "force-dynamic";

export default async function PaginaQuien({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login");
  const negocio = await negocioActual();
  if (!negocio) redirect("/onboarding");
  const { volver } = await searchParams;
  const [empleados, negocios] = await Promise.all([empleadosServidor(negocio.id), misNegociosServidor()]);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <ElegirEmpleado negocio={negocio} negocios={negocios} empleados={empleados} volver={volver && volver.startsWith("/") ? volver : "/comandas"} />
    </main>
  );
}
