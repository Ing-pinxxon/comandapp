"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, ChevronDown, ChevronUp, LogOut, Plus, RefreshCw } from "lucide-react";
import type { PedidoConItems, Rol } from "@/lib/tipos";
import { cambiarEstado, cargarCatalogo, cargarPedidosHoy, cerrarSesion, mensajeError, suscribirPedidos } from "@/lib/datos";
import type { Catalogo } from "@/lib/catalogo";
import { fechaISOBogota, hora12 } from "@/lib/fechas";
import { TarjetaPedido } from "./TarjetaPedido";
import { DialogoCancelar } from "./DialogoCancelar";
import { FormularioPedido } from "@/components/pedido/FormularioPedido";
import { Aviso } from "@/components/ui/Aviso";

interface Props {
  inicial: PedidoConItems[];
  catalogoInicial: Catalogo;
  rol: Rol;
  /** Vista previa sin base de datos: no carga ni guarda, solo cambia el estado en pantalla */
  demo?: boolean;
}

/** Qué formulario está abierto encima de la cola */
type Composicion = { modo: "nuevo" } | { modo: "editar"; pedido: PedidoConItems } | null;

export function ColaPedidos({ inicial, catalogoInicial, rol, demo = false }: Props) {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<PedidoConItems[]>(inicial);
  const [catalogo, setCatalogo] = useState<Catalogo>(catalogoInicial);
  const [ahora, setAhora] = useState(() => new Date());
  const [error, setError] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);
  const [aCancelar, setACancelar] = useState<PedidoConItems | null>(null);
  const [verEntregados, setVerEntregados] = useState(false);
  const [verCancelados, setVerCancelados] = useState(false);
  const [ocupados, setOcupados] = useState<Set<number>>(new Set());
  const [composicion, setComposicion] = useState<Composicion>(null);
  const config = catalogo.config;
  // Evita pisar un cambio recién hecho con una respuesta más lenta del servidor
  const enVuelo = useRef(0);

  /** Solo los pedidos: es lo único que cambia minuto a minuto. */
  const recargarPedidos = useCallback(async () => {
    if (demo) return;
    const marca = ++enVuelo.current;
    try {
      setRefrescando(true);
      const p = await cargarPedidosHoy();
      if (marca === enVuelo.current) {
        setPedidos(p);
        setError(null);
      }
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setRefrescando(false);
    }
  }, [demo]);

  /** El menú y los ajustes cambian poco: se releen solo cuando hace falta. */
  const recargarCatalogo = useCallback(async () => {
    if (demo) return;
    try {
      setCatalogo(await cargarCatalogo());
    } catch {
      // si falla se conserva el catálogo que ya está en pantalla
    }
  }, [demo]);

  // Tiempo real + respaldo cada 30 s + reloj cada 15 s
  useEffect(() => {
    const parar = demo
      ? () => undefined
      : suscribirPedidos((tabla) => {
          if (tabla === "configuracion" || tabla === "productos") void recargarCatalogo();
          else void recargarPedidos();
        });
    const respaldo = setInterval(() => void recargarPedidos(), 30000);
    const reloj = setInterval(() => setAhora(new Date()), 15000);
    const alVolver = () => {
      if (document.visibilityState === "visible") void recargarPedidos();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      parar();
      clearInterval(respaldo);
      clearInterval(reloj);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [recargarPedidos, recargarCatalogo, demo]);

  const hoy = fechaISOBogota(ahora);
  const pendientes = useMemo(() => pedidos.filter((p) => p.estado === "pendiente").sort((a, b) => a.creado_en.localeCompare(b.creado_en)), [pedidos]);
  const entregados = useMemo(() => pedidos.filter((p) => p.estado === "entregado" && p.dia_negocio === hoy).sort((a, b) => (b.entregado_en ?? "").localeCompare(a.entregado_en ?? "")), [pedidos, hoy]);
  const cancelados = useMemo(() => pedidos.filter((p) => p.estado === "cancelado" && p.dia_negocio === hoy).sort((a, b) => (b.cancelado_en ?? "").localeCompare(a.cancelado_en ?? "")), [pedidos, hoy]);
  const ventasHoy = entregados.reduce((s, p) => s + p.total, 0);

  async function marcar(pedido: PedidoConItems, estado: "entregado" | "cancelado" | "pendiente", motivo?: string) {
    const anterior = pedidos;
    // 1) La pantalla cambia de inmediato: el personal no espera a la red.
    setPedidos((lista) =>
      lista.map((p) =>
        p.id === pedido.id
          ? {
              ...p,
              estado,
              entregado_en: estado === "entregado" ? new Date().toISOString() : null,
              cancelado_en: estado === "cancelado" ? new Date().toISOString() : null,
              motivo_cancelacion: estado === "cancelado" ? (motivo ?? null) : null,
            }
          : p,
      ),
    );
    setError(null);
    if (demo) return;

    // 2) Se confirma contra la base; si falla, se devuelve a como estaba.
    setOcupados((s) => new Set(s).add(pedido.id));
    try {
      await cambiarEstado(pedido.id, estado, motivo);
    } catch (e) {
      setPedidos(anterior);
      setError(`No se pudo guardar el cambio del pedido #${pedido.numero_dia}. ${mensajeError(e)}`);
    } finally {
      setOcupados((s) => {
        const n = new Set(s);
        n.delete(pedido.id);
        return n;
      });
    }
  }

  async function salir() {
    await cerrarSesion();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Cabecera fija de una línea */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-borde bg-fondo/95 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-marca text-xl">🍔</span>
          <div className="leading-tight">
            <div className="text-lg font-black">Saboratto</div>
            <div className="text-xs text-texto-suave">{hora12(ahora)}</div>
          </div>
        </div>

        <div className="ml-2 hidden items-center gap-2 text-sm sm:flex">
          <Indicador etiqueta="En cola" valor={pendientes.length} destacado />
          <Indicador etiqueta="Entregados" valor={entregados.length} />
          <Indicador etiqueta="Ventas hoy" valor={"$" + ventasHoy.toLocaleString("es-CO")} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={() => void recargarPedidos()} className="btn bg-panel-2 px-3" aria-label="Actualizar" title="Actualizar">
            <RefreshCw className={`size-5 ${refrescando ? "animate-spin" : ""}`} />
          </button>
          {rol === "admin" && (
            <Link href="/admin" className="btn bg-panel-2 px-3" title="Panel administrador">
              <BarChart3 className="size-5" />
              <span className="hidden lg:inline">Admin</span>
            </Link>
          )}
          <button type="button" onClick={() => void salir()} className="btn bg-panel-2 px-3" aria-label="Salir" title="Cerrar sesión">
            <LogOut className="size-5" />
          </button>
          {/* Abre el formulario al instante: el menú ya está en memoria, no hay ida al servidor */}
          <button type="button" onClick={() => setComposicion({ modo: "nuevo" })} className="btn bg-marca px-4 text-lg text-black sm:px-5" aria-label="Nuevo pedido">
            <Plus className="size-6" /> <span className="hidden sm:inline">Nuevo pedido</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-4">
        {error && <Aviso tipo="error" className="mb-4">{error}</Aviso>}

        {pendientes.length === 0 ? (
          <div className="flex h-[60vh] flex-col items-center justify-center text-center text-texto-suave">
            <div className="text-6xl">🧑‍🍳</div>
            <p className="mt-3 text-xl font-bold">Sin pedidos en cola</p>
            <p className="mt-1">Toca <b>Nuevo pedido</b> para tomar el primero.</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pendientes.map((p) => (
              <TarjetaPedido
                key={p.id}
                pedido={p}
                ahora={ahora}
                config={config}
                ocupado={ocupados.has(p.id)}
                onEntregar={() => void marcar(p, "entregado")}
                onCancelar={() => setACancelar(p)}
                onEditar={() => setComposicion({ modo: "editar", pedido: p })}
              />
            ))}
          </section>
        )}

        <Plegable titulo={`Entregados hoy (${entregados.length})`} abierto={verEntregados} onToggle={() => setVerEntregados((v) => !v)}>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {entregados.map((p) => (
              <TarjetaPedido key={p.id} pedido={p} ahora={ahora} config={config} ocupado={ocupados.has(p.id)} onReabrir={() => void marcar(p, "pendiente")} />
            ))}
          </section>
        </Plegable>

        <Plegable titulo={`Cancelados hoy (${cancelados.length})`} abierto={verCancelados} onToggle={() => setVerCancelados((v) => !v)}>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cancelados.map((p) => (
              <TarjetaPedido key={p.id} pedido={p} ahora={ahora} config={config} ocupado={ocupados.has(p.id)} onReabrir={() => void marcar(p, "pendiente")} />
            ))}
          </section>
        </Plegable>
      </main>

      <DialogoCancelar
        pedido={aCancelar}
        onCerrar={() => setACancelar(null)}
        onConfirmar={async (motivo) => {
          if (aCancelar) await marcar(aCancelar, "cancelado", motivo);
          setACancelar(null);
        }}
      />

      {composicion && (
        <FormularioPedido
          key={composicion.modo === "editar" ? `editar-${composicion.pedido.id}` : "nuevo"}
          catalogo={catalogo}
          pedidoExistente={composicion.modo === "editar" ? composicion.pedido : undefined}
          demo={demo}
          onCerrar={() => setComposicion(null)}
          onGuardado={() => {
            setComposicion(null);
            void recargarPedidos();
          }}
        />
      )}
    </div>
  );
}

function Indicador({ etiqueta, valor, destacado }: { etiqueta: string; valor: number | string; destacado?: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-1.5 ${destacado ? "bg-marca/15 text-marca-claro" : "bg-panel-2 text-texto-suave"}`}>
      <span className="text-xs uppercase tracking-wide">{etiqueta}</span>{" "}
      <span className="text-base font-black">{valor}</span>
    </div>
  );
}

function Plegable({ titulo, abierto, onToggle, children }: { titulo: string; abierto: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <button type="button" onClick={onToggle} className="btn w-full justify-between bg-panel text-left text-texto-suave">
        <span className="font-bold">{titulo}</span>
        {abierto ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
      </button>
      {abierto && <div className="mt-4">{children}</div>}
    </div>
  );
}
