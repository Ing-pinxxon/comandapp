"use client";

/**
 * Sello de autoría — Inge Pinzón
 *
 * Port a TypeScript de react/SelloPinzon.jsx (github.com/Ing-pinxxon/sello).
 * Autocontenido: no necesita sello.js. Los estilos están en src/app/sello.css,
 * que importa globals.css.
 */
import { useEffect, useRef } from "react";
import { PERFIL_AUTOR as PERFIL } from "@/lib/sitio";

const ESPERA_QUIETO = 140; // ms sin scroll para dar por detenido al usuario
const TOPE_VISIBLE = 1200; // ms visible sin aquietarse tras los que vuela igual
const RED_SEGURIDAD = 3500; // ms para rescatar un observer que no reaccionó

export function SelloPinzon({ site = "web", className = "" }: { site?: string; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const sello = ref.current;
    if (!sello) return;

    // Preferencia del sistema: no se arma, así que el sello queda visible al
    // instante y sin movimiento.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    sello.classList.add("is-armed");

    let debounce: ReturnType<typeof setTimeout> | undefined;
    let tope: ReturnType<typeof setTimeout> | undefined;
    let hecho = false;

    const visible = () => {
      const r = sello.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };

    const limpiar = () => {
      clearTimeout(debounce);
      clearTimeout(tope);
      clearTimeout(redSeguridad);
      window.removeEventListener("scroll", alDetectar);
      io.disconnect();
    };

    const reveal = () => {
      if (hecho) return;
      hecho = true;
      limpiar();
      sello.classList.add("is-in");
    };

    // No se vuela en cuanto el sello asoma: eso ocurre con el pájaro pegado al
    // borde inferior y el usuario todavía deslizando con inercia, así que la
    // animación se consume antes de que el ojo llegue al pie.
    function alDetectar() {
      if (hecho || !visible()) return;
      clearTimeout(debounce);
      debounce = setTimeout(reveal, ESPERA_QUIETO);
      if (!tope) tope = setTimeout(reveal, TOPE_VISIBLE);
    }

    // En Safari iOS el IntersectionObserver entrega los callbacks de forma
    // irregular durante el scroll con inercia; este listener cubre ese hueco.
    window.addEventListener("scroll", alDetectar, { passive: true });

    const io = new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting) alDetectar();
    }, { threshold: 0.3 });

    // Solo rescata el caso que importa: el sello está a la vista y nada lo
    // reveló. Si disparara a ciegas, volaría con el pie fuera de pantalla.
    const redSeguridad = setTimeout(() => {
      if (visible()) reveal();
    }, RED_SEGURIDAD);

    io.observe(sello);

    return limpiar;
  }, []);

  const href = `${PERFIL}?utm_source=${encodeURIComponent(site)}&utm_medium=sello&utm_campaign=creditos`;

  return (
    <a
      ref={ref}
      className={`sello-pinzon ${className}`.trim()}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Sitio desarrollado por Inge Pinzón"
    >
      <span className="sello-bird">
        <svg viewBox="0 0 170 145" width="19" height="16" aria-hidden="true">
          <path
            d="M34 46 C34 24, 56 11, 76 22 C100 34, 112 56, 112 76 L160 116
               L150 124 L153 137 L96 96 C88 108, 66 113, 52 100 C38 89, 31 66, 34 48 Z"
            fill="currentColor"
          />
          <path d="M35 36 L2 46 L35 56 Z" fill="currentColor" />
        </svg>
      </span>
      <span>
        Hecho por <strong>Inge Pinzón</strong>
      </span>
    </a>
  );
}
