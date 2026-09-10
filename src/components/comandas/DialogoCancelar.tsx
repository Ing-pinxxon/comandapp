"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { MOTIVOS_CANCELACION, type PedidoConItems } from "@/lib/tipos";

interface Props {
  pedido: PedidoConItems | null;
  onCerrar: () => void;
  onConfirmar: (motivo: string) => Promise<void>;
}

export function DialogoCancelar({ pedido, onCerrar, onConfirmar }: Props) {
  const [motivo, setMotivo] = useState<string>("");
  const [otro, setOtro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const motivoFinal = motivo === "Otro" ? otro.trim() : motivo;

  return (
    <Modal abierto={Boolean(pedido)} titulo={pedido ? `Cancelar pedido #${pedido.numero_dia} · ${pedido.cliente_nombre}` : ""} onCerrar={onCerrar} ancho="sm">
      <p className="mb-3 text-texto-suave">¿Por qué se cancela? Esto queda registrado para las estadísticas.</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {MOTIVOS_CANCELACION.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMotivo(m)}
            className={`btn justify-start text-left ${motivo === m ? "bg-peligro text-white" : "bg-panel-2"}`}
          >
            {m}
          </button>
        ))}
      </div>
      {motivo === "Otro" && (
        <input className="campo mt-3" placeholder="Escribe el motivo" value={otro} onChange={(e) => setOtro(e.target.value)} autoFocus />
      )}
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onCerrar} className="btn flex-1 bg-panel-2">Volver</button>
        <button
          type="button"
          disabled={!motivoFinal || enviando}
          onClick={async () => {
            setEnviando(true);
            try {
              await onConfirmar(motivoFinal);
              setMotivo("");
              setOtro("");
            } finally {
              setEnviando(false);
            }
          }}
          className="btn flex-1 bg-peligro text-white"
        >
          <Ban className="size-5" /> {enviando ? "Cancelando…" : "Confirmar cancelación"}
        </button>
      </div>
    </Modal>
  );
}
