import { Suspense } from "react";
import { FormularioAcceso } from "@/components/login/FormularioAcceso";

export const metadata = { title: "Recuperar contraseña · Comandapp" };

export default function PaginaRecuperar() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Suspense>
        <FormularioAcceso modo="recuperar" />
      </Suspense>
    </main>
  );
}
