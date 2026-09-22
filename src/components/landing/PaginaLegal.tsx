import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logotipo } from "@/components/ui/Logotipo";
import { SelloPinzon } from "@/components/landing/SelloPinzon";
import { WHATSAPP_VENTAS_BONITO, urlWhatsAppVentas } from "@/lib/sitio";

/** Marco común de las páginas legales: cabecera, texto legible y pie. */
export function PaginaLegal({ titulo, actualizado, children }: { titulo: string; actualizado: string; children: React.ReactNode }) {
  return (
    <main className="flex-1">
      <header className="border-b border-borde">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4">
          <Link href="/" className="btn bg-panel-2 px-3" aria-label="Volver al inicio">
            <ArrowLeft className="size-5" />
          </Link>
          <Logotipo />
        </div>
      </header>

      <article className="mx-auto max-w-3xl space-y-4 px-5 py-8 leading-relaxed">
        <h1 className="text-3xl font-black">{titulo}</h1>
        <p className="text-sm text-texto-suave">Última actualización: {actualizado}</p>
        {children}
        <section className="tarjeta mt-8 p-4">
          <h2 className="text-lg font-extrabold">¿Dudas con esto?</h2>
          <p className="mt-1 text-texto-suave">
            Escríbenos por WhatsApp al{" "}
            <a href={urlWhatsAppVentas("Hola, tengo una duda sobre el manejo de datos en Comandapp.")} target="_blank" rel="noopener noreferrer" className="font-bold underline">
              {WHATSAPP_VENTAS_BONITO}
            </a>
            . Respondemos en horario laboral colombiano.
          </p>
        </section>
      </article>

      <footer className="border-t border-borde py-6 text-center text-sm text-texto-suave">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-5">
          <span>© {new Date().getFullYear()} Comandapp</span>
          <Link href="/" className="underline">Inicio</Link>
          <Link href="/privacidad" className="underline">Privacidad</Link>
          <Link href="/terminos" className="underline">Términos</Link>
        </div>
        <div className="mt-3">
          <SelloPinzon site="comandapp" className="[--sello-color-hover:var(--color-marca-oscuro)]" />
        </div>
      </footer>
    </main>
  );
}

/** Título de sección dentro de una página legal */
export function Apartado({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 pt-4">
      <h2 className="text-xl font-extrabold">{titulo}</h2>
      {children}
    </section>
  );
}
