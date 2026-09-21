"use client";

import { ChevronDown, ChevronUp, Minus, Plus, Trash2 } from "lucide-react";
import type { Configuracion } from "@/lib/tipos";
import { formatoCOP } from "@/lib/fechas";
import { emojiIngrediente } from "./emojis";
import { precioUnitarioBorrador, type ItemBorrador } from "./tipos-borrador";

interface Props {
  item: ItemBorrador;
  config: Configuracion;
  abierto: boolean;
  onAlternar: () => void;
  onCambiar: (item: ItemBorrador) => void;
  onCantidad: (delta: number) => void;
}

/**
 * Un producto dentro del pedido. Los ingredientes se ven y se apagan aquí
 * mismo con un toque: no hay que abrir otra ventana ni leer una lista.
 */
export function ItemPedido({ item, config, abierto, onAlternar, onCambiar, onCantidad }: Props) {
  const pu = precioUnitarioBorrador(item, config);
  const quitados = item.exclusiones.length;

  function alternarIngrediente(ing: string) {
    onCambiar({
      ...item,
      exclusiones: item.exclusiones.includes(ing) ? item.exclusiones.filter((x) => x !== ing) : [...item.exclusiones, ing],
    });
  }

  return (
    <li className={`tarjeta overflow-hidden ${quitados > 0 ? "border-peligro/40" : ""}`}>
      {/* Encabezado: nombre, precio y cantidad */}
      <div className="flex items-start gap-2 p-3">
        <div className="min-w-0 flex-1">
          <div className="text-base font-extrabold leading-tight">
            {item.nombre}
            {item.es_combo && <span className="ml-1.5 rounded-md bg-marca/25 px-1.5 text-xs font-extrabold text-marca-oscuro">COMBO</span>}
            {item.es_personalizado && <span className="ml-1.5 rounded-md bg-negro/10 px-1.5 text-xs font-extrabold">X</span>}
          </div>
          <div className="mt-0.5 text-sm text-texto-suave">
            {formatoCOP(pu)} × {item.cantidad} = <b className="text-texto">{formatoCOP(pu * item.cantidad)}</b>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => onCantidad(-1)} className="btn min-h-11 bg-panel-2 px-3" aria-label={item.cantidad === 1 ? "Quitar del pedido" : "Quitar uno"}>
            {item.cantidad === 1 ? <Trash2 className="size-5 text-peligro" /> : <Minus className="size-5" />}
          </button>
          <span className="min-w-8 text-center text-xl font-black tabular-nums">{item.cantidad}</span>
          <button type="button" onClick={() => onCantidad(1)} className="btn min-h-11 bg-panel-2 px-3" aria-label="Agregar uno">
            <Plus className="size-5" />
          </button>
        </div>
      </div>

      {/* Resumen de lo quitado cuando está cerrado: se ve sin abrir nada */}
      {!abierto && quitados > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 pb-2">
          {item.exclusiones.map((ing) => (
            <span key={ing} className="rounded-lg bg-peligro/20 px-2 py-1 text-sm font-bold text-peligro">
              {emojiIngrediente(ing)} Sin {ing}
            </span>
          ))}
        </div>
      )}
      {!abierto && item.nota && <div className="px-3 pb-2 text-sm text-marca-oscuro">📝 {item.nota}</div>}

      {/* Panel de personalización */}
      {abierto && (
        <div className="space-y-3 border-t border-borde bg-panel-2 p-3">
          {item.permite_combo && (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onCambiar({ ...item, es_combo: false })} className={`btn ${!item.es_combo ? "bg-marca text-black" : "bg-panel-2"}`}>
                Sola · {formatoCOP(item.precio_base)}
              </button>
              <button type="button" onClick={() => onCambiar({ ...item, es_combo: true })} className={`btn ${item.es_combo ? "bg-marca text-black" : "bg-panel-2"}`}>
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
                        quitado
                          ? "bg-peligro/25 text-peligro line-through decoration-2 ring-2 ring-peligro"
                          : "bg-panel-2 text-texto ring-1 ring-borde"
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
        </div>
      )}

      {/* Abrir / cerrar */}
      {(item.ingredientes.length > 0 || item.permite_combo || abierto || item.nota) && (
        <button
          type="button"
          onClick={onAlternar}
          className="flex min-h-10 w-full items-center justify-center gap-1.5 border-t border-borde text-sm font-bold text-texto-suave active:bg-panel-2"
        >
          {abierto ? (
            <>
              <ChevronUp className="size-4" /> Listo
            </>
          ) : (
            <>
              <ChevronDown className="size-4" /> Personalizar
              {quitados > 0 && <span className="rounded-full bg-peligro/25 px-1.5 text-peligro">{quitados}</span>}
            </>
          )}
        </button>
      )}
    </li>
  );
}
