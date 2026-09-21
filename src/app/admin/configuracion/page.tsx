import { FormConfiguracion } from "@/components/admin/FormConfiguracion";

export const metadata = { title: "Configuración", robots: { index: false, follow: false } };

export default function PaginaConfiguracion() {
  return <FormConfiguracion />;
}
