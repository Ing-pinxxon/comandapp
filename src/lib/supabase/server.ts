import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Rol } from "@/lib/tipos";

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
  rol: Rol;
}

/** Usuario actual y su rol (null si no hay sesión) */
export async function sesionActual(): Promise<Sesion | null> {
  const supabase = await supabaseServidor();
  const { data: claims } = await supabase.auth.getClaims();
  const sub = claims?.claims?.sub as string | undefined;
  if (!sub) return null;
  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("user_id", sub).maybeSingle();
  return {
    userId: sub,
    email: (claims?.claims?.email as string | undefined) ?? null,
    rol: (perfil?.rol as Rol | undefined) ?? "personal",
  };
}
