import { redirect } from "next/navigation";
import { esSuperadmin, sesionActual } from "@/lib/supabase/server";
import { PanelPlataforma } from "@/components/plataforma/PanelPlataforma";

export const metadata = { title: "Plataforma · Comandapp" };
export const dynamic = "force-dynamic";

/** Solo para el dueño de Comandapp: todos los negocios registrados */
export default async function PaginaPlataforma() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login?volver=/plataforma");
  if (!(await esSuperadmin())) redirect("/comandas");
  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <PanelPlataforma />
    </main>
  );
}
