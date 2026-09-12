import { Suspense } from "react";
import { FormularioAcceso } from "@/components/login/FormularioAcceso";

export const metadata = { title: "Iniciar sesión · Comandapp" };

export default function PaginaLogin() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Suspense>
        <FormularioAcceso modo="login" />
      </Suspense>
    </main>
  );
}
