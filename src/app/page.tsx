import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Camera, Check, Clock, MessageCircle, Smartphone, UsersRound, BarChart3 } from "lucide-react";
import { sesionActual } from "@/lib/supabase/server";
import { Logotipo } from "@/components/ui/Logotipo";

export const metadata = {
  title: "Comandapp · Comandas y cola de pedidos para tu negocio de comida",
  description: "Toma pedidos en la tablet, míralos en cocina con semáforo de tiempo y conoce qué vendes. Sube una foto de tu carta y la IA arma tu menú.",
};
export const dynamic = "force-dynamic";

const PASOS = [
  { Icono: Camera, titulo: "Sube una foto de tu carta", texto: "La IA lee los productos y precios. Tú revisas y listo." },
  { Icono: UsersRound, titulo: "Crea tu equipo con PIN", texto: "Cada empleado entra con su PIN en la tablet. Sabes quién tomó cada pedido." },
  { Icono: Smartphone, titulo: "Toma pedidos y despacha", texto: "La cola se pone verde, amarilla o naranja según el tiempo. Nada se te pasa." },
];

const BENEFICIOS = [
  { Icono: Clock, titulo: "Semáforo de tiempos", texto: "Cada pedido muestra los minutos que lleva. Verde, amarillo, naranja: la cocina sabe qué va primero." },
  { Icono: MessageCircle, titulo: "WhatsApp con un toque", texto: "Avisa al cliente que su pedido está listo o va en camino con un mensaje prearmado." },
  { Icono: BarChart3, titulo: "Sabes qué vendes", texto: "Ventas por día, horas pico, productos más vendidos, clientes frecuentes y exportación a Excel." },
  { Icono: Check, titulo: "Cargos a tu medida", texto: "Domicilio, empaque, propina, combos. Tú defines qué se cobra y cuándo." },
];

export default async function Inicio() {
  if (await sesionActual()) redirect("/comandas");

  return (
    <main className="flex-1">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Logotipo />
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn min-h-10 bg-transparent px-3 text-texto-suave">Iniciar sesión</Link>
          <Link href="/registro" className="btn min-h-10 bg-negro px-4 text-white">Crear cuenta gratis</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <span className="inline-block rounded-full bg-marca/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-marca-oscuro">Para restaurantes y comidas rápidas</span>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Tus pedidos en orden. <span className="text-marca-oscuro">Tu cocina a tiempo.</span>
          </h1>
          <p className="mt-4 text-lg text-texto-suave">
            Comandapp es la pantalla de comandas para tu tablet: toma pedidos, míralos en cocina con semáforo de tiempo, avisa al cliente por WhatsApp y descubre qué es lo que más vendes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/registro" className="btn bg-marca px-6 text-lg text-black">Empezar gratis <ArrowRight className="size-5" /></Link>
            <Link href="/login" className="btn bg-panel px-6 text-lg">Ya tengo cuenta</Link>
          </div>
          <p className="mt-3 text-sm text-texto-suave">Sin tarjeta. Tu negocio queda listo en menos de cinco minutos.</p>
        </div>

        {/* Ilustración de la cola */}
        <div className="tarjeta p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-black">Cola de pedidos</span>
            <span className="rounded-full bg-marca/20 px-2 py-0.5 text-xs font-bold text-marca-oscuro">EN COLA 3</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { n: 12, min: 27, color: "border-semaforo-naranja", badge: "bg-semaforo-naranja", etiqueta: "URGENTE", cliente: "Carlos", items: ["2 Hamburguesa ranchera", "1 Gaseosa"] },
              { n: 13, min: 18, color: "border-semaforo-amarillo", badge: "bg-semaforo-amarillo", etiqueta: "ATENCIÓN", cliente: "Ana", items: ["1 Perro especial", "Sin cebolla"] },
              { n: 14, min: 4, color: "border-semaforo-verde", badge: "bg-semaforo-verde", etiqueta: "A TIEMPO", cliente: "Laura", items: ["1 Salchipapa", "1 Jugo"] },
            ].map((t) => (
              <div key={t.n} className={`rounded-2xl border-2 bg-panel p-3 ${t.color}`}>
                <div className="flex items-start justify-between">
                  <span className="text-xl font-black">#{t.n}</span>
                  <span className="text-right">
                    <span className="block text-2xl font-black leading-none">{t.min}<span className="text-xs text-texto-suave"> min</span></span>
                    <span className={`mt-1 inline-block rounded-full px-1.5 text-[10px] font-extrabold text-black ${t.badge}`}>{t.etiqueta}</span>
                  </span>
                </div>
                <div className="mt-2 text-sm font-bold">{t.cliente}</div>
                <ul className="mt-1 space-y-0.5 text-xs text-texto-suave">
                  {t.items.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-negro py-14 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-3xl font-black">Listo en tres pasos</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {PASOS.map(({ Icono, titulo, texto }, i) => (
              <div key={titulo} className="rounded-2xl bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-marca text-black"><Icono className="size-5" /></span>
                  <span className="text-sm font-bold text-marca">Paso {i + 1}</span>
                </div>
                <h3 className="mt-3 text-lg font-extrabold">{titulo}</h3>
                <p className="mt-1 text-sm text-white/70">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-center text-3xl font-black">Todo lo que necesita tu operación</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {BENEFICIOS.map(({ Icono, titulo, texto }) => (
            <div key={titulo} className="tarjeta flex gap-4 p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-marca/20 text-marca-oscuro"><Icono className="size-5" /></span>
              <div>
                <h3 className="text-lg font-extrabold">{titulo}</h3>
                <p className="mt-1 text-sm text-texto-suave">{texto}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/registro" className="btn bg-negro px-8 text-lg text-white">Crear mi cuenta <ArrowRight className="size-5" /></Link>
        </div>
      </section>

      <footer className="border-t border-borde py-6 text-center text-sm text-texto-suave">
        © {new Date().getFullYear()} Comandapp · Hecho en Colombia
      </footer>
    </main>
  );
}
