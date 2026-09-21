import { MessageCircle } from "lucide-react";
import { urlWhatsAppVentas } from "@/lib/sitio";

/** Botón flotante para escribirle a ventas por WhatsApp */
export function BotonWhatsApp() {
  return (
    <a
      href={urlWhatsAppVentas()}
      target="_blank"
      rel="noopener"
      className="btn fixed bottom-5 right-5 z-40 bg-whatsapp px-4 text-black shadow-lg sm:px-5"
      aria-label="Escribirnos por WhatsApp"
    >
      <MessageCircle className="size-6" />
      <span className="hidden sm:inline">Escríbenos</span>
    </a>
  );
}
