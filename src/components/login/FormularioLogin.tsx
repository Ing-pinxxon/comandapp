"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KeyRound, LogIn, ShieldCheck } from "lucide-react";
import { supabaseNavegador } from "@/lib/supabase/client";
import { mensajeError } from "@/lib/datos";
import { TecladoNumerico } from "@/components/ui/TecladoNumerico";
import { Aviso } from "@/components/ui/Aviso";

const LARGO_PIN = 6;

export function FormularioLogin({ emailPersonal }: { emailPersonal: string }) {
  const router = useRouter();
  const [modo, setModo] = useState<"pin" | "admin">("pin");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ingresar(correo: string, contrasena: string) {
    setCargando(true);
    setError(null);
    const { error } = await supabaseNavegador().auth.signInWithPassword({ email: correo, password: contrasena });
    if (error) {
      setError(error.message.includes("Invalid login") ? "Datos incorrectos. Inténtalo de nuevo." : mensajeError(error));
      setCargando(false);
      setPin("");
      return;
    }
    router.replace("/comandas");
    router.refresh();
  }

  // Al completar los 6 dígitos entra automáticamente
  function cambiarPin(nuevo: string) {
    setPin(nuevo);
    if (nuevo.length === LARGO_PIN && !cargando) void ingresar(emailPersonal, nuevo);
  }

  return (
    <div className="tarjeta w-full max-w-md p-6 sm:p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl bg-marca text-3xl">🍔</div>
        <h1 className="text-3xl font-black tracking-tight">Comandas Saboratto</h1>
        <p className="mt-1 text-texto-suave">{modo === "pin" ? "Ingresa el PIN del personal" : "Acceso de administrador"}</p>
      </div>

      {error && <Aviso tipo="error" className="mb-4">{error}</Aviso>}

      {modo === "pin" ? (
        <>
          <div className="mb-5 flex justify-center gap-3" aria-label="PIN">
            {Array.from({ length: LARGO_PIN }).map((_, i) => (
              <span key={i} className={`size-4 rounded-full border-2 ${i < pin.length ? "border-marca bg-marca" : "border-texto-dim"}`} />
            ))}
          </div>
          <TecladoNumerico valor={pin} maximo={LARGO_PIN} onCambio={cambiarPin} deshabilitado={cargando} />
          {cargando && <p className="mt-3 text-center text-sm text-texto-suave">Ingresando…</p>}
          <button type="button" onClick={() => { setModo("admin"); setError(null); }} className="btn mt-6 w-full bg-panel-2 text-texto-suave">
            <ShieldCheck className="size-5" /> Soy administrador
          </button>
        </>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void ingresar(email.trim(), clave);
          }}
        >
          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">Correo</span>
            <input className="campo" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">Contraseña</span>
            <input className="campo" type="password" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} required />
          </label>
          <button type="submit" disabled={cargando} className="btn w-full bg-marca text-black text-lg">
            <LogIn className="size-5" /> {cargando ? "Ingresando…" : "Ingresar"}
          </button>
          <button type="button" onClick={() => { setModo("pin"); setError(null); }} className="btn w-full bg-panel-2 text-texto-suave">
            <KeyRound className="size-5" /> Usar PIN del personal
          </button>
        </form>
      )}
    </div>
  );
}
