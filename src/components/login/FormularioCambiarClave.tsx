"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { supabaseNavegador } from "@/lib/supabase/client";
import { mensajeError } from "@/lib/datos";
import { Aviso } from "@/components/ui/Aviso";
import { Logotipo } from "@/components/ui/Logotipo";

export function FormularioCambiarClave() {
  const router = useRouter();
  const [clave, setClave] = useState("");
  const [repetir, setRepetir] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (clave !== repetir) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setCargando(true);
    setError(null);
    const { error } = await supabaseNavegador().auth.updateUser({ password: clave });
    if (error) {
      setError(error.message.toLowerCase().includes("session") ? "El enlace venció. Pide uno nuevo desde «Olvidé mi contraseña»." : mensajeError(error));
      setCargando(false);
      return;
    }
    router.replace("/comandas");
    router.refresh();
  }

  return (
    <div className="tarjeta w-full max-w-md p-6 sm:p-8">
      <div className="mb-6 text-center">
        <Logotipo className="mx-auto mb-4" />
        <h1 className="text-2xl font-black tracking-tight">Nueva contraseña</h1>
      </div>
      {error && <Aviso tipo="error" className="mb-4">{error}</Aviso>}
      <form className="space-y-4" onSubmit={(e) => void enviar(e)}>
        <label className="block">
          <span className="mb-1 block text-sm text-texto-suave">Contraseña nueva</span>
          <input className="campo" type="password" autoComplete="new-password" value={clave} onChange={(e) => setClave(e.target.value)} required minLength={6} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-texto-suave">Repite la contraseña</span>
          <input className="campo" type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} required minLength={6} />
        </label>
        <button type="submit" disabled={cargando} className="btn w-full bg-marca text-lg text-black">
          <KeyRound className="size-5" /> {cargando ? "Guardando…" : "Guardar y entrar"}
        </button>
      </form>
    </div>
  );
}
