import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refresca la sesión de Supabase en cada petición y protege las rutas.
// Chequeo optimista (solo cookie/JWT). El rol admin se valida en app/admin/layout.tsx.
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(aEstablecer) {
        for (const { name, value } of aEstablecer) request.cookies.set(name, value);
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of aEstablecer) respuesta.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const autenticado = Boolean(data?.claims?.sub);
  const ruta = request.nextUrl.pathname;

  // Vista previa con datos de ejemplo, solo en desarrollo (npm run dev)
  if (ruta.startsWith("/vista-previa") && process.env.NODE_ENV === "development") return respuesta;

  if (!autenticado && ruta !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (autenticado && (ruta === "/login" || ruta === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/comandas";
    return NextResponse.redirect(url);
  }
  return respuesta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
