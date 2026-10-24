import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServidor } from "@/lib/supabase/server";
import { rutaInterna } from "@/lib/sitio";

// Destino del enlace de confirmación de correo, de recuperación y del regreso de Google.
// Convierte el código en sesión y redirige a donde tocaba.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const volver = rutaInterna(searchParams.get("volver"));
  const supabase = await supabaseServidor();

  // Google o Supabase devolvieron un error en vez de un código (p. ej. se canceló en Google)
  if (searchParams.has("error_description")) {
    console.error("auth/callback:", searchParams.get("error_code") ?? searchParams.get("error"), searchParams.get("error_description"));
    return NextResponse.redirect(`${origin}/login?error=${searchParams.get("error_code") === "otp_expired" ? "enlace" : "acceso"}`);
  }

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${volver}`);
    console.error("auth/callback: no se pudo canjear el código:", error.code, error.message);
    // Falta la llave que guardó el navegador al empezar: se empezó en otro navegador o en otra dirección
    if (error.code === "pkce_code_verifier_not_found") return NextResponse.redirect(`${origin}/login?error=navegador`);
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
