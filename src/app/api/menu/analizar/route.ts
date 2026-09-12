import { NextResponse } from "next/server";
import { GoogleGenAI, createPartFromBase64, createUserContent } from "@google/genai";
import { supabaseServidor } from "@/lib/supabase/server";
import { ESQUEMA_JSON_MENU, INSTRUCCION_MENU, normalizarMenu, unirMenus } from "@/lib/menu-ia";
import type { MenuImportado } from "@/lib/tipos";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_IMAGENES = 6;
const MAX_BYTES = 8 * 1024 * 1024;
const TIPOS = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

/**
 * POST multipart: negocio_id + imagenes[] → lee la carta con Gemini y
 * devuelve { importacion_id, menu } para que el dueño lo revise.
 * Nada se guarda en el menú hasta que confirme (importar_menu).
 */
export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "Falta configurar GEMINI_API_KEY en el servidor." }, { status: 500 });
  }

  const sb = await supabaseServidor();
  const { data: claims } = await sb.auth.getClaims();
  if (!claims?.claims?.sub) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  const form = await request.formData();
  const negocioId = String(form.get("negocio_id") ?? "");
  const archivos = form.getAll("imagenes").filter((f): f is File => f instanceof File);

  if (!negocioId) return NextResponse.json({ error: "Falta el negocio." }, { status: 400 });
  if (archivos.length === 0) return NextResponse.json({ error: "Sube al menos una foto." }, { status: 400 });
  if (archivos.length > MAX_IMAGENES) return NextResponse.json({ error: `Máximo ${MAX_IMAGENES} fotos por vez.` }, { status: 400 });
  for (const a of archivos) {
    if (!TIPOS.has(a.type)) return NextResponse.json({ error: `Formato no admitido: ${a.name}. Usa JPG, PNG o WebP.` }, { status: 400 });
    if (a.size > MAX_BYTES) return NextResponse.json({ error: `${a.name} pesa más de 8 MB.` }, { status: 400 });
  }

  const { data: esMiembro } = await sb.rpc("es_miembro", { p_negocio: negocioId });
  if (esMiembro !== true) return NextResponse.json({ error: "No tienes acceso a este negocio." }, { status: 403 });

  // Registro de la importación (para trazabilidad y para reintentar)
  const { data: imp, error: errImp } = await sb
    .from("importaciones_menu")
    .insert({ negocio_id: negocioId, creado_por: claims.claims.sub as string })
    .select("id")
    .single();
  if (errImp || !imp) return NextResponse.json({ error: errImp?.message ?? "No se pudo registrar la importación." }, { status: 500 });
  const importacionId = imp.id as string;

  try {
    // Guardar las fotos (privadas, por negocio) y preparar las partes para la IA
    const rutas: string[] = [];
    const partes: ReturnType<typeof createPartFromBase64>[] = [];
    for (const [i, a] of archivos.entries()) {
      const bytes = Buffer.from(await a.arrayBuffer());
      const ext = a.type === "image/png" ? "png" : a.type === "image/webp" ? "webp" : "jpg";
      const ruta = `${negocioId}/${importacionId}/${i + 1}.${ext}`;
      const { error: errUp } = await sb.storage.from("menus").upload(ruta, bytes, { contentType: a.type, upsert: true });
      if (errUp) throw new Error(`No se pudo guardar la foto: ${errUp.message}`);
      rutas.push(ruta);
      partes.push(createPartFromBase64(bytes.toString("base64"), a.type));
    }
    await sb.from("importaciones_menu").update({ rutas_imagenes: rutas }).eq("id", importacionId);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const respuesta = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL_MENU || "gemini-2.5-flash",
      contents: createUserContent([...partes, "Transcribe esta carta al JSON indicado."]),
      config: {
        systemInstruction: INSTRUCCION_MENU,
        responseMimeType: "application/json",
        responseJsonSchema: ESQUEMA_JSON_MENU,
        temperature: 0.1,
      },
    });

    const texto = respuesta.text;
    if (!texto) throw new Error("La IA no devolvió nada. Intenta con una foto más nítida.");
    const crudo = JSON.parse(texto);
    const menu: MenuImportado = unirMenus([normalizarMenu(crudo)]);
    if (menu.categorias.length === 0) throw new Error("No se encontraron productos en la foto. ¿Es una carta de comida? Prueba con más luz o más cerca.");

    await sb.from("importaciones_menu").update({ estado: "listo", resultado: menu }).eq("id", importacionId);
    return NextResponse.json({ importacion_id: importacionId, menu });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error leyendo el menú";
    await sb.from("importaciones_menu").update({ estado: "error", error: mensaje }).eq("id", importacionId);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
