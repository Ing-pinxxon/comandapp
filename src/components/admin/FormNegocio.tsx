"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, ImagePlus, RefreshCw, Save } from "lucide-react";
import { iniciales } from "@/lib/tipos";
import { actualizarNegocio, mensajeError, regenerarClaveIntegracion, subirLogo } from "@/lib/datos";
import { Aviso } from "@/components/ui/Aviso";
import { useNegocio } from "@/components/NegocioProvider";

export function FormNegocio() {
  const router = useRouter();
  const { negocio } = useNegocio();
  const [nombre, setNombre] = useState(negocio.nombre);
  const [telefono, setTelefono] = useState(negocio.telefono_whatsapp ?? "");
  const [combo, setCombo] = useState(negocio.combo_descripcion);
  const [logoUrl, setLogoUrl] = useState(negocio.logo_url);
  const [clave, setClave] = useState(negocio.clave_integracion);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function avisar(msg: string) {
    setOk(msg);
    setError(null);
    setTimeout(() => setOk(null), 2500);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    try {
      await actualizarNegocio(negocio.id, { nombre: nombre.trim(), telefono_whatsapp: telefono.replace(/\D/g, "") || null, combo_descripcion: combo.trim() || "incluye papas + gaseosa" });
      avisar("Datos guardados");
      router.refresh();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarLogo(archivo: File | null) {
    if (!archivo) return;
    setGuardando(true);
    try {
      const url = await subirLogo(negocio.id, archivo);
      await actualizarNegocio(negocio.id, { logo_url: url });
      setLogoUrl(url);
      avisar("Logo actualizado");
      router.refresh();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function regenerar() {
    if (!confirm("Si regeneras la clave, el bot que la esté usando dejará de poder enviar pedidos hasta que le pongas la nueva. ¿Continuar?")) return;
    try {
      setClave(await regenerarClaveIntegracion(negocio.id));
      avisar("Clave nueva generada");
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-black">Mi negocio</h1>
      {error && <Aviso tipo="error">{error}</Aviso>}
      {ok && <Aviso tipo="ok">{ok}</Aviso>}

      <form onSubmit={(e) => void guardar(e)} className="tarjeta space-y-4 p-5">
        <div className="flex items-center gap-4">
          <label className="cursor-pointer">
            <span className="flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-borde bg-panel-2">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="text-xl font-black text-marca-oscuro">{iniciales(nombre)}</span>
              )}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => void cambiarLogo(e.target.files?.[0] ?? null)} />
          </label>
          <div className="text-sm text-texto-suave">
            <div className="flex items-center gap-1 font-bold text-texto"><ImagePlus className="size-4" /> Logo</div>
            Toca la imagen para cambiarla. Se ve en la tablet y en el panel.
          </div>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm text-texto-suave">Nombre *</span>
          <input className="campo text-lg" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-texto-suave">WhatsApp del negocio</span>
          <input className="campo" type="tel" inputMode="numeric" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="300 123 4567" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-texto-suave">Qué incluye un combo</span>
          <input className="campo" value={combo} onChange={(e) => setCombo(e.target.value)} placeholder="incluye papas + gaseosa" />
        </label>
        <p className="text-xs text-texto-suave">Dirección web del negocio: <code>{negocio.slug}</code></p>
        <button type="submit" disabled={guardando || !nombre.trim()} className="btn bg-ok text-white"><Save className="size-5" /> Guardar</button>
      </form>

      <section className="tarjeta space-y-3 p-5">
        <h2 className="text-lg font-extrabold">Clave de integración</h2>
        <p className="text-sm text-texto-suave">
          Con esta clave un bot de WhatsApp u otro sistema puede enviar pedidos a tu cola. Trátala como una contraseña.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 rounded-xl bg-panel-2 px-3 py-2 text-sm break-all">{clave}</code>
          <button type="button" onClick={() => { void navigator.clipboard.writeText(clave); avisar("Clave copiada"); }} className="btn min-h-10 bg-panel-2 px-3"><Copy className="size-4" /> Copiar</button>
          <button type="button" onClick={() => void regenerar()} className="btn min-h-10 bg-panel-2 px-3 text-peligro"><RefreshCw className="size-4" /> Regenerar</button>
        </div>
      </section>
    </div>
  );
}
