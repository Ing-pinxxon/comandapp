import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServidor } from "@/lib/supabase/server";

// Destino del enlace de confirmación de correo, de recuperación y del regreso de Google.
// Convierte el código en sesión y redirige a donde tocaba.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const volver = seguro(searchParams.get("volver"));
  const supabase = await supabaseServidor();

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${volver}`);
  }

  // Enlaces de correo en formato token_hash (confirmación, recuperación)
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && tipo) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo });
    if (!error) return NextResponse.redirect(`${origin}${tipo === "recovery" ? "/auth/cambiar-clave" : volver}`);
  }

  return NextResponse.redirect(`${origin}/login?error=enlace`);
}

/** Solo rutas internas: evita redirigir a otro sitio */
function seguro(ruta: string | null): string {
  if (!ruta || !ruta.startsWith("/") || ruta.startsWith("//")) return "/comandas";
  return ruta;
}
