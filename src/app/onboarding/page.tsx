import { redirect } from "next/navigation";
import { misNegociosServidor, sesionActual } from "@/lib/supabase/server";
import { AsistenteOnboarding } from "@/components/onboarding/AsistenteOnboarding";

export const metadata = { title: "Configura tu negocio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PaginaOnboarding({ searchParams }: { searchParams: Promise<{ nuevo?: string }> }) {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login?volver=/onboarding");
  const { nuevo } = await searchParams;
  // Quien ya tiene negocio va directo a la tablet, salvo que quiera crear otro
  const negocios = await misNegociosServidor();
  if (negocios.length > 0 && !nuevo) redirect("/quien");

  return (
    <main className="flex flex-1 items-start justify-center p-4 sm:p-8">
      <AsistenteOnboarding yaTieneNegocios={negocios.length > 0} />
    </main>
  );
}
