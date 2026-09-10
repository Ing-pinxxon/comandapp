"use client";

import { useState } from "react";
import type { Rango, RangoClave } from "@/lib/fechas";

interface Props {
  clave: RangoClave;
  rango: Rango;
  onCambiar: (clave: RangoClave, personalizado?: Rango) => void;
}

const OPCIONES: { clave: RangoClave; etiqueta: string }[] = [
  { clave: "hoy", etiqueta: "Hoy" },
  { clave: "ayer", etiqueta: "Ayer" },
  { clave: "semana", etiqueta: "Esta semana" },
  { clave: "mes", etiqueta: "Este mes" },
  { clave: "personalizado", etiqueta: "Personalizado" },
];

export function FiltroRango({ clave, rango, onCambiar }: Props) {
  const [desde, setDesde] = useState(rango.desde);
  const [hasta, setHasta] = useState(rango.hasta);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPCIONES.map((o) => (
        <button
          key={o.clave}
          type="button"
          onClick={() => (o.clave === "personalizado" ? onCambiar("personalizado", { desde, hasta }) : onCambiar(o.clave))}
          className={`btn min-h-11 px-4 ${clave === o.clave ? "bg-marca text-black" : "bg-panel-2 text-texto-suave"}`}
        >
          {o.etiqueta}
        </button>
      ))}
      {clave === "personalizado" && (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (desde && hasta) onCambiar("personalizado", { desde: desde <= hasta ? desde : hasta, hasta: desde <= hasta ? hasta : desde });
          }}
        >
          <input type="date" className="campo min-h-11 w-auto" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <span className="text-texto-suave">a</span>
          <input type="date" className="campo min-h-11 w-auto" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <button type="submit" className="btn min-h-11 bg-panel-2 px-4">Aplicar</button>
        </form>
      )}
      <span className="ml-auto text-sm text-texto-suave">
        {rango.desde === rango.hasta ? rango.desde : `${rango.desde} → ${rango.hasta}`}
      </span>
    </div>
  );
}
