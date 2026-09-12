import { notFound } from "next/navigation";
import { catalogoServidor, empleadosServidor } from "@/lib/catalogo-servidor";
import { esSuperadmin, negocioActual, supabaseServidor } from "@/lib/supabase/server";

export const metadata = { title: "Diagnóstico de conexión" };
export const dynamic = "force-dynamic";

/** Pide sesión, negocio y catálogo a la vez y cronometra cuánto tarda Supabase en responder */
async function medirCarga() {
  const t0 = Date.now();
  const [sb, negocio] = await Promise.all([supabaseServidor(), negocioActual()]);
  const { data } = await sb.auth.getClaims();
  const [catalogo, empleados, superadmin] = negocio
    ? await Promise.all([catalogoServidor(negocio), empleadosServidor(negocio.id), esSuperadmin()])
    : [null, [], false];
  return {
    sesion: (data?.claims?.email as string | undefined) ?? null,
    negocio,
    catalogo,
    empleados: empleados.length,
    superadmin,
    ms: Date.now() - t0,
  };
}

/**
 * Solo desarrollo. Comprueba desde el servidor que Supabase responde, que el
 * usuario tiene negocio y que su catálogo, cargos y empleados están cargados.
 */
export default async function DiagnosticoConexion() {
  if (process.env.NODE_ENV !== "development") notFound();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(sin configurar)";
  const hayClave = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hayGemini = Boolean(process.env.GEMINI_API_KEY);

  let error: string | null = null;
  let r: Awaited<ReturnType<typeof medirCarga>> | null = null;
  try {
    r = await medirCarga();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-black">Diagnóstico de conexión</h1>

      <section className="tarjeta space-y-2 p-4 text-sm">
        <Fila etiqueta="URL de Supabase" valor={url} ok={url.startsWith("https://")} />
        <Fila etiqueta="Clave anon configurada" valor={hayClave ? "sí" : "no"} ok={hayClave} />
        <Fila etiqueta="Llave de Gemini (lectura de menú)" valor={hayGemini ? "sí" : "no"} ok={hayGemini} />
        <Fila etiqueta="Sesión en este navegador" valor={r?.sesion ?? "sin iniciar sesión"} ok={Boolean(r?.sesion)} />
        <Fila etiqueta="Negocio actual" valor={r?.negocio ? `${r.negocio.nombre} (${r.negocio.slug})` : "ninguno"} ok={Boolean(r?.negocio)} />
        <Fila etiqueta="Categorías" valor={String(r?.catalogo?.categorias.length ?? 0)} ok={(r?.catalogo?.categorias.length ?? 0) > 0} />
        <Fila etiqueta="Productos" valor={String(r?.catalogo?.productos.length ?? 0)} ok={(r?.catalogo?.productos.length ?? 0) > 0} />
        <Fila etiqueta="Cargos configurados" valor={String(r?.catalogo?.cargos.length ?? 0)} ok={Boolean(r?.catalogo)} />
        <Fila etiqueta="Empleados activos" valor={String(r?.empleados ?? 0)} ok={(r?.empleados ?? 0) > 0} />
        <Fila etiqueta="Dueño de la plataforma" valor={r?.superadmin ? "sí" : "no"} ok={Boolean(r?.superadmin)} />
      </section>

      {error && (
        <div className="rounded-xl border border-peligro/50 bg-peligro/10 p-4 text-sm text-peligro">
          <b>Error:</b> {error}
        </div>
      )}

      <section className="tarjeta space-y-2 p-4 text-sm">
        <h2 className="font-bold">Velocidad</h2>
        <Fila etiqueta="Cargar sesión, negocio y menú" valor={`${r?.ms ?? 0} ms`} ok={(r?.ms ?? 0) < 600} />
        <p className="pt-1 text-texto-suave">
          Es lo que tarda Supabase en responder desde este equipo. Por encima de 600 ms conviene revisar la conexión o mover el proyecto de Supabase a una región más cercana.
        </p>
      </section>

      <div className="tarjeta space-y-2 p-4 text-sm text-texto-suave">
        <p className="font-bold text-texto">Cómo leer esto</p>
        <p>Sin haber iniciado sesión todo sale en <b>0</b> aunque esté bien: la base solo muestra datos a usuarios autenticados.</p>
        <p>Si ya iniciaste sesión y no aparece negocio, falta ejecutar <code>supabase/06_multinegocio.sql</code> o crear el negocio en <code>/onboarding</code>.</p>
        <p>Si aparece un error de red o de clave, revisa <code>.env.local</code> y reinicia el servidor.</p>
      </div>
    </main>
  );
}

function Fila({ etiqueta, valor, ok }: { etiqueta: string; valor: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-borde pb-2 last:border-0">
      <span className="text-texto-suave">{etiqueta}</span>
      <span className={`font-bold ${ok ? "text-ok" : "text-marca-oscuro"}`}>
        {ok ? "✓" : "•"} <span className="break-all">{valor}</span>
      </span>
    </div>
  );
}
