"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LogIn, Mail, UserPlus } from "lucide-react";
import { supabaseNavegador } from "@/lib/supabase/client";
import { mensajeError } from "@/lib/datos";
import { Aviso } from "@/components/ui/Aviso";
import { Logotipo } from "@/components/ui/Logotipo";

type Modo = "login" | "registro" | "recuperar";

const TITULOS: Record<Modo, { titulo: string; sub: string }> = {
  login: { titulo: "Inicia sesión", sub: "Rápido. Fácil. Seguro." },
  registro: { titulo: "Crea tu cuenta", sub: "Gratis. En dos minutos tu negocio está tomando pedidos." },
  recuperar: { titulo: "Recuperar contraseña", sub: "Te enviamos un enlace al correo para crear una nueva." },
};

function traducir(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Primero confirma tu correo: revisa la bandeja de entrada (y spam).";
  if (m.includes("already registered")) return "Ese correo ya tiene cuenta. Inicia sesión.";
  if (m.includes("password") && m.includes("6")) return "La contraseña debe tener al menos 6 caracteres.";
  if (m.includes("rate limit")) return "Demasiados intentos. Espera un momento.";
  return msg;
}

export function FormularioAcceso({ modo }: { modo: Modo }) {
  const router = useRouter();
  const params = useSearchParams();
  const volver = params.get("volver") || "/comandas";
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error") === "enlace" ? "El enlace no es válido o ya venció. Pide uno nuevo." : null);
  const [aviso, setAviso] = useState<string | null>(null);
  const t = TITULOS[modo];

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setAviso(null);
    const sb = supabaseNavegador();
    const origen = window.location.origin;
    try {
      if (modo === "login") {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: clave });
        if (error) throw error;
        router.replace(volver);
        router.refresh();
        return;
      }
      if (modo === "registro") {
        const { data, error } = await sb.auth.signUp({
          email: email.trim(),
          password: clave,
          options: { emailRedirectTo: `${origen}/auth/callback?volver=/onboarding` },
        });
        if (error) throw error;
        if (data.session) {
          router.replace("/onboarding");
          router.refresh();
          return;
        }
        setAviso("Te enviamos un correo de confirmación. Ábrelo y toca el enlace para activar tu cuenta.");
        return;
      }
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${origen}/auth/callback?volver=/auth/cambiar-clave` });
      if (error) throw error;
      setAviso("Listo. Si el correo existe, recibirás un enlace para crear una contraseña nueva.");
    } catch (err) {
      setError(traducir(mensajeError(err)));
    } finally {
      setCargando(false);
    }
  }

  async function conGoogle() {
    setError(null);
    setCargando(true);
    const { error } = await supabaseNavegador().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?volver=${encodeURIComponent(modo === "registro" ? "/onboarding" : volver)}` },
    });
    if (error) {
      setError(error.message.toLowerCase().includes("provider") ? "El acceso con Google aún no está activado en esta instalación." : traducir(error.message));
      setCargando(false);
    }
  }

  return (
    <div className="tarjeta w-full max-w-md p-6 sm:p-8">
      <div className="mb-6 text-center">
        <Logotipo className="mx-auto mb-4" />
        <h1 className="text-2xl font-black tracking-tight">{t.titulo}</h1>
        <p className="mt-1 text-texto-suave">{t.sub}</p>
      </div>

      {error && <Aviso tipo="error" className="mb-4">{error}</Aviso>}
      {aviso && <Aviso tipo="ok" className="mb-4">{aviso}</Aviso>}

      <form className="space-y-4" onSubmit={(e) => void enviar(e)}>
        <label className="block">
          <span className="mb-1 block text-sm text-texto-suave">Correo</span>
          <input className="campo" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@correo.com" />
        </label>
        {modo !== "recuperar" && (
          <label className="block">
            <span className="mb-1 block text-sm text-texto-suave">Contraseña</span>
            <input
              className="campo"
              type="password"
              autoComplete={modo === "registro" ? "new-password" : "current-password"}
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              minLength={6}
              placeholder={modo === "registro" ? "Mínimo 6 caracteres" : ""}
            />
          </label>
        )}
        <button type="submit" disabled={cargando} className="btn w-full bg-marca text-lg text-black">
          {modo === "registro" ? <UserPlus className="size-5" /> : modo === "recuperar" ? <Mail className="size-5" /> : <LogIn className="size-5" />}
          {cargando ? "Un momento…" : modo === "registro" ? "Crear cuenta" : modo === "recuperar" ? "Enviar enlace" : "Ingresar"}
        </button>
      </form>

      {modo !== "recuperar" && (
        <>
          <div className="my-4 flex items-center gap-3 text-xs text-texto-dim">
            <span className="h-px flex-1 bg-borde" /> o <span className="h-px flex-1 bg-borde" />
          </div>
          <button type="button" onClick={() => void conGoogle()} disabled={cargando} className="btn w-full border border-borde bg-panel">
            <IconoGoogle /> Continuar con Google
          </button>
        </>
      )}

      <div className="mt-6 space-y-2 text-center text-sm text-texto-suave">
        {modo === "login" && (
          <>
            <p>
              ¿No tienes cuenta?{" "}
              <Link href="/registro" className="font-bold text-texto underline">Crea una gratis</Link>
            </p>
            <p>
              <Link href="/recuperar" className="underline">Olvidé mi contraseña</Link>
            </p>
          </>
        )}
        {modo === "registro" && (
          <p>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-bold text-texto underline">Inicia sesión</Link>
          </p>
        )}
        {modo === "recuperar" && (
          <p>
            <Link href="/login" className="underline">Volver a iniciar sesión</Link>
          </p>
        )}
      </div>
    </div>
  );
}

function IconoGoogle() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1C3.3 21.3 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
    </svg>
  );
}
