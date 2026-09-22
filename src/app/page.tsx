import Link from "next/link";
import { ArrowRight, BarChart3, Camera, Check, Clock, MessageCircle, PlayCircle, Smartphone, UsersRound } from "lucide-react";
import { DESCRIPCION_SITIO, PALABRAS_CLAVE, PERFIL_AUTOR, TITULO_SITIO, WHATSAPP_VENTAS, WHATSAPP_VENTAS_BONITO, sitioUrl, urlWhatsAppVentas } from "@/lib/sitio";
import { INCLUYE_PLAN, PREGUNTAS } from "@/components/landing/contenido";
import { BotonWhatsApp } from "@/components/landing/BotonWhatsApp";
import { SelloPinzon } from "@/components/landing/SelloPinzon";
import { Logotipo } from "@/components/ui/Logotipo";

export const metadata = {
  title: TITULO_SITIO,
  description: DESCRIPCION_SITIO,
  keywords: PALABRAS_CLAVE,
  alternates: { canonical: "/" },
};

const PASOS = [
  { Icono: Camera, titulo: "Sube una foto de tu carta", texto: "La inteligencia artificial lee los productos y precios. Tú revisas y listo." },
  { Icono: UsersRound, titulo: "Crea tu equipo con PIN", texto: "Cada empleado entra con su PIN en la tablet. Sabes quién tomó cada pedido." },
  { Icono: Smartphone, titulo: "Toma pedidos y despacha", texto: "La cola se pone verde, amarilla o naranja según el tiempo. Nada se te pasa." },
];

const BENEFICIOS = [
  { Icono: Clock, titulo: "Semáforo de tiempos en cocina", texto: "Cada pedido muestra los minutos que lleva. Verde, amarillo, naranja: la cocina sabe qué va primero y ningún cliente espera de más." },
  { Icono: MessageCircle, titulo: "Avisos por WhatsApp", texto: "Con un toque le dices al cliente que su pedido está listo o va en camino. Si tienes un bot de pedidos, sus comandas entran solas a la cola." },
  { Icono: BarChart3, titulo: "Sabes qué vendes y cuánto ganas", texto: "Ventas por día, horas pico, productos más vendidos, clientes frecuentes y la ganancia real si cargas tus costos. Todo exportable a Excel." },
  { Icono: Check, titulo: "Domicilio y empaque automáticos", texto: "Configura tus propios cargos: domicilio, empaque, propina o combos. El total sale bien sin que nadie tenga que calcular nada." },
];

export default function Inicio() {
  const base = sitioUrl();

  // Datos estructurados: así Google entiende qué es Comandapp y puede mostrar
  // las preguntas frecuentes desplegadas en los resultados de búsqueda.
  const datosEstructurados = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Comandapp",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: base,
        description: DESCRIPCION_SITIO,
        inLanguage: "es",
        offers: { "@type": "Offer", price: "0", priceCurrency: "COP", description: "Gratis durante el lanzamiento" },
        author: { "@type": "Person", name: "Inge Pinzón", url: PERFIL_AUTOR },
        // El teléfono aquí es lo que puede aparecer como contacto en los resultados
        provider: {
          "@type": "Person",
          name: "Inge Pinzón",
          telephone: `+${WHATSAPP_VENTAS}`,
          url: PERFIL_AUTOR,
          contactPoint: { "@type": "ContactPoint", contactType: "ventas", telephone: `+${WHATSAPP_VENTAS}`, areaServed: "CO", availableLanguage: "es" },
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: PREGUNTAS.map((p) => ({
          "@type": "Question",
          name: p.pregunta,
          acceptedAnswer: { "@type": "Answer", text: p.respuesta },
        })),
      },
    ],
  };

  return (
    <main className="flex-1">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }} />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Logotipo />
        <nav className="flex items-center gap-2">
          <Link href="/demo" className="btn min-h-10 bg-transparent px-3 text-texto-suave">Ver demo</Link>
          <Link href="/login" className="btn min-h-10 bg-transparent px-3 text-texto-suave">Iniciar sesión</Link>
          <Link href="/registro" className="btn min-h-10 bg-negro px-4 text-white">Crear cuenta gratis</Link>
        </nav>
      </header>

      {/* ===== Portada ===== */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <span className="inline-block rounded-full bg-marca/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-marca-oscuro">
            Para restaurantes, comidas rápidas y domicilios
          </span>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Tus pedidos en orden. <span className="text-marca-oscuro">Tu cocina a tiempo.</span>
          </h1>
          <p className="mt-4 text-lg text-texto-suave">
            Comandapp es el sistema de comandas para tu tablet: toma pedidos, míralos en cocina con semáforo de tiempos, avisa al cliente por
            WhatsApp y descubre qué es lo que más vendes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/registro" className="btn bg-marca px-6 text-lg text-black">Empezar gratis <ArrowRight className="size-5" /></Link>
            <Link href="/demo" className="btn bg-panel px-6 text-lg"><PlayCircle className="size-5" /> Ver cómo funciona</Link>
          </div>
          <p className="mt-3 text-sm text-texto-suave">Sin tarjeta y sin instalar nada. La demo no pide registro.</p>
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

      {/* ===== Tres pasos ===== */}
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
          <div className="mt-8 text-center">
            <Link href="/demo" className="btn bg-marca px-6 text-lg text-black">
              <PlayCircle className="size-5" /> Probar la demo, sin registro
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Beneficios ===== */}
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
      </section>

      {/* ===== Precio ===== */}
      <section id="precio" className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-center text-3xl font-black">Cuánto cuesta</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-texto-suave">
          Estamos empezando y queremos que lo uses de verdad antes de cobrarte.
        </p>
        <div className="mx-auto mt-8 max-w-md">
          <div className="tarjeta border-2 border-marca p-6 text-center">
            <span className="inline-block rounded-full bg-marca px-3 py-1 text-xs font-black uppercase tracking-wide text-black">Lanzamiento</span>
            <div className="mt-4 text-5xl font-black">Gratis</div>
            <p className="mt-2 text-texto-suave">Sin tarjeta, sin límite de pedidos y sin letra pequeña.</p>
            <ul className="mt-6 space-y-2 text-left">
              {INCLUYE_PLAN.map((linea) => (
                <li key={linea} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-5 shrink-0 text-ok" />
                  <span>{linea}</span>
                </li>
              ))}
            </ul>
            <Link href="/registro" className="btn mt-6 w-full bg-negro text-lg text-white">
              Crear mi cuenta <ArrowRight className="size-5" />
            </Link>
            <p className="mt-3 text-xs text-texto-suave">
              Cuando empecemos a cobrar te avisamos con un mes de anticipación. Tus datos siguen siendo tuyos.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Preguntas frecuentes ===== */}
      <section id="preguntas" className="mx-auto max-w-3xl px-5 py-14">
        <h2 className="text-center text-3xl font-black">Preguntas frecuentes</h2>
        <div className="mt-8 space-y-3">
          {PREGUNTAS.map((p) => (
            <details key={p.pregunta} className="tarjeta group p-4">
              <summary className="cursor-pointer list-none text-lg font-extrabold marker:content-none">
                <span className="flex items-center justify-between gap-3">
                  {p.pregunta}
                  <span className="shrink-0 text-2xl font-black text-marca-oscuro transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-texto-suave">{p.respuesta}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ===== Cierre ===== */}
      <section className="bg-negro py-14 text-white">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-black">Empieza hoy, te toma cinco minutos</h2>
          <p className="mt-3 text-white/70">Crea tu cuenta, sube una foto de tu carta y esta misma noche estás tomando pedidos en la tablet.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/registro" className="btn bg-marca px-8 text-lg text-black">Crear cuenta gratis <ArrowRight className="size-5" /></Link>
            <Link href="/demo" className="btn bg-white/10 px-6 text-lg text-white">Ver la demo primero</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-borde py-6 text-center text-sm text-texto-suave">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-5">
          <span>© {new Date().getFullYear()} Comandapp</span>
          <Link href="/demo" className="underline">Demo</Link>
          <Link href="#precio" className="underline">Precio</Link>
          <Link href="#preguntas" className="underline">Preguntas</Link>
          <Link href="/login" className="underline">Iniciar sesión</Link>
          <a href={urlWhatsAppVentas()} target="_blank" rel="noopener noreferrer" className="underline">
            WhatsApp {WHATSAPP_VENTAS_BONITO}
          </a>
          <span>Hecho en Colombia</span>
        </div>
        <div className="mt-3">
          <SelloPinzon site="comandapp" className="[--sello-color-hover:var(--color-marca-oscuro)]" />
        </div>
      </footer>

      <BotonWhatsApp />
    </main>
  );
}
