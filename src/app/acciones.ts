"use server";

// Server Actions que escriben las cookies del dispositivo:
// qué negocio se está usando y qué empleado escribió su PIN.

import { cookies } from "next/headers";
import { COOKIE_EMPLEADO, COOKIE_NEGOCIO } from "@/lib/catalogo";

const UN_ANIO = 60 * 60 * 24 * 365;

export async function elegirNegocio(negocioId: string): Promise<void> {
  const almacen = await cookies();
  almacen.set(COOKIE_NEGOCIO, negocioId, { path: "/", maxAge: UN_ANIO, sameSite: "lax", httpOnly: true });
  almacen.delete(COOKIE_EMPLEADO);
}

export async function guardarEmpleadoActual(negocioId: string, empleado: { id: string; nombre: string; es_dueno: boolean }): Promise<void> {
  const almacen = await cookies();
  const valor = JSON.stringify({ ...empleado, negocio_id: negocioId, desde: new Date().toISOString() });
  almacen.set(COOKIE_EMPLEADO, valor, { path: "/", maxAge: 60 * 60 * 24, sameSite: "lax", httpOnly: true });
}

export async function cerrarEmpleado(): Promise<void> {
  (await cookies()).delete(COOKIE_EMPLEADO);
}
