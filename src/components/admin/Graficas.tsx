"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Serie, SerieDoble } from "@/lib/analitica";
import { formatoCOP } from "@/lib/fechas";

const COLORES = ["#f97316", "#22c55e", "#3b82f6", "#facc15", "#a855f7", "#ec4899", "#14b8a6", "#f43f5e", "#84cc16", "#64748b"];
const EJE = { stroke: "#71717a", fontSize: 12 };
const TOOLTIP = { contentStyle: { background: "#18181b", border: "1px solid #2e2e33", borderRadius: 12, color: "#f4f4f5" }, labelStyle: { color: "#a1a1aa" } };

export function Panel({ titulo, children, vacio }: { titulo: string; children: React.ReactNode; vacio?: boolean }) {
  return (
    <section className="tarjeta p-4">
      <h3 className="mb-3 text-base font-extrabold">{titulo}</h3>
      {vacio ? <p className="py-10 text-center text-texto-suave">Sin datos en este rango.</p> : <div className="h-64">{children}</div>}
    </section>
  );
}

const fmtCOP = (v: number) => formatoCOP(v);
const fmtMiles = (v: number) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`);

export function GraficaVentasPorDia({ datos }: { datos: SerieDoble[] }) {
  return (
    <Panel titulo="Ventas por día" vacio={datos.length === 0}>
      <ResponsiveContainer>
        <LineChart data={datos} margin={{ left: 8, right: 8, top: 8 }}>
          <CartesianGrid stroke="#2e2e33" vertical={false} />
          <XAxis dataKey="etiqueta" tick={EJE} tickFormatter={(v: string) => v.slice(5)} />
          <YAxis yAxisId="ventas" tick={EJE} tickFormatter={fmtMiles} width={52} />
          <YAxis yAxisId="pedidos" orientation="right" tick={EJE} width={32} allowDecimals={false} />
          <Tooltip {...TOOLTIP} formatter={(v, n) => (n === "Ventas" ? fmtCOP(Number(v)) : v)} />
          <Legend />
          <Line yAxisId="ventas" type="monotone" dataKey="ventas" name="Ventas" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} />
          <Line yAxisId="pedidos" type="monotone" dataKey="pedidos" name="Pedidos" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </Panel>
  );
}

export function GraficaBarrasDoble({ titulo, datos, claveValor = "pedidos", esDinero = false }: { titulo: string; datos: SerieDoble[]; claveValor?: "pedidos" | "ventas"; esDinero?: boolean }) {
  const vacio = datos.every((d) => d.pedidos === 0);
  return (
    <Panel titulo={titulo} vacio={vacio}>
      <ResponsiveContainer>
        <BarChart data={datos} margin={{ left: 8, right: 8, top: 8 }}>
          <CartesianGrid stroke="#2e2e33" vertical={false} />
          <XAxis dataKey="etiqueta" tick={EJE} interval={0} tickFormatter={(v: string) => v.slice(0, 3)} />
          <YAxis tick={EJE} width={esDinero ? 52 : 32} allowDecimals={false} tickFormatter={esDinero ? fmtMiles : undefined} />
          <Tooltip {...TOOLTIP} formatter={(v, n) => (n === "Ventas" ? fmtCOP(Number(v)) : v)} />
          <Bar dataKey={claveValor} name={claveValor === "ventas" ? "Ventas" : "Pedidos"} fill="#f97316" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

export function GraficaBarrasSimple({ titulo, datos, color = "#22c55e", sufijo = "", horizontal = false }: { titulo: string; datos: Serie[]; color?: string; sufijo?: string; horizontal?: boolean }) {
  return (
    <Panel titulo={titulo} vacio={datos.length === 0}>
      <ResponsiveContainer>
        {horizontal ? (
          <BarChart data={datos} layout="vertical" margin={{ left: 8, right: 24, top: 4 }}>
            <CartesianGrid stroke="#2e2e33" horizontal={false} />
            <XAxis type="number" tick={EJE} allowDecimals={false} />
            <YAxis type="category" dataKey="etiqueta" tick={EJE} width={130} />
            <Tooltip {...TOOLTIP} formatter={(v) => `${v}${sufijo}`} />
            <Bar dataKey="valor" name="Cantidad" fill={color} radius={[0, 8, 8, 0]} />
          </BarChart>
        ) : (
          <BarChart data={datos} margin={{ left: 8, right: 8, top: 8 }}>
            <CartesianGrid stroke="#2e2e33" vertical={false} />
            <XAxis dataKey="etiqueta" tick={EJE} interval={0} />
            <YAxis tick={EJE} width={32} allowDecimals={false} />
            <Tooltip {...TOOLTIP} formatter={(v) => `${v}${sufijo}`} />
            <Bar dataKey="valor" name="Valor" fill={color} radius={[8, 8, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </Panel>
  );
}

export function GraficaTorta({ titulo, datos, esDinero = false }: { titulo: string; datos: Serie[] | SerieDoble[]; esDinero?: boolean }) {
  const filas = datos.map((d) => ({ etiqueta: d.etiqueta, valor: "valor" in d ? d.valor : esDinero ? d.ventas : d.pedidos }));
  const vacio = filas.every((f) => f.valor === 0);
  return (
    <Panel titulo={titulo} vacio={vacio}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={filas} dataKey="valor" nameKey="etiqueta" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="none" label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}>
            {filas.map((_, i) => (
              <Cell key={i} fill={COLORES[i % COLORES.length]} />
            ))}
          </Pie>
          <Tooltip {...TOOLTIP} formatter={(v) => (esDinero ? fmtCOP(Number(v)) : v)} />
        </PieChart>
      </ResponsiveContainer>
    </Panel>
  );
}
