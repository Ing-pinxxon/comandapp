"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

interface Props {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  ancho?: "sm" | "md" | "lg";
}

export function Modal({ abierto, titulo, onCerrar, children, ancho = "md" }: Props) {
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  const anchos = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onCerrar} role="dialog" aria-modal="true">
      <div
        className={`tarjeta w-full ${anchos[ancho]} max-h-[92vh] flex flex-col shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-borde px-5 py-4">
          <h2 className="text-xl font-extrabold">{titulo}</h2>
          <button type="button" onClick={onCerrar} className="btn bg-panel-2 px-3" aria-label="Cerrar">
            <X className="size-6" />
          </button>
        </div>
        <div className="scroll-fino overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
