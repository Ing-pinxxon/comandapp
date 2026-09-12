"use client";

import { useCallback, useEffect, useState } from "react";
import { Crown, KeyRound, UserPlus } from "lucide-react";
import { iniciales, type Empleado } from "@/lib/tipos";
import { actualizarEmpleado, cambiarPin, cargarEmpleados, crearEmpleado, mensajeError } from "@/lib/datos";
import { Aviso } from "@/components/ui/Aviso";
import { Modal } from "@/components/ui/Modal";
import { useNegocio } from "@/components/NegocioProvider";

export function GestionEquipo() {
  const { negocio, empleado: actual } = useNegocio();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState<{ nombre: string; pin: string; es_dueno: boolean } | null>(null);
  const [pinDe, setPinDe] = useState<{ empleado: Empleado; pin: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  const recargar = useCallback(async () => {
    try {
      setEmpleados(await cargarEmpleados(negocio.id));
    } catch (e) {
      setError(mensajeError(e));
    }
  }, [negocio.id]);

  useEffect(() => {
    let vigente = true;
    cargarEmpleados(negocio.id)
      .then((lista) => vigente && setEmpleados(lista))
      .catch((e) => vigente && setError(mensajeError(e)));
    return () => {
      vigente = false;
    };
  }, [negocio.id]);

  function avisar(msg: string) {
    setOk(msg);
    setError(null);
    setTimeout(() => setOk(null), 2500);
  }

  const pinValido = (p: string) => /^\d{4,6}$/.test(p);

  async function crear() {
    if (!nuevo || !nuevo.nombre.trim() || !pinValido(nuevo.pin)) return;
    setGuardando(true);
    try {
      await crearEmpleado(negocio.id, nuevo.nombre, nuevo.pin, nuevo.es_dueno);
      setNuevo(null);
      await recargar();
      avisar("Empleado creado");
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  }

  async function guardarPin() {
    if (!pinDe || !pinValido(pinDe.pin)) return;
    setGuardando(true);
    try {
      await cambiarPin(pinDe.empleado.id, pinDe.pin);
      setPinDe(null);
      avisar("PIN actualizado");
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  }

  async function cambiar(e: Empleado, cambios: Partial<Pick<Empleado, "activo" | "es_dueno">>) {
    try {
      await actualizarEmpleado(e.id, cambios);
      await recargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  const duenos = empleados.filter((e) => e.es_dueno && e.activo).length;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Equipo</h1>
          <p className="text-texto-suave">Cada persona entra a la tablet con su PIN. Los dueños además pueden abrir este panel.</p>
        </div>
        <button type="button" onClick={() => setNuevo({ nombre: "", pin: "", es_dueno: false })} className="btn bg-marca text-black"><UserPlus className="size-5" /> Nuevo empleado</button>
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      {ok && <Aviso tipo="ok">{ok}</Aviso>}

      <ul className="space-y-2">
        {empleados.map((e) => (
          <li key={e.id} className={`tarjeta flex flex-wrap items-center gap-3 p-4 ${e.activo ? "" : "opacity-50"}`}>
            <span className="flex size-11 items-center justify-center rounded-full bg-marca text-sm font-black text-black">{iniciales(e.nombre)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-lg font-extrabold">
                {e.nombre}
                {e.es_dueno && <span className="inline-flex items-center gap-1 rounded-md bg-marca/20 px-1.5 text-xs font-bold text-marca-oscuro"><Crown className="size-3" /> Dueño</span>}
                {actual?.id === e.id && <span className="rounded-md bg-panel-2 px-1.5 text-xs text-texto-suave">Tú</span>}
              </div>
              <div className="text-sm text-texto-suave">{e.activo ? "Activo" : "Inactivo"}</div>
            </div>
            <button type="button" onClick={() => setPinDe({ empleado: e, pin: "" })} className="btn min-h-10 bg-panel-2 px-3"><KeyRound className="size-4" /> Cambiar PIN</button>
            <button
              type="button"
              disabled={e.es_dueno && e.activo && duenos <= 1}
              onClick={() => void cambiar(e, { es_dueno: !e.es_dueno })}
              className="btn min-h-10 bg-panel-2 px-3"
              title={e.es_dueno ? "Quitar acceso al panel" : "Dar acceso al panel"}
            >
              {e.es_dueno ? "Quitar dueño" : "Hacer dueño"}
            </button>
            <button
              type="button"
              disabled={e.es_dueno && e.activo && duenos <= 1}
              onClick={() => void cambiar(e, { activo: !e.activo })}
              className={`btn min-h-10 px-3 ${e.activo ? "bg-panel-2 text-peligro" : "bg-ok/20 text-ok"}`}
            >
              {e.activo ? "Desactivar" : "Activar"}
            </button>
          </li>
        ))}
      </ul>

      <Modal abierto={Boolean(nuevo)} titulo="Nuevo empleado" onCerrar={() => setNuevo(null)} ancho="sm">
        {nuevo && (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void crear(); }}>
            <label className="block"><span className="mb-1 block text-sm text-texto-suave">Nombre *</span><input className="campo" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} autoFocus /></label>
            <label className="block"><span className="mb-1 block text-sm text-texto-suave">PIN (4 a 6 dígitos) *</span><input className="campo text-center text-2xl tracking-[0.4em]" inputMode="numeric" value={nuevo.pin} onChange={(e) => setNuevo({ ...nuevo, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })} /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-5" checked={nuevo.es_dueno} onChange={(e) => setNuevo({ ...nuevo, es_dueno: e.target.checked })} /> También puede entrar al panel del dueño</label>
            <button type="submit" disabled={guardando || !nuevo.nombre.trim() || !pinValido(nuevo.pin)} className="btn w-full bg-marca text-black"><UserPlus className="size-5" /> Crear</button>
          </form>
        )}
      </Modal>

      <Modal abierto={Boolean(pinDe)} titulo={pinDe ? `Nuevo PIN para ${pinDe.empleado.nombre}` : ""} onCerrar={() => setPinDe(null)} ancho="sm">
        {pinDe && (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void guardarPin(); }}>
            <input className="campo text-center text-2xl tracking-[0.4em]" inputMode="numeric" value={pinDe.pin} onChange={(e) => setPinDe({ ...pinDe, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })} autoFocus placeholder="4 a 6 dígitos" />
            <button type="submit" disabled={guardando || !pinValido(pinDe.pin)} className="btn w-full bg-ok text-white"><KeyRound className="size-5" /> Guardar PIN</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
