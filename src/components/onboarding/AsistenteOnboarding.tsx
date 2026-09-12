"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check, ImagePlus, Store, UserPlus } from "lucide-react";
import { supabaseNavegador } from "@/lib/supabase/client";
import { actualizarNegocio, crearEmpleado, mensajeError, subirLogo } from "@/lib/datos";
import { elegirNegocio } from "@/app/acciones";
import { Aviso } from "@/components/ui/Aviso";
import { Logotipo } from "@/components/ui/Logotipo";
import { ImportadorMenu } from "@/components/menu/ImportadorMenu";

type Paso = 1 | 2 | 3;

export function AsistenteOnboarding({ yaTieneNegocios }: { yaTieneNegocios: boolean }) {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>(1);
  const [negocioId, setNegocioId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // Paso 1
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [combo, setCombo] = useState("");
  const [pin, setPin] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoVista, setLogoVista] = useState<string | null>(null);

  // Paso 3
  const [empleados, setEmpleados] = useState<{ nombre: string; pin: string }[]>([]);
  const [empNombre, setEmpNombre] = useState("");
  const [empPin, setEmpPin] = useState("");

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{4,6}$/.test(pin)) {
      setError("El PIN debe tener entre 4 y 6 dígitos.");
      return;
    }
    setCargando(true);
    try {
      const sb = supabaseNavegador();
      const { data, error } = await sb.rpc("crear_negocio", {
        p_nombre: nombre.trim(),
        p_slug: nombre.trim(),
        p_telefono: telefono.replace(/\D/g, ""),
        p_pin: pin,
        p_combo_descripcion: combo.trim() || null,
      });
      if (error) throw error;
      const id = String(data);
      setNegocioId(id);
      await elegirNegocio(id);
      if (logo) {
        const url = await subirLogo(id, logo);
        await actualizarNegocio(id, { logo_url: url });
      }
      setPaso(2);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  async function agregarEmpleado(e: React.FormEvent) {
    e.preventDefault();
    if (!negocioId) return;
    if (!/^\d{4,6}$/.test(empPin)) {
      setError("El PIN debe tener entre 4 y 6 dígitos.");
      return;
    }
    setError(null);
    setCargando(true);
    try {
      await crearEmpleado(negocioId, empNombre, empPin, false);
      setEmpleados((l) => [...l, { nombre: empNombre.trim(), pin: empPin }]);
      setEmpNombre("");
      setEmpPin("");
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  function terminar() {
    router.replace("/quien");
    router.refresh();
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <Logotipo />
        {yaTieneNegocios && (
          <Link href="/quien" className="text-sm text-texto-suave underline">Cancelar</Link>
        )}
      </div>

      {/* Progreso */}
      <ol className="mb-6 grid grid-cols-3 gap-2 text-sm">
        {[
          [1, "Tu negocio"],
          [2, "Tu menú"],
          [3, "Tu equipo"],
        ].map(([n, t]) => (
          <li key={n} className={`rounded-xl px-3 py-2 text-center font-bold ${paso === n ? "bg-marca text-black" : paso > (n as number) ? "bg-ok/20 text-ok" : "bg-panel-2 text-texto-suave"}`}>
            {paso > (n as number) ? <Check className="mr-1 inline size-4" /> : `${n}. `}{t}
          </li>
        ))}
      </ol>

      {error && <Aviso tipo="error" className="mb-4">{error}</Aviso>}

      {paso === 1 && (
        <form onSubmit={(e) => void crear(e)} className="tarjeta space-y-4 p-6">
          <div>
            <h1 className="text-2xl font-black">Cuéntanos de tu negocio</h1>
            <p className="text-texto-suave">Esto es lo que verán tus clientes en los mensajes y tu equipo en la tablet.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
            <label className="flex cursor-pointer flex-col items-center gap-2">
              <span className="flex size-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-borde bg-panel-2 text-texto-suave">
                {logoVista ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoVista} alt="" className="size-full object-cover" />
                ) : (
                  <ImagePlus className="size-8" />
                )}
              </span>
              <span className="text-xs text-texto-suave">Logo (opcional)</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setLogo(f);
                  setLogoVista(f ? URL.createObjectURL(f) : null);
                }}
              />
            </label>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm text-texto-suave">Nombre del negocio *</span>
                <input className="campo text-lg" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej: Burger House" autoFocus />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-texto-suave">WhatsApp del negocio</span>
                <input className="campo" type="tel" inputMode="numeric" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="300 123 4567" />
              </label>
            </div>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">¿Qué incluye un combo? (opcional)</span>
            <input className="campo" value={combo} onChange={(e) => setCombo(e.target.value)} placeholder="Ej: papas + gaseosa" />
          </label>
          <label className="block sm:max-w-xs">
            <span className="mb-1 block text-sm text-texto-suave">Tu PIN de dueño (4 a 6 dígitos) *</span>
            <input className="campo text-center text-2xl tracking-[0.5em]" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} required placeholder="••••" />
            <span className="mt-1 block text-xs text-texto-suave">Con este PIN entras al panel desde la tablet. Los empleados tendrán el suyo.</span>
          </label>
          <button type="submit" disabled={cargando || !nombre.trim() || pin.length < 4} className="btn w-full bg-marca text-lg text-black sm:w-auto sm:px-8">
            <Store className="size-5" /> {cargando ? "Creando…" : "Crear negocio"} <ArrowRight className="size-5" />
          </button>
        </form>
      )}

      {paso === 2 && negocioId && (
        <div className="tarjeta space-y-4 p-6">
          <div>
            <h1 className="text-2xl font-black">Sube una foto de tu carta</h1>
            <p className="text-texto-suave">La IA lee los productos y precios. Después los revisas antes de guardarlos. Puedes hacerlo luego desde el panel.</p>
          </div>
          <ImportadorMenu negocioId={negocioId} onListo={() => setPaso(3)} />
          <button type="button" onClick={() => setPaso(3)} className="btn bg-panel-2 text-texto-suave">Saltar por ahora <ArrowRight className="size-4" /></button>
        </div>
      )}

      {paso === 3 && negocioId && (
        <div className="tarjeta space-y-4 p-6">
          <div>
            <h1 className="text-2xl font-black">Tu equipo</h1>
            <p className="text-texto-suave">Cada persona que tome pedidos tiene su nombre y su PIN. Así sabes quién tomó cada uno.</p>
          </div>
          {empleados.length > 0 && (
            <ul className="space-y-1 text-sm">
              {empleados.map((e) => (
                <li key={e.nombre} className="flex items-center gap-2 rounded-lg bg-panel-2 px-3 py-2"><Check className="size-4 text-ok" /> {e.nombre}</li>
              ))}
            </ul>
          )}
          <form onSubmit={(e) => void agregarEmpleado(e)} className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input className="campo" value={empNombre} onChange={(e) => setEmpNombre(e.target.value)} placeholder="Nombre del empleado" required />
            <input className="campo w-full text-center tracking-[0.3em] sm:w-36" inputMode="numeric" value={empPin} onChange={(e) => setEmpPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="PIN" required />
            <button type="submit" disabled={cargando || !empNombre.trim() || empPin.length < 4} className="btn bg-panel-2"><UserPlus className="size-5" /> Agregar</button>
          </form>
          <button type="button" onClick={terminar} className="btn w-full bg-marca text-lg text-black sm:w-auto sm:px-8">
            <Check className="size-5" /> {empleados.length > 0 ? "Listo, ir a la tablet" : "Continuar sin empleados"}
          </button>
        </div>
      )}
    </div>
  );
}
