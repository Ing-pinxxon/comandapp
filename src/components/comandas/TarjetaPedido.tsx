"use client";

import Link from "next/link";
import { useState } from "react";
import { Bike, Check, MessageCircle, Pencil, RotateCcw, Store, X } from "lucide-react";
import type { Configuracion, PedidoConItems } from "@/lib/tipos";
import { etiquetaMetodoPago } from "@/lib/tipos";
import { formatoCOP, hora12, minutosEntre } from "@/lib/fechas";
import { ESTILO_SEMAFORO, nivelSemaforo } from "@/lib/semaforo";
import { plantillaMensaje, telefonoBonito, urlWhatsApp } from "@/lib/whatsapp";
import { emojiIngrediente } from "@/components/pedido/emojis";

interface Props {
  pedido: PedidoConItems;
  ahora: Date;
  config: Configuracion;
  ocupado?: boolean;
  onEntregar?: () => void;
  onCancelar?: () => void;
  onReabrir?: () => void;
  /** Si viene, editar abre el formulario en la misma pantalla (sin navegar) */
  onEditar?: () => void;
  /** Marca como revisado un pedido que trajo el bot */
  onAprobar?: () => void;
}

export function TarjetaPedido({ pedido, ahora, config, ocupado, onEntregar, onCancelar, onReabrir, onEditar, onAprobar }: Props) {
  const [menuWa, setMenuWa] = useState(false);
  const [verOriginal, setVerOriginal] = useState(false);
  const delBot = pedido.origen === "whatsapp";
  const porRevisar = delBot && !pedido.revisado;
  const pendiente = pedido.estado === "pendiente";
  const minutos = pendiente ? minutosEntre(pedido.creado_en, ahora) : pedido.entregado_en ? minutosEntre(pedido.creado_en, pedido.entregado_en) : null;
  const nivel = nivelSemaforo(minutos ?? 0, config.umbrales_min);
  const estilo = pendiente
    ? ESTILO_SEMAFORO[nivel]
    : pedido.estado === "entregado"
      ? { tarjeta: "border-borde bg-panel opacity-90", badge: "bg-ok text-white", etiqueta: "Entregado" }
      : { tarjeta: "border-borde bg-panel opacity-80", badge: "bg-peligro text-white", etiqueta: "Cancelado" };

  const datosMsg = { nombre: pedido.cliente_nombre, numero: pedido.numero_dia, total: pedido.total };
  const waListo = urlWhatsApp(pedido.cliente_telefono, plantillaMensaje(config.mensajes_whatsapp.listo, datosMsg));
  const waCamino = urlWhatsApp(pedido.cliente_telefono, plantillaMensaje(config.mensajes_whatsapp.en_camino, datosMsg));

  return (
    <article className={`relative flex flex-col rounded-2xl border-2 p-4 transition-colors ${estilo.tarjeta} ${porRevisar ? "ring-2 ring-editar ring-offset-2 ring-offset-fondo" : ""}`}>
      {/* Aviso de pedido traído por el bot y aún sin revisar */}
      {porRevisar && (
        <div className="mb-3 -mx-4 -mt-4 rounded-t-2xl bg-editar px-4 py-2 text-white">
          <div className="flex items-center gap-2 text-sm font-extrabold">
            <MessageCircle className="size-4" /> LLEGÓ POR WHATSAPP · REVISAR
          </div>
          <p className="mt-0.5 text-xs opacity-90">Compara los productos con lo que pidió el cliente antes de prepararlo.</p>
        </div>
      )}

      {/* Encabezado: número, minutos, estado */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black leading-none">#{pedido.numero_dia}</span>
            {delBot && !porRevisar && (
              <span className="inline-flex items-center gap-1 rounded-md bg-whatsapp/20 px-1.5 py-0.5 text-xs font-bold text-whatsapp">
                <MessageCircle className="size-3" /> WhatsApp
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-texto-suave">Tomado {hora12(pedido.creado_en)}</div>
        </div>
        <div className="text-right">
          {minutos !== null && (
            <div className="text-5xl font-black leading-none tabular-nums">
              {minutos}
              <span className="ml-1 text-base font-bold text-texto-suave">min</span>
            </div>
          )}
          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide ${estilo.badge}`}>{estilo.etiqueta}</span>
        </div>
      </div>

      {/* Cliente */}
      <div className="mt-3 border-t border-white/10 pt-3">
        <div className="truncate text-xl font-extrabold">{pedido.cliente_nombre}</div>
        <div className="flex items-center gap-2 text-sm text-texto-suave">
          {pedido.cliente_telefono ? <span>{telefonoBonito(pedido.cliente_telefono)}</span> : <span className="italic">Sin teléfono</span>}
          <span>·</span>
          {pedido.es_domicilio ? (
            <span className="inline-flex items-center gap-1"><Bike className="size-4" /> Domicilio</span>
          ) : (
            <span className="inline-flex items-center gap-1"><Store className="size-4" /> Recoge</span>
          )}
        </div>
      </div>

      {/* Productos */}
      <ul className="mt-3 flex-1 space-y-2">
        {pedido.pedido_items.map((it, i) => (
          <li key={it.id ?? i} className="rounded-xl bg-black/25 px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-lg font-bold leading-tight">
                <span className="mr-1.5 inline-block min-w-7 rounded-md bg-white/15 px-1.5 text-center">{it.cantidad}</span>
                {it.nombre}
                {it.es_combo && <span className="ml-1.5 rounded-md bg-marca/25 px-1.5 text-xs font-extrabold text-marca-claro">COMBO</span>}
                {it.es_personalizado && <span className="ml-1.5 rounded-md bg-white/15 px-1.5 text-xs font-extrabold">X</span>}
              </span>
              <span className="whitespace-nowrap text-sm text-texto-suave">{formatoCOP(it.precio_unitario * it.cantidad)}</span>
            </div>
            {it.exclusiones.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {it.exclusiones.map((ex) => (
                  <span key={ex} className="rounded-md bg-peligro/25 px-1.5 py-0.5 text-sm font-bold text-red-200">
                    {emojiIngrediente(ex)} Sin {ex}
                  </span>
                ))}
              </div>
            )}
            {it.nota && <div className="mt-0.5 text-sm text-amber-200">📝 {it.nota}</div>}
          </li>
        ))}
      </ul>
      {pedido.notas && <div className="mt-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">📝 {pedido.notas}</div>}
      {pedido.motivo_cancelacion && <div className="mt-2 text-sm text-red-300">Motivo: {pedido.motivo_cancelacion}</div>}

      {/* Total */}
      <div className="mt-3 flex items-end justify-between border-t border-white/10 pt-3">
        <div className="text-xs text-texto-suave">
          <div>{etiquetaMetodoPago(pedido.metodo_pago)}</div>
          {pedido.costo_icopor > 0 && <div>Icopor {formatoCOP(pedido.costo_icopor)} ({pedido.unidades_icopor})</div>}
          {pedido.costo_domicilio > 0 && <div>Domicilio {formatoCOP(pedido.costo_domicilio)}</div>}
        </div>
        <div className="text-2xl font-black">{formatoCOP(pedido.total)}</div>
      </div>

      {/* Texto original del bot, para comparar */}
      {delBot && pedido.texto_original && (
        <div className="mt-2">
          <button type="button" onClick={() => setVerOriginal((v) => !v)} className="text-xs font-bold text-texto-suave underline">
            {verOriginal ? "Ocultar" : "Ver"} lo que escribió el bot
          </button>
          {verOriginal && (
            <pre className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-black/40 p-2 text-xs text-texto-suave">
              {pedido.texto_original}
            </pre>
          )}
        </div>
      )}

      {/* Aprobar lo que trajo el bot */}
      {porRevisar && onAprobar && (
        <button type="button" disabled={ocupado} onClick={onAprobar} className="btn mt-3 w-full bg-editar text-white">
          <Check className="size-5" /> Está correcto, aprobar
        </button>
      )}

      {/* Acciones */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        {pendiente ? (
          <>
            <button type="button" disabled={ocupado} onClick={onEntregar} className="btn col-span-2 bg-ok text-white">
              <Check className="size-6" /> Entregado
            </button>
            {onEditar ? (
              <button type="button" onClick={onEditar} className="btn bg-editar text-white" aria-label="Editar pedido" title="Editar">
                <Pencil className="size-5" />
              </button>
            ) : (
              <Link href={`/comandas/${pedido.id}/editar`} className={`btn bg-editar text-white ${ocupado ? "pointer-events-none opacity-45" : ""}`} aria-label="Editar pedido" title="Editar">
                <Pencil className="size-5" />
              </Link>
            )}
            <button type="button" disabled={ocupado} onClick={onCancelar} className="btn bg-peligro text-white" aria-label="Cancelar pedido" title="Cancelar">
              <X className="size-6" />
            </button>
          </>
        ) : (
          <button type="button" disabled={ocupado} onClick={onReabrir} className="btn col-span-4 bg-panel-2 text-texto-suave">
            <RotateCcw className="size-5" /> Volver a la cola
          </button>
        )}
        <div className="relative col-span-4">
          <button
            type="button"
            disabled={!waListo}
            onClick={() => setMenuWa((v) => !v)}
            className="btn w-full bg-whatsapp text-black"
            title={waListo ? "Escribir al cliente" : "Sin teléfono"}
          >
            <MessageCircle className="size-5" /> WhatsApp al cliente
          </button>
          {menuWa && waListo && waCamino && (
            <div className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-xl border border-borde bg-panel shadow-xl">
              <a href={waListo} target="_blank" rel="noopener" onClick={() => setMenuWa(false)} className="block px-4 py-3 font-bold hover:bg-panel-2">✅ Tu pedido está listo</a>
              <a href={waCamino} target="_blank" rel="noopener" onClick={() => setMenuWa(false)} className="block border-t border-borde px-4 py-3 font-bold hover:bg-panel-2">🛵 Tu pedido va en camino</a>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
