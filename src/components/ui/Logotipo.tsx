import Link from "next/link";

/** Logotipo de Comandapp: recuadro negro con el nombre. `claro` invierte los colores para fondos oscuros. */
export function Logotipo({ className = "", claro = false, enlace = false }: { className?: string; claro?: boolean; enlace?: boolean }) {
  const contenido = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`flex size-9 items-center justify-center rounded-xl ${claro ? "bg-marca text-black" : "bg-negro text-marca"}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10h16" />
          <path d="M5 10a7 7 0 0 1 14 0" />
          <path d="M4 14h16" />
          <path d="M5 14v1a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-1" />
        </svg>
      </span>
      <span className={`text-xl font-black tracking-tight ${claro ? "text-white" : "text-texto"}`}>Comandapp</span>
    </span>
  );
  return enlace ? <Link href="/">{contenido}</Link> : contenido;
}
