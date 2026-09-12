"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useNegocio } from "@/components/NegocioProvider";
import { ImportadorMenu } from "@/components/menu/ImportadorMenu";

export function ImportarMenuAdmin() {
  const { negocio } = useNegocio();
  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/productos" className="btn bg-panel-2 px-3" aria-label="Volver al menú"><ArrowLeft className="size-5" /></Link>
        <div>
          <h1 className="text-2xl font-black">Importar menú desde foto</h1>
          <p className="text-texto-suave">Los productos que ya existan con el mismo nombre se actualizan; los demás se agregan.</p>
        </div>
      </div>
      <ImportadorMenu negocioId={negocio.id} />
    </div>
  );
}
