import { GestionCargos } from "@/components/admin/GestionCargos";

export const metadata = { title: "Cargos", robots: { index: false, follow: false } };

export default function PaginaCargos() {
  return <GestionCargos />;
}
