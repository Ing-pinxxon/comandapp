"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Crown, LogOut, Store, UserPlus } from "lucide-react";
import { iniciales, type Empleado, type Negocio } from "@/lib/tipos";
import { cerrarSesion, crearEmpleado, mensajeError, verificarPin } from "@/lib/datos";
import { elegirNegocio, guardarEmpleadoActual } from "@/app/acciones";
import { TecladoNumerico } from "@/components/ui/TecladoNumerico";
import { Aviso } from "@/components/ui/Aviso";
import { Logotipo } from "@/components/ui/Logotipo";

interface Props {
  negocio: Negocio;
  negocios: Negocio[];
  empleados: Empleado[];
  volver: string;
}

const LARGO_MAX = 6;

/** Pantalla de la tablet: cada empleado toca su nombre y escribe su PIN */
export function ElegirEmpleado({ negocio, negocios, empleados, volver }: Props) {
  const router = useRouter();
  const [elegido, setElegido] = useState<Empleado | null>(empleados.length === 1 ? empleados[0] : null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const [primerNombre, setPrimerNombre] = useState("Dueño");
  const [primerPin, setPrimerPin] = useState("");

  /** Negocio sin equipo (por ejemplo, migrado): el dueño crea su propio PIN aquí mismo */
  async function crearPrimero() {
    setVerificando(true);
    setError(null);
    try {
      const id = await crearEmpleado(negocio.id, primerNombre, primerPin, true);
      await guardarEmpleadoActual(negocio.id, { id, nombre: primerNombre.trim(), es_dueno: true });
      router.replace(volver);
      router.refresh();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setVerificando(false);
    }
  }

  async function comprobar(valor: string) {
    if (!elegido) return;
    setVerificando(true);
    setError(null);
    try {
      const emp = await verificarPin(negocio.id, elegido.id, valor);
      if (!emp) {
        setError("PIN incorrecto.");
        setPin("");
        return;
      }
      await guardarEmpleadoActual(negocio.id, emp);
      router.replace(volver);
      router.refresh();
    } catch (e) {
      setError(mensajeError(e));
      setPin("");
    } finally {
      setVerificando(false);
    }
  }

  function cambiarPin(nuevo: string) {
    setPin(nuevo);
    // Con 4 dígitos ya puede ser válido; a los 6 se comprueba solo
    if (nuevo.length === LARGO_MAX) void comprobar(nuevo);
  }

  function cambiarNegocio(id: string) {
    iniciar(async () => {
      await elegirNegocio(id);
      router.refresh();
    });
  }

  return (
    <div className="tarjeta w-full max-w-2xl p-6 sm:p-8">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <Logotipo />
        <div className="flex items-center gap-3">
          {negocio.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={negocio.logo_url} alt="" className="size-12 rounded-xl object-cover" />
          ) : (
            <span className="flex size-12 items-center justify-center rounded-xl bg-marca text-base font-black text-black">{iniciales(negocio.nombre)}</span>
          )}
          <div className="text-left">
            <div className="text-xl font-black">{negocio.nombre}</div>
            {negocios.length > 1 && (
              <select className="campo mt-1 min-h-9 py-1 text-sm" value={negocio.id} onChange={(e) => cambiarNegocio(e.target.value)} disabled={pendiente}>
                {negocios.map((n) => (
                  <option key={n.id} value={n.id}>{n.nombre}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {error && <Aviso tipo="error" className="mb-4">{error}</Aviso>}

      {!elegido ? (
        <>
          <p className="mb-3 text-center text-texto-suave">¿Quién va a usar la tablet?</p>
          {empleados.length === 0 ? (
            <form
              className="mx-auto max-w-sm space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void crearPrimero();
              }}
            >
              <Aviso tipo="info">Todavía no hay nadie en el equipo. Crea tu PIN de dueño para empezar; luego agregas a los demás desde el panel.</Aviso>
              <label className="block">
                <span className="mb-1 block text-sm text-texto-suave">Tu nombre</span>
                <input className="campo" value={primerNombre} onChange={(e) => setPrimerNombre(e.target.value)} required />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-texto-suave">PIN de dueño (4 a 6 dígitos)</span>
                <input className="campo text-center text-2xl tracking-[0.4em]" inputMode="numeric" value={primerPin} onChange={(e) => setPrimerPin(e.target.value.replace(/\D/g, "").slice(0, 6))} required placeholder="••••" autoFocus />
              </label>
              <button type="submit" disabled={verificando || !primerNombre.trim() || primerPin.length < 4} className="btn w-full bg-marca text-lg text-black">
                {verificando ? "Creando…" : "Crear mi PIN y entrar"}
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {empleados.map((e) => (
                <button key={e.id} type="button" onClick={() => { setElegido(e); setPin(""); setError(null); }} className="btn min-h-20 flex-col gap-1 bg-panel-2 text-lg">
                  <span className="flex size-10 items-center justify-center rounded-full bg-marca text-sm font-black text-black">{iniciales(e.nombre)}</span>
                  <span className="flex items-center gap-1">
                    {e.es_dueno && <Crown className="size-4 text-marca-oscuro" />} {e.nombre}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="mx-auto max-w-sm">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => { setElegido(null); setPin(""); setError(null); }} className="btn min-h-10 bg-panel-2 px-3 text-sm" disabled={empleados.length === 1}>
              <ArrowLeft className="size-4" /> Otro usuario
            </button>
            <span className="font-bold">{elegido.nombre}</span>
          </div>
          <div className="mb-4 flex justify-center gap-3" aria-label="PIN">
            {Array.from({ length: LARGO_MAX }).map((_, i) => (
              <span key={i} className={`size-4 rounded-full border-2 ${i < pin.length ? "border-marca bg-marca" : "border-texto-dim"}`} />
            ))}
          </div>
          <TecladoNumerico valor={pin} maximo={LARGO_MAX} onCambio={cambiarPin} deshabilitado={verificando} />
          <button type="button" onClick={() => void comprobar(pin)} disabled={pin.length < 4 || verificando} className="btn mt-4 w-full bg-marca text-lg text-black">
            {verificando ? "Comprobando…" : "Entrar"}
          </button>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
        <Link href="/admin/equipo" className="btn min-h-10 bg-panel-2 px-3 text-texto-suave"><UserPlus className="size-4" /> Administrar equipo</Link>
        <Link href="/onboarding?nuevo=1" className="btn min-h-10 bg-panel-2 px-3 text-texto-suave"><Store className="size-4" /> Otro negocio</Link>
        <button type="button" onClick={async () => { await cerrarSesion(); router.replace("/login"); router.refresh(); }} className="btn min-h-10 bg-panel-2 px-3 text-texto-suave">
          <LogOut className="size-4" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}
