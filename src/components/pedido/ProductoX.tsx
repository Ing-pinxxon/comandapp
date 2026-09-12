"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { Categoria } from "@/lib/tipos";
import { nuevaClave, type ItemBorrador } from "./tipos-borrador";

interface Props {
  abierto: boolean;
  categorias: Categoria[];
  categoriaInicial: string;
  onCerrar: () => void;
  onAgregar: (item: ItemBorrador) => void;
}

/** Producto o bebida fuera del menú ("X"): nombre libre + precio + categoría */
export function ProductoX({ abierto, onCerrar, ...resto }: Props) {
  return (
    <Modal abierto={abierto} titulo="Producto / bebida X (fuera del menú)" onCerrar={onCerrar} ancho="sm">
      {/* Se monta al abrir: el formulario siempre arranca limpio */}
      {abierto && <FormularioX {...resto} />}
    </Modal>
  );
}

function FormularioX({ categorias, categoriaInicial, onAgregar }: Omit<Props, "abierto" | "onCerrar">) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [categoria, setCategoria] = useState(categoriaInicial || categorias[0]?.nombre || "");
  const [cantidad, setCantidad] = useState(1);

  const precioNum = Number(precio.replace(/\D/g, ""));
  const valido = nombre.trim().length > 0 && precioNum > 0 && Boolean(categoria);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valido) return;
        onAgregar({
          clave: nuevaClave(),
          producto_id: null,
          nombre: nombre.trim(),
          categoria_nombre: categoria,
          precio_base: precioNum,
          precio_combo: null,
          cantidad,
          es_combo: false,
          exclusiones: [],
          nota: "",
          es_personalizado: true,
          ingredientes: [],
          permite_combo: false,
        });
      }}
    >
      <label className="block">
        <span className="mb-1 block text-sm text-texto-suave">Nombre *</span>
        <input className="campo text-lg" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Coca-Cola Cero 400ml" autoFocus />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-texto-suave">Precio *</span>
        <input className="campo text-lg tabular-nums" inputMode="numeric" value={precio} onChange={(e) => setPrecio(e.target.value.replace(/\D/g, ""))} placeholder="3500" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-texto-suave">Categoría (define qué cargos aplican)</span>
        <select className="campo" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {categorias.map((c) => (
            <option key={c.id} value={c.nombre}>
              {c.emoji} {c.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-texto-suave">Cantidad</span>
        <input className="campo text-lg tabular-nums" inputMode="numeric" value={cantidad} onChange={(e) => setCantidad(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))} />
      </label>
      <button type="submit" disabled={!valido} className="btn w-full bg-marca text-lg text-black">
        <Sparkles className="size-5" /> Agregar al pedido
      </button>
    </form>
  );
}
