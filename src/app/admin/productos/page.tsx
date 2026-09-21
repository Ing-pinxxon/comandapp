import { GestionProductos } from "@/components/admin/GestionProductos";

export const metadata = { title: "Menú", robots: { index: false, follow: false } };

export default function PaginaProductos() {
  return <GestionProductos />;
}
