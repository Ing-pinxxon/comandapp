"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BarChart3, ClipboardList, Package, Settings, SlidersHorizontal, Store, Users, UsersRound } from "lucide-react";

const ENLACES = [
  { href: "/admin", etiqueta: "Resumen", Icono: BarChart3, conRango: true },
  { href: "/admin/pedidos", etiqueta: "Pedidos", Icono: ClipboardList, conRango: true },
  { href: "/admin/clientes", etiqueta: "Clientes", Icono: Users, conRango: true },
  { href: "/admin/productos", etiqueta: "Menú", Icono: Package, conRango: false },
  { href: "/admin/cargos", etiqueta: "Cargos", Icono: SlidersHorizontal, conRango: false },
  { href: "/admin/equipo", etiqueta: "Equipo", Icono: UsersRound, conRango: false },
  { href: "/admin/negocio", etiqueta: "Mi negocio", Icono: Store, conRango: false },
  { href: "/admin/configuracion", etiqueta: "Configuración", Icono: Settings, conRango: false },
];

export function NavAdmin() {
  const ruta = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col">
      {ENLACES.map(({ href, etiqueta, Icono, conRango }) => {
        const activo = ruta === href || (href !== "/admin" && ruta.startsWith(href + "/"));
        // conserva el rango de fechas al cambiar entre secciones con filtro
        const destino = query && conRango ? `${href}?${query}` : href;
        return (
          <Link key={href} href={destino} className={`btn shrink-0 justify-start px-3 ${activo ? "bg-marca text-black" : "bg-transparent text-white/75 hover:bg-white/10 hover:text-white"}`}>
            <Icono className="size-5" /> {etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
