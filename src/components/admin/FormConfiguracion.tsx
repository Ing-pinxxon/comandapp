"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Save, SlidersHorizontal } from "lucide-react";
import { supabaseNavegador } from "@/lib/supabase/client";
import { cargarCatalogo, mensajeError } from "@/lib/datos";
import type { Configuracion } from "@/lib/tipos";
import { Aviso } from "@/components/ui/Aviso";
import { useNegocio } from "@/components/NegocioProvider";

export function FormConfiguracion() {
  const { negocio } = useNegocio();
  const [cfg, setCfg] = useState<Configuracion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarCatalogo(negocio.id).then((c) => setCfg(c.config)).catch((e) => setError(mensajeError(e)));
  }, [negocio.id]);

  async function guardar() {
    if (!cfg) return;
    if (cfg.umbrales_min.verde <= 0 || cfg.umbrales_min.amarillo <= cfg.umbrales_min.verde) {
      setError("El límite amarillo debe ser mayor que el verde, y ambos mayores que 0.");
      return;
    }
    setGuardando(true);
    setError(null);
    const filas = [
      { clave: "umbrales_min", valor: cfg.umbrales_min },
      { clave: "extra_combo", valor: cfg.extra_combo },
      { clave: "mensajes_whatsapp", valor: cfg.mensajes_whatsapp },
    ].map((f) => ({ ...f, negocio_id: negocio.id, actualizado_en: new Date().toISOString() }));
    const { error } = await supabaseNavegador().from("configuracion").upsert(filas, { onConflict: "negocio_id,clave" });
    setGuardando(false);
    if (error) {
      setError(mensajeError(error));
      return;
    }
    setOk(true);
    setTimeout(() => setOk(false), 2500);
  }

  if (!cfg) return <p className="text-texto-suave">{error ?? "Cargando…"}</p>;

  const num = (v: string) => Number(v.replace(/\D/g, "")) || 0;

  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-black">Configuración</h1>
      {error && <Aviso tipo="error">{error}</Aviso>}
      {ok && <Aviso tipo="ok">Configuración guardada. Las tablets la toman al instante.</Aviso>}

      <section className="tarjeta space-y-3 p-4">
        <h2 className="text-lg font-extrabold">Semáforo de la cola (minutos)</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm"><span className="size-3 rounded-full bg-semaforo-verde" /> Verde hasta</span>
            <input className="campo" inputMode="numeric" value={cfg.umbrales_min.verde} onChange={(e) => setCfg({ ...cfg, umbrales_min: { ...cfg.umbrales_min, verde: num(e.target.value) } })} />
          </label>
          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-sm"><span className="size-3 rounded-full bg-semaforo-amarillo" /> Amarillo hasta</span>
            <input className="campo" inputMode="numeric" value={cfg.umbrales_min.amarillo} onChange={(e) => setCfg({ ...cfg, umbrales_min: { ...cfg.umbrales_min, amarillo: num(e.target.value) } })} />
          </label>
          <div className="flex items-end pb-3 text-sm text-texto-suave">
            <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-semaforo-naranja" /> Naranja después de {cfg.umbrales_min.amarillo} min</span>
          </div>
        </div>
      </section>

      <section className="tarjeta space-y-3 p-4">
        <h2 className="text-lg font-extrabold">Combos y cargos</h2>
        <label className="block sm:max-w-xs">
          <span className="mb-1 block text-sm text-texto-suave">Extra por combo ($)</span>
          <input className="campo" inputMode="numeric" value={cfg.extra_combo} onChange={(e) => setCfg({ ...cfg, extra_combo: num(e.target.value) })} />
        </label>
        <p className="text-sm text-texto-suave">
          Se suma al precio cuando un producto de una categoría con combo se pide en combo y no tiene precio de combo propio.
          Lo que incluye el combo se escribe en <Link href="/admin/negocio" className="underline">Mi negocio</Link>.
        </p>
        <p className="text-sm text-texto-suave">
          Domicilio, empaques, propinas y otros recargos se definen en{" "}
          <Link href="/admin/cargos" className="inline-flex items-center gap-1 font-bold underline">
            <SlidersHorizontal className="size-4" /> Cargos
          </Link>
          . No se aplican descuentos.
        </p>
      </section>

      <section className="tarjeta space-y-3 p-4">
        <h2 className="text-lg font-extrabold">Mensajes de WhatsApp al cliente</h2>
        <p className="text-sm text-texto-suave">Puedes usar <code>{"{nombre}"}</code>, <code>{"{numero}"}</code> y <code>{"{total}"}</code>.</p>
        <label className="block"><span className="mb-1 block text-sm text-texto-suave">Pedido listo</span><textarea className="campo" rows={2} value={cfg.mensajes_whatsapp.listo} onChange={(e) => setCfg({ ...cfg, mensajes_whatsapp: { ...cfg.mensajes_whatsapp, listo: e.target.value } })} /></label>
        <label className="block"><span className="mb-1 block text-sm text-texto-suave">Pedido en camino</span><textarea className="campo" rows={2} value={cfg.mensajes_whatsapp.en_camino} onChange={(e) => setCfg({ ...cfg, mensajes_whatsapp: { ...cfg.mensajes_whatsapp, en_camino: e.target.value } })} /></label>
      </section>

      <button type="button" onClick={() => void guardar()} disabled={guardando} className="btn bg-ok px-6 text-lg text-white">
        <Save className="size-5" /> {guardando ? "Guardando…" : "Guardar configuración"}
      </button>
    </div>
  );
}
