import { GestionEquipo } from "@/components/admin/GestionEquipo";

export const metadata = { title: "Equipo", robots: { index: false, follow: false } };

export default function PaginaEquipo() {
  return <GestionEquipo />;
}
