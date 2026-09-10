"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BarChart3, ClipboardList, Package, Settings, Users } from "lucide-react";

const ENLACES = [
  { href: "/admin", etiqueta: "Resumen", Icono: BarChart3 },
  { href: "/admin/pedidos", etiqueta: "Pedidos", Icono: ClipboardList },
  { href: "/admin/clientes", etiqueta: "Clientes", Icono: Users },
  { href: "/admin/productos", etiqueta: "Productos", Icono: Package },
  { href: "/admin/configuracion", etiqueta: "Configuración", Icono: Settings },
];

export function NavAdmin() {
  const ruta = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col">
      {ENLACES.map(({ href, etiqueta, Icono }) => {
        const activo = ruta === href;
        // conserva el rango de fechas al cambiar de sección
        const destino = query && href !== "/admin/productos" && href !== "/admin/configuracion" ? `${href}?${query}` : href;
        return (
          <Link key={href} href={destino} className={`btn shrink-0 justify-start px-3 ${activo ? "bg-marca text-black" : "bg-transparent text-texto-suave hover:bg-panel-2"}`}>
            <Icono className="size-5" /> {etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
