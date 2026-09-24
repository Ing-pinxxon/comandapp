import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rutas que se pueden ver sin sesión
const PUBLICAS = new Set(["/", "/demo", "/privacidad", "/terminos", "/registro", "/login", "/recuperar", "/auth/callback", "/auth/cambiar-clave"]);

// Archivos que piden los buscadores y el navegador. Nunca llevan sesión: si se
// redirigen al login, Google no puede leer el robots.txt ni el sitemap.
const ARCHIVOS_PUBLICOS = ["/robots.txt", "/sitemap.xml", "/manifest.webmanifest", "/icon", "/apple-icon", "/opengraph-image"];

// Refresca la sesión de Supabase en cada petición y protege las rutas.
// Chequeo optimista (solo cookie/JWT). Negocio, empleado y superadmin se validan en los layouts.
export async function proxy(request: NextRequest) {
  if (ARCHIVOS_PUBLICOS.some((a) => request.nextUrl.pathname.startsWith(a))) return NextResponse.next({ request });

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
  if (ruta.startsWith("/api/")) return respuesta; // las rutas API validan la sesión por su cuenta

  if (!autenticado && !PUBLICAS.has(ruta)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("volver", ruta);
    return NextResponse.redirect(url);
  }
  // Quien ya tiene sesión no ve la portada ni el registro: va directo a su cola.
  // (La portada queda así como página estática, que es lo que Google indexa mejor.)
  if (autenticado && (ruta === "/" || ruta === "/login" || ruta === "/registro")) {
    const url = request.nextUrl.clone();
    url.pathname = "/comandas";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return respuesta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
