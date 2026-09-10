// Utilidades de fecha/hora en la zona horaria de Saboratto (America/Bogota) y formato es-CO.

export const ZONA = "America/Bogota";

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function formatoCOP(valor: number): string {
  return "$" + Math.round(valor).toLocaleString("es-CO");
}

/** Partes de una fecha vistas desde Bogotá */
export function partesBogota(fecha: Date | string) {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const p: Record<string, string> = {};
  for (const parte of fmt.formatToParts(d)) p[parte.type] = parte.value;
  const hora = Number(p.hour) % 24; // Intl puede devolver "24" a medianoche
  const dias = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    anio: Number(p.year),
    mes: Number(p.month),
    dia: Number(p.day),
    hora,
    minuto: Number(p.minute),
    diaSemana: dias.indexOf(p.weekday), // 0 = domingo
  };
}

/** 'YYYY-MM-DD' en Bogotá */
export function fechaISOBogota(fecha: Date | string = new Date()): string {
  const { anio, mes, dia } = partesBogota(fecha);
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** 'HH:MM' en Bogotá */
export function horaCorta(fecha: Date | string): string {
  const { hora, minuto } = partesBogota(fecha);
  return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}

/** 'h:MM a. m.' en Bogotá (para mostrar al personal) */
export function hora12(fecha: Date | string): string {
  return new Date(fecha).toLocaleTimeString("es-CO", {
    timeZone: ZONA,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function fechaLarga(fecha: Date | string): string {
  return new Date(fecha).toLocaleDateString("es-CO", {
    timeZone: ZONA,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function fechaCorta(fecha: Date | string): string {
  return new Date(fecha).toLocaleDateString("es-CO", {
    timeZone: ZONA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function nombreDiaSemana(indice: number): string {
  return DIAS_SEMANA[indice] ?? "";
}

/** Minutos enteros transcurridos entre dos instantes */
export function minutosEntre(desde: Date | string, hasta: Date | string = new Date()): number {
  const a = new Date(desde).getTime();
  const b = new Date(hasta).getTime();
  return Math.max(0, Math.floor((b - a) / 60000));
}

/** Suma días a una fecha 'YYYY-MM-DD' (sin zonas horarias) */
export function sumarDias(fechaISO: string, dias: number): string {
  const [y, m, d] = fechaISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + dias));
  return dt.toISOString().slice(0, 10);
}

/** Día de la semana (0 = domingo) de una fecha 'YYYY-MM-DD' */
export function diaSemanaDeISO(fechaISO: string): number {
  const [y, m, d] = fechaISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export type RangoClave = "hoy" | "ayer" | "semana" | "mes" | "personalizado";

export interface Rango {
  desde: string; // 'YYYY-MM-DD' inclusive
  hasta: string; // 'YYYY-MM-DD' inclusive
}

/** Rango de días de negocio (Bogotá) para los filtros del panel */
export function rangoPredefinido(clave: Exclude<RangoClave, "personalizado">, ahora: Date = new Date()): Rango {
  const hoy = fechaISOBogota(ahora);
  switch (clave) {
    case "hoy":
      return { desde: hoy, hasta: hoy };
    case "ayer": {
      const ayer = sumarDias(hoy, -1);
      return { desde: ayer, hasta: ayer };
    }
    case "semana": {
      // semana que empieza el lunes
      const dow = diaSemanaDeISO(hoy); // 0 dom ... 6 sáb
      const retroceso = dow === 0 ? 6 : dow - 1;
      return { desde: sumarDias(hoy, -retroceso), hasta: hoy };
    }
    case "mes":
      return { desde: hoy.slice(0, 8) + "01", hasta: hoy };
  }
}

/** Convierte un rango de días de negocio a límites timestamptz (ISO) en Bogotá */
export function limitesRango(rango: Rango): { desdeISO: string; hastaISO: string } {
  // Bogotá no tiene horario de verano: siempre UTC-5
  return {
    desdeISO: `${rango.desde}T00:00:00-05:00`,
    hastaISO: `${sumarDias(rango.hasta, 1)}T00:00:00-05:00`,
  };
}
