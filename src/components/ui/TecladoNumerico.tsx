"use client";

import { Delete } from "lucide-react";

interface Props {
  valor: string;
  maximo: number;
  onCambio: (nuevo: string) => void;
  deshabilitado?: boolean;
}

/** Teclado numérico grande para tablet (PIN o teléfono) */
export function TecladoNumerico({ valor, maximo, onCambio, deshabilitado }: Props) {
  const teclas = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "borrar"];
  return (
    <div className="grid grid-cols-3 gap-3">
      {teclas.map((t, i) =>
        t === "" ? (
          <span key={`vacio-${i}`} />
        ) : (
          <button
            key={t}
            type="button"
            disabled={deshabilitado}
            onClick={() => {
              if (t === "borrar") onCambio(valor.slice(0, -1));
              else if (valor.length < maximo) onCambio(valor + t);
            }}
            className="btn h-16 text-2xl bg-panel-2 hover:bg-borde"
            aria-label={t === "borrar" ? "Borrar" : t}
          >
            {t === "borrar" ? <Delete className="size-7" /> : t}
          </button>
        ),
      )}
    </div>
  );
}
