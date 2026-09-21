import { FormularioCambiarClave } from "@/components/login/FormularioCambiarClave";

export const metadata = { title: "Nueva contraseña", robots: { index: false, follow: false } };

export default function PaginaCambiarClave() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <FormularioCambiarClave />
    </main>
  );
}
