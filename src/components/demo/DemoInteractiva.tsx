"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, ClipboardList, PlayCircle } from "lucide-react";
import { ColaPedidos } from "@/components/comandas/ColaPedidos";
import { ResumenPanel } from "@/components/admin/ResumenPanel";
import { catalogoDemo, crearPedidosDemo, empleadoDemo } from "@/app/vista-previa/datos-demo";
import { historialDemo } from "@/app/demo/datos-demo";
import { rangoAnterior, rangoPredefinido, type Rango, type RangoClave } from "@/lib/fechas";
import type { PedidoConItems } from "@/lib/tipos";
import { avisarTour, useTour } from "./useTour";
import { PASOS_TOUR } from "./pasos";

type Pestana = "cola" | "panel";

/** Los pedidos de esos días; la demo filtra en memoria, no hay base de datos */
function enRango(pedidos: PedidoConItems[], rango: Rango) {
  return pedidos.filter((p) => p.dia_negocio >= rango.desde && p.dia_negocio <= rango.hasta);
}

export function DemoInteractiva() {
  const [pestana, setPestana] = useState<Pestana>("cola");
  // Se arman al dibujar, no al importar el módulo: así las horas del servidor y
  // las del navegador coinciden y la cola no parpadea al hidratar.
  const [cola] = useState(crearPedidosDemo);
  // El mes corrido da gráficas con historia; la semana puede ser un solo día.
  const [clave, setClave] = useState<RangoClave>("mes");
  const [rango, setRango] = useState<Rango>(() => rangoPredefinido("mes"));

  const pedidos = useMemo(() => enRango(historialDemo, rango), [rango]);
  const anteriores = useMemo(() => enRango(historialDemo, rangoAnterior(rango)), [rango]);

  const { volverAVer } = useTour({ steps: PASOS_TOUR, storageKey: "comandapp_demo_v1" });

  // El tutorial espera a que el visitante toque los botones de verdad. En vez de
  // meter avisos dentro de los componentes reales, escuchamos los clics aquí.
  useEffect(() => {
    const eventos: Record<string, string> = {
      entregar: "demo:entregado",
      nuevo: "demo:formulario",
      productos: "demo:producto",
      volver: "demo:volver",
      "tab-panel": "demo:panel",
    };
    function alTocar(e: MouseEvent) {
      const destino = e.target as HTMLElement | null;
      const marca = destino?.closest?.("[data-tour]")?.getAttribute("data-tour") ?? "";
      const evento = eventos[marca];
      // Un respiro para que la pantalla nueva ya esté dibujada cuando el tutorial la busque
      if (evento) setTimeout(() => avisarTour(evento), 150);
    }
    document.addEventListener("click", alTocar, true);
    return () => document.removeEventListener("click", alTocar, true);
  }, []);

  function cambiarRango(nuevaClave: RangoClave, personalizado?: Rango) {
    setClave(nuevaClave);
    setRango(nuevaClave === "personalizado" && personalizado ? personalizado : rangoPredefinido(nuevaClave === "personalizado" ? "hoy" : nuevaClave));
  }

  return (
    <div className="min-h-screen bg-fondo">
      <div className="sticky top-0 z-40 border-b border-borde bg-marca/15 px-4 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-sm font-bold">
            Demostración con datos de ejemplo · nada de lo que toques se guarda
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button type="button" onClick={volverAVer} className="btn min-h-10 bg-panel-2 px-3 text-sm">
              <PlayCircle className="size-4" /> Ver el tutorial otra vez
            </button>
            <Link href="/registro" className="btn min-h-10 bg-marca px-4 text-sm text-black">
              Crear mi cuenta gratis
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-borde bg-panel px-4">
        <div className="mx-auto flex max-w-7xl gap-1 py-2">
          <button
            type="button"
            data-tour="tab-cola"
            onClick={() => setPestana("cola")}
            className={`btn min-h-10 px-4 text-sm ${pestana === "cola" ? "bg-marca text-black" : "bg-panel-2"}`}
          >
            <ClipboardList className="size-4" /> Cola de pedidos
          </button>
          <button
            type="button"
            data-tour="tab-panel"
            onClick={() => setPestana("panel")}
            className={`btn min-h-10 px-4 text-sm ${pestana === "panel" ? "bg-marca text-black" : "bg-panel-2"}`}
          >
            <BarChart3 className="size-4" /> Panel del dueño
          </button>
        </div>
      </div>

      {pestana === "cola" ? (
        <ColaPedidos inicial={cola} catalogoInicial={catalogoDemo} empleado={empleadoDemo} demo />
      ) : (
        <div className="mx-auto max-w-7xl p-4">
          <ResumenPanel pedidos={pedidos} anteriores={anteriores} clave={clave} rango={rango} cambiar={cambiarRango} />
        </div>
      )}
    </div>
  );
}
