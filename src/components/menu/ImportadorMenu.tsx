"use client";

import { useRef, useState } from "react";
import { Camera, Check, ImagePlus, Loader2, Plus, ScanText, Trash2, X } from "lucide-react";
import type { MenuImportado } from "@/lib/tipos";
import { importarMenu, mensajeError } from "@/lib/datos";
import { emojiCategoria, preciosFaltantes } from "@/lib/menu-ia";

import { Aviso } from "@/components/ui/Aviso";

interface Props {
  negocioId: string;
  onListo?: (resultado: { nuevos: number; actualizados: number }) => void;
}

type Fase = "elegir" | "leyendo" | "revisar" | "importando" | "hecho";

/** Sube fotos de la carta, las lee con IA, deja revisar y guarda en el menú */
export function ImportadorMenu({ negocioId, onListo }: Props) {
  const [fase, setFase] = useState<Fase>("elegir");
  const [archivos, setArchivos] = useState<File[]>([]);
  const [vistas, setVistas] = useState<string[]>([]);
  const [menu, setMenu] = useState<MenuImportado | null>(null);
  const [importacionId, setImportacionId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ nuevos: number; actualizados: number } | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  function agregarArchivos(lista: FileList | null) {
    if (!lista) return;
    const nuevos = Array.from(lista).slice(0, 6 - archivos.length);
    setArchivos((a) => [...a, ...nuevos]);
    setVistas((v) => [...v, ...nuevos.map((f) => URL.createObjectURL(f))]);
    setError(null);
  }

  function quitarArchivo(i: number) {
    setArchivos((a) => a.filter((_, k) => k !== i));
    setVistas((v) => v.filter((_, k) => k !== i));
  }

  async function leer() {
    setFase("leyendo");
    setError(null);
    try {
      const fd = new FormData();
      fd.set("negocio_id", negocioId);
      for (const a of archivos) fd.append("imagenes", a);
      const r = await fetch("/api/menu/analizar", { method: "POST", body: fd });
      const cuerpo = (await r.json()) as { error?: string; importacion_id?: string; menu?: MenuImportado };
      if (!r.ok || !cuerpo.menu) throw new Error(cuerpo.error ?? "No se pudo leer el menú.");
      setMenu(cuerpo.menu);
      setImportacionId(cuerpo.importacion_id);
      setFase("revisar");
    } catch (e) {
      setError(mensajeError(e));
      setFase("elegir");
    }
  }

  async function confirmar() {
    if (!menu) return;
    setFase("importando");
    setError(null);
    try {
      const res = await importarMenu(negocioId, menu, importacionId);
      setResultado(res);
      setFase("hecho");
      onListo?.(res);
    } catch (e) {
      setError(mensajeError(e));
      setFase("revisar");
    }
  }

  const faltantes = menu ? preciosFaltantes(menu) : 0;
  const totalProductos = menu ? menu.categorias.reduce((s, c) => s + c.productos.length, 0) : 0;

  if (fase === "hecho" && resultado) {
    return (
      <Aviso tipo="ok">
        Menú guardado: {resultado.nuevos} productos nuevos y {resultado.actualizados} actualizados. Ya aparecen en la pantalla de pedidos.
      </Aviso>
    );
  }

  if (fase === "revisar" || fase === "importando") {
    return (
      <div className="space-y-4">
        {error && <Aviso tipo="error">{error}</Aviso>}
        <Aviso tipo="info">
          Revisa lo que leyó la IA: corrige nombres o precios, borra lo que sobre y agrega lo que falte. Nada se guarda hasta que toques <b>Guardar en el menú</b>.
          {faltantes > 0 && <> Hay <b className="text-peligro">{faltantes}</b> productos sin precio: complétalos o bórralos.</>}
        </Aviso>

        {menu!.categorias.map((cat, ci) => (
          <section key={ci} className="tarjeta p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input
                className="campo min-h-10 w-auto flex-1 text-lg font-extrabold"
                value={cat.nombre}
                onChange={(e) => editarCategoria(ci, { nombre: e.target.value, emoji: emojiCategoria(e.target.value) })}
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-5" checked={Boolean(cat.permite_combo)} onChange={(e) => editarCategoria(ci, { permite_combo: e.target.checked })} />
                Se puede pedir en combo
              </label>
              <button type="button" onClick={() => setMenu({ categorias: menu!.categorias.filter((_, k) => k !== ci) })} className="btn min-h-10 bg-panel-2 px-3 text-peligro" title="Quitar categoría">
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="space-y-2">
              {cat.productos.map((p, pi) => (
                <div key={pi} className="grid grid-cols-[1fr_7rem_auto] gap-2 sm:grid-cols-[1fr_7rem_1fr_auto]">
                  <input className="campo min-h-10" value={p.nombre} onChange={(e) => editarProducto(ci, pi, { nombre: e.target.value })} placeholder="Nombre" />
                  <input
                    className={`campo min-h-10 text-right tabular-nums ${p.precio === null ? "border-peligro" : ""}`}
                    inputMode="numeric"
                    value={p.precio ?? ""}
                    onChange={(e) => editarProducto(ci, pi, { precio: e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null })}
                    placeholder="Precio"
                  />
                  <input
                    className="campo col-span-2 min-h-10 text-sm sm:col-span-1"
                    value={(p.ingredientes ?? []).join(", ")}
                    onChange={(e) => editarProducto(ci, pi, { ingredientes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                    placeholder="Ingredientes que se pueden quitar (coma)"
                  />
                  <button type="button" onClick={() => editarCategoria(ci, { productos: cat.productos.filter((_, k) => k !== pi) })} className="btn min-h-10 bg-panel-2 px-3 text-peligro" title="Quitar producto">
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => editarCategoria(ci, { productos: [...cat.productos, { nombre: "", precio: null, ingredientes: [] }] })} className="btn min-h-10 bg-panel-2 text-sm">
                <Plus className="size-4" /> Agregar producto
              </button>
            </div>
          </section>
        ))}

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setMenu({ categorias: [...menu!.categorias, { nombre: "Nueva categoría", emoji: "🍽️", permite_combo: false, productos: [] }] })} className="btn bg-panel-2">
            <Plus className="size-5" /> Nueva categoría
          </button>
          <button type="button" onClick={() => { setFase("elegir"); setMenu(null); }} className="btn bg-panel-2 text-texto-suave">Volver a las fotos</button>
          <button type="button" onClick={() => void confirmar()} disabled={fase === "importando" || faltantes > 0 || totalProductos === 0} className="btn ml-auto bg-ok text-white">
            {fase === "importando" ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />} Guardar en el menú ({totalProductos})
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Aviso tipo="error">{error}</Aviso>}
      <input ref={entrada} type="file" accept="image/*" multiple className="hidden" onChange={(e) => agregarArchivos(e.target.files)} />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {vistas.map((v, i) => (
          <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-xl border border-borde bg-panel-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v} alt={`Foto ${i + 1}`} className="size-full object-cover" />
            <button type="button" onClick={() => quitarArchivo(i)} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white" aria-label="Quitar foto">
              <X className="size-4" />
            </button>
          </div>
        ))}
        {archivos.length < 6 && (
          <button type="button" onClick={() => entrada.current?.click()} className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-borde bg-panel-2 text-texto-suave">
            {archivos.length === 0 ? <Camera className="size-8" /> : <ImagePlus className="size-8" />}
            <span className="text-sm font-bold">{archivos.length === 0 ? "Tomar foto o subir" : "Otra página"}</span>
          </button>
        )}
      </div>
      <p className="text-sm text-texto-suave">Hasta 6 fotos (una por página de la carta). Funciona mejor con buena luz y la carta completa en el encuadre.</p>
      <button type="button" onClick={() => void leer()} disabled={archivos.length === 0 || fase === "leyendo"} className="btn bg-marca text-lg text-black">
        {fase === "leyendo" ? <Loader2 className="size-5 animate-spin" /> : <ScanText className="size-5" />}
        {fase === "leyendo" ? "Leyendo la carta…" : "Leer el menú con IA"}
      </button>
    </div>
  );

  function editarCategoria(ci: number, cambios: Partial<MenuImportado["categorias"][number]>) {
    setMenu((m) => (m ? { categorias: m.categorias.map((c, k) => (k === ci ? { ...c, ...cambios } : c)) } : m));
  }
  function editarProducto(ci: number, pi: number, cambios: Partial<MenuImportado["categorias"][number]["productos"][number]>) {
    setMenu((m) =>
      m ? { categorias: m.categorias.map((c, k) => (k === ci ? { ...c, productos: c.productos.map((p, j) => (j === pi ? { ...p, ...cambios } : p)) } : c)) } : m,
    );
  }
}

