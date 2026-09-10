import { FormularioLogin } from "@/components/login/FormularioLogin";

export const metadata = { title: "Ingresar · Comandas Saboratto" };

export default function PaginaLogin() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <FormularioLogin emailPersonal={process.env.NEXT_PUBLIC_EMAIL_PERSONAL ?? "personal@saboratto.app"} />
    </main>
  );
}
