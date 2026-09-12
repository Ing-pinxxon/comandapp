import { FormularioCambiarClave } from "@/components/login/FormularioCambiarClave";

export const metadata = { title: "Nueva contraseña · Comandapp" };

export default function PaginaCambiarClave() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <FormularioCambiarClave />
    </main>
  );
}
