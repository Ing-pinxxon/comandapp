"use client";

import { useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Minus, Plus, Trash2 } from "lucide-react";
import type { Configuracion } from "@/lib/tipos";
import { formatoCOP } from "@/lib/fechas";
import { emojiIngrediente } from "./emojis";
import { precioUnitarioBorrador, type ItemBorrador } from "./tipos-borrador";

interface Props {
  item: ItemBorrador;
  config: Configuracion;
  abierto: boolean;
  /** Es el último que se tocó: se trae a la vista y se resalta un momento */
  destacado?: boolean;
  onAlternar: () => void;
  onCambiar: (item: ItemBorrador) => void;
  onCantidad: (delta: number) => void;
  onQuitar: () => void;
}

/**
 * Un producto dentro del pedido. Cerrado ocupa una línea, para que quepan
 * muchos a la vista; los ingredientes se apagan con un toque al desplegarlo.
 */
export function ItemPedido({ item, config, abierto, destacado = false, onAlternar, onCambiar, onCantidad, onQuitar }: Props) {
  const fila = useRef<HTMLLIElement>(null);
  const pu = precioUnitarioBorrador(item, config);
  const quitados = item.exclusiones.length;
  const personalizable = item.ingredientes.length > 0 || item.permite_combo || item.nota;

  // Con la lista larga, el producto que acabas de tocar puede quedar fuera de
  // pantalla: se sube solo lo justo para verlo.
  useEffect(() => {
    if (destacado) fila.current?.scrollIntoView({ block: "nearest" });
  }, [destacado]);

  function alternarIngrediente(ing: string) {
    onCambiar({
      ...item,
      exclusiones: item.exclusiones.includes(ing) ? item.exclusiones.filter((x) => x !== ing) : [...item.exclusiones, ing],
    });
  }

  return (
    <li
      ref={fila}
      className={`tarjeta overflow-hidden transition-shadow ${quitados > 0 ? "border-peligro/40" : ""} ${destacado ? "ring-2 ring-marca" : ""}`}
    >
      {/* Una sola línea: nombre, cantidad, total y los dos botones */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="min-w-0 flex-1">
          {/* En celular el nombre se parte en dos líneas; en tablet cabe en una */}
          <div className="line-clamp-2 text-base font-extrabold leading-tight sm:truncate">
            {item.nombre}
            {item.es_combo && <span className="ml-1.5 rounded-md bg-marca/25 px-1.5 text-xs font-extrabold text-marca-oscuro">COMBO</span>}
            {item.es_personalizado && <span className="ml-1.5 rounded-md bg-negro/10 px-1.5 text-xs font-extrabold">X</span>}
          </div>
          <div className="text-sm tabular-nums text-texto-suave">{formatoCOP(pu)} c/u</div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => onCantidad(-1)} disabled={item.cantidad === 1} className="btn min-h-10 bg-panel-2 px-2.5" aria-label="Quitar uno">
            <Minus className="size-5" />
          </button>
          <span className="min-w-7 text-center text-xl font-black tabular-nums">{item.cantidad}</span>
          <button type="button" onClick={() => onCantidad(1)} className="btn min-h-10 bg-panel-2 px-2.5" aria-label="Agregar uno">
            <Plus className="size-5" />
          </button>
        </div>

        <div className="hidden w-24 shrink-0 text-right text-base font-black tabular-nums sm:block">{formatoCOP(pu * item.cantidad)}</div>

        <button type="button" onClick={onQuitar} className="btn min-h-10 shrink-0 bg-panel-2 px-2.5" aria-label={`Quitar ${item.nombre} del pedido`}>
          <Trash2 className="size-5 text-peligro" />
        </button>

        {personalizable && (
          <button
            type="button"
            onClick={onAlternar}
            aria-expanded={abierto}
            className={`btn min-h-10 shrink-0 px-2.5 ${abierto ? "bg-marca text-black" : "bg-panel-2"}`}
            aria-label={abierto ? "Cerrar personalización" : "Personalizar"}
          >
            {abierto ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
          </button>
        )}
      </div>

      {/* Lo quitado y la nota se ven sin abrir nada */}
      {!abierto && (quitados > 0 || item.nota) && (
        <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2">
          {item.exclusiones.map((ing) => (
            <span key={ing} className="rounded-lg bg-peligro/20 px-2 py-0.5 text-sm font-bold text-peligro">
              {emojiIngrediente(ing)} Sin {ing}
            </span>
          ))}
          {item.nota && <span className="text-sm text-marca-oscuro">📝 {item.nota}</span>}
        </div>
      )}

      {/* Panel de personalización */}
      {abierto && (
        <div className="space-y-3 border-t border-borde bg-panel-2 p-3">
          {item.permite_combo && (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onCambiar({ ...item, es_combo: false })} className={`btn ${!item.es_combo ? "bg-marca text-black" : "bg-panel"}`}>
                Sola · {formatoCOP(item.precio_base)}
              </button>
              <button type="button" onClick={() => onCambiar({ ...item, es_combo: true })} className={`btn ${item.es_combo ? "bg-marca text-black" : "bg-panel"}`}>
                🍱 Combo · {formatoCOP(item.precio_combo ?? item.precio_base + config.extra_combo)}
              </button>
            </div>
          )}

          {item.ingredientes.length > 0 && (
            <div data-tour="ingredientes">
              <p className="mb-1.5 text-sm font-bold text-texto-suave">Toca un ingrediente para quitarlo</p>
              <div className="flex flex-wrap gap-2">
                {item.ingredientes.map((ing) => {
                  const quitado = item.exclusiones.includes(ing);
                  return (
                    <button
                      key={ing}
                      type="button"
                      onClick={() => alternarIngrediente(ing)}
                      aria-pressed={quitado}
                      className={`btn min-h-11 gap-1.5 px-3 text-base ${
                        quitado ? "bg-peligro/25 text-peligro line-through decoration-2 ring-2 ring-peligro" : "bg-panel text-texto ring-1 ring-borde"
                      }`}
                    >
                      <span className={quitado ? "opacity-50 grayscale" : ""}>{emojiIngrediente(ing)}</span>
                      {ing}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-texto-suave">📝 Nota para cocina</span>
            <input
              className="campo min-h-11"
              value={item.nota}
              onChange={(e) => onCambiar({ ...item, nota: e.target.value })}
              placeholder="Ej: bien asada, salsas aparte"
            />
          </label>

          <button type="button" onClick={onAlternar} className="btn min-h-10 w-full bg-panel text-sm">
            <ChevronUp className="size-4" /> Listo
          </button>
        </div>
      )}
    </li>
  );
}
