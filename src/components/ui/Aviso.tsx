"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface Props {
  tipo: "error" | "ok" | "info";
  children: React.ReactNode;
  className?: string;
}

export function Aviso({ tipo, children, className = "" }: Props) {
  const estilos = {
    error: "border-peligro/50 bg-peligro/10 text-peligro",
    ok: "border-ok/50 bg-ok/10 text-ok",
    info: "border-borde bg-panel-2 text-texto-suave",
  };
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${estilos[tipo]} ${className}`} role={tipo === "error" ? "alert" : "status"}>
      {tipo === "error" ? <AlertTriangle className="mt-0.5 size-4 shrink-0" /> : tipo === "ok" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : null}
      <div>{children}</div>
    </div>
  );
}
