import { notFound } from "next/navigation";
import { catalogoServidor } from "@/lib/catalogo-servidor";
import { supabaseServidor } from "@/lib/supabase/server";
import { formatoCOP } from "@/lib/fechas";

export const metadata = { title: "Diagnóstico de conexión" };
export const dynamic = "force-dynamic";

/** Pide sesión y catálogo a la vez y cronometra cuánto tarda Supabase en responder */
async function medirCarga() {
  const t0 = Date.now();
  const [sb, catalogo] = await Promise.all([supabaseServidor(), catalogoServidor()]);
  const { data } = await sb.auth.getClaims();
  return {
    sesion: (data?.claims?.email as string | undefined) ?? null,
    catalogo,
    ms: Date.now() - t0,
  };
}

/**
 * Solo desarrollo. Comprueba desde el servidor que Supabase responde y que el
 * catálogo está cargado. Útil para saber si falta ejecutar 03_seed.sql.
 */
export default async function DiagnosticoConexion() {
  if (process.env.NODE_ENV !== "development") notFound();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(sin configurar)";
  const hayClave = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  let error: string | null = null;
  let catalogo: Awaited<ReturnType<typeof medirCarga>>["catalogo"] | null = null;
  let sesion: string | null = null;
  let msCarga = 0;

  try {
    const r = await medirCarga();
    sesion = r.sesion;
    catalogo = r.catalogo;
    msCarga = r.ms;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const productos = catalogo?.productos.length ?? 0;
  const categorias = catalogo?.categorias.length ?? 0;

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-black">Diagnóstico de conexión</h1>

      <section className="tarjeta space-y-2 p-4 text-sm">
        <Fila etiqueta="URL de Supabase" valor={url} ok={url.startsWith("https://")} />
        <Fila etiqueta="Clave anon configurada" valor={hayClave ? "sí" : "no"} ok={hayClave} />
        <Fila etiqueta="Sesión en este navegador" valor={sesion ?? "sin iniciar sesión"} ok={Boolean(sesion)} />
        <Fila etiqueta="Categorías visibles" valor={String(categorias)} ok={categorias > 0} />
        <Fila etiqueta="Productos visibles" valor={String(productos)} ok={productos > 0} />
        <Fila etiqueta="Costo de domicilio leído" valor={formatoCOP(catalogo?.config.costo_domicilio ?? 0)} ok={Boolean(catalogo)} />
      </section>

      {error && (
        <div className="rounded-xl border border-peligro/50 bg-peligro/10 p-4 text-sm text-red-200">
          <b>Error:</b> {error}
        </div>
      )}

      <section className="tarjeta space-y-2 p-4 text-sm">
        <h2 className="font-bold">Velocidad</h2>
        <Fila etiqueta="Cargar sesión y menú" valor={`${msCarga} ms`} ok={msCarga < 600} />
        <p className="pt-1 text-texto-suave">
          Es lo que tarda Supabase en responder desde este equipo. Por encima de 600 ms conviene revisar
          la conexión o mover el proyecto de Supabase a una región más cercana.
        </p>
      </section>

      <div className="tarjeta space-y-2 p-4 text-sm text-texto-suave">
        <p className="font-bold text-texto">Cómo leer esto</p>
        <p>Sin haber iniciado sesión, categorías y productos salen en <b>0</b> aunque todo esté bien: la base solo muestra datos a usuarios autenticados.</p>
        <p>Si ya iniciaste sesión y aun así ves <b>0 productos</b>, falta ejecutar <code>supabase/03_seed.sql</code> en el SQL Editor de Supabase.</p>
        <p>Si aparece un error de red o de clave, revisa <code>.env.local</code> y reinicia el servidor.</p>
      </div>
    </main>
  );
}

function Fila({ etiqueta, valor, ok }: { etiqueta: string; valor: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-borde pb-2 last:border-0">
      <span className="text-texto-suave">{etiqueta}</span>
      <span className={`font-bold ${ok ? "text-green-300" : "text-yellow-200"}`}>
        {ok ? "✓" : "•"} <span className="break-all">{valor}</span>
      </span>
    </div>
  );
}
