import { Suspense } from "react";
import { FormularioAcceso } from "@/components/login/FormularioAcceso";

export const metadata = { title: "Crear cuenta · Comandapp" };

export default function PaginaRegistro() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Suspense>
        <FormularioAcceso modo="registro" />
      </Suspense>
    </main>
  );
}
