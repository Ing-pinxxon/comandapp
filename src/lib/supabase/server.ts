import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { COOKIE_EMPLEADO, COOKIE_NEGOCIO, HORAS_PIN } from "@/lib/catalogo";
import type { EmpleadoActual, Negocio } from "@/lib/tipos";

/** Cliente de Supabase para Server Components y Server Actions */
export async function supabaseServidor() {
  const almacen = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(aEstablecer) {
        try {
          for (const { name, value, options } of aEstablecer) almacen.set(name, value, options);
        } catch {
          // Se llama desde un Server Component: el proxy ya refresca la sesión.
        }
      },
    },
  });
}

export interface Sesion {
  userId: string;
  email: string | null;
}

/** Usuario actual (null si no hay sesión) */
export async function sesionActual(): Promise<Sesion | null> {
  const supabase = await supabaseServidor();
  const { data: claims } = await supabase.auth.getClaims();
  const sub = claims?.claims?.sub as string | undefined;
  if (!sub) return null;
  return { userId: sub, email: (claims?.claims?.email as string | undefined) ?? null };
}

/** Negocios del usuario (dueño) */
export async function misNegociosServidor(): Promise<Negocio[]> {
  const supabase = await supabaseServidor();
  const { data } = await supabase.from("negocios").select("*").order("creado_en");
  return (data ?? []) as Negocio[];
}

/**
 * Negocio con el que se está trabajando en este dispositivo.
 * Lee la cookie; si no hay o ya no pertenece al usuario, toma el primero.
 * Devuelve null si el usuario no tiene ningún negocio (→ onboarding).
 */
export async function negocioActual(): Promise<Negocio | null> {
  const negocios = await misNegociosServidor();
  if (negocios.length === 0) return null;
  const almacen = await cookies();
  const elegido = almacen.get(COOKIE_NEGOCIO)?.value;
  return negocios.find((n) => n.id === elegido) ?? negocios[0];
}

/** Empleado identificado con PIN en esta tablet (null si no hay o venció) */
export async function empleadoActual(negocioId: string): Promise<EmpleadoActual | null> {
  const almacen = await cookies();
  const crudo = almacen.get(COOKIE_EMPLEADO)?.value;
  if (!crudo) return null;
  try {
    const e = JSON.parse(crudo) as EmpleadoActual & { negocio_id?: string };
    if (e.negocio_id !== negocioId) return null;
    const horas = (Date.now() - new Date(e.desde).getTime()) / 3_600_000;
    if (!Number.isFinite(horas) || horas > HORAS_PIN) return null;
    return { id: e.id, nombre: e.nombre, es_dueno: e.es_dueno, desde: e.desde };
  } catch {
    return null;
  }
}

export async function esSuperadmin(): Promise<boolean> {
  const supabase = await supabaseServidor();
  const { data } = await supabase.rpc("es_superadmin");
  return data === true;
}
