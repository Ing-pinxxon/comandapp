/**
 * tour.ts — Tutorial guiado mínimo, sin dependencias.
 * Port a TypeScript del tour.js original, con los colores de Comandapp.
 *
 * Uso:
 *   const tour = createTour({
 *     storageKey: "comandapp_demo_v1",
 *     steps: [
 *       { el: "#menu", title: "Menú", text: "Aquí están los productos." },
 *       { el: "[data-tour=agregar]", title: "Agrega uno", text: "Toca Agregar.",
 *         await: "demo:producto", hint: "Te espero..." },
 *     ],
 *     onEnd: (completado) => {},
 *   });
 *   tour.startIfFirstTime();
 *
 * En la app, para un paso interactivo:
 *   document.dispatchEvent(new CustomEvent("demo:producto"));
 */

export interface PasoTour {
  /** Selector CSS del elemento a resaltar */
  el: string;
  title: string;
  text: string;
  /** Si viene, el paso avanza cuando la app dispara ese evento en `document` */
  await?: string;
  /** Texto de ayuda mientras se espera la acción */
  hint?: string;
}

export interface OpcionesTour {
  steps: PasoTour[];
  storageKey?: string;
  padding?: number;
  onEnd?: (completado: boolean) => void;
}

export interface Tour {
  start: (desde?: number) => void;
  end: () => void;
  startIfFirstTime: (retraso?: number) => void;
  reset: () => void;
  refresh: () => void;
  activo: () => boolean;
}

const CSS = `
.tour-spot{position:absolute;z-index:9998;border-radius:14px;pointer-events:none;
  box-shadow:0 0 0 9999px var(--tour-overlay,rgba(17,17,17,.72)),0 0 0 3px var(--tour-accent,#d9a833);
  transition:top .2s,left .2s,width .2s,height .2s}
.tour-block{position:fixed;inset:0;z-index:9997}
.tour-pop{position:absolute;z-index:9999;width:min(320px,calc(100vw - 32px));
  background:var(--tour-bg,#fff);color:var(--tour-text,#141414);border-radius:16px;
  padding:16px 18px 14px;box-shadow:0 18px 40px -16px rgba(17,17,17,.6);font:14px/1.5 system-ui,sans-serif}
.tour-pop .t-step{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
  color:var(--tour-accent-dark,#9a7318);margin:0 0 4px}
.tour-pop .t-title{font-size:17px;font-weight:800;margin:0 0 6px}
.tour-pop .t-text{margin:0 0 12px;color:var(--tour-muted,#6b6760)}
.tour-pop .t-hint{margin:-4px 0 10px;font-size:12px;font-weight:700;color:#15803d}
.tour-pop .t-actions{display:flex;gap:8px;align-items:center}
.tour-pop button{font:700 13px system-ui,sans-serif;border-radius:10px;padding:8px 14px;cursor:pointer}
.tour-pop .t-skip{margin-right:auto;border:0;background:none;color:var(--tour-muted,#6b6760);padding-left:0}
.tour-pop .t-prev{border:1px solid var(--tour-border,#e6e0d2);background:none;color:inherit}
.tour-pop .t-next{border:0;background:var(--tour-accent,#d9a833);color:#111}
@media (prefers-reduced-motion:reduce){.tour-spot{transition:none}}`;

export function createTour({ steps, storageKey = "tour_visto", padding = 8, onEnd }: OpcionesTour): Tour {
  let idx = 0;
  let active = false;
  let waiting: { ev: string; fn: () => void } | null = null;
  // Arranque programado por startIfFirstTime; se cancela al terminar para que
  // un recorrido que ya se cerró (o un remontaje de React) no lo reviva.
  let arranque: ReturnType<typeof setTimeout> | null = null;
  let spot: HTMLDivElement;
  let pop: HTMLDivElement;
  let block: HTMLDivElement;

  // ---- construir DOM una sola vez ----
  function build() {
    if (!document.getElementById("tour-css")) {
      const s = document.createElement("style");
      s.id = "tour-css";
      s.textContent = CSS;
      document.head.appendChild(s);
    }
    block = document.createElement("div"); // bloquea clics fuera
    block.className = "tour-block";
    spot = document.createElement("div");
    spot.className = "tour-spot";
    pop = document.createElement("div");
    pop.className = "tour-pop";
    pop.setAttribute("role", "dialog");
    pop.innerHTML = `
      <p class="t-step"></p><p class="t-title"></p><p class="t-text"></p>
      <p class="t-hint" hidden></p>
      <div class="t-actions">
        <button type="button" class="t-skip">Saltar</button>
        <button type="button" class="t-prev">Atrás</button>
        <button type="button" class="t-next">Siguiente</button>
      </div>`;
    $(".t-skip").onclick = () => end(false);
    $(".t-prev").onclick = () => go(idx - 1);
    $(".t-next").onclick = () => go(idx + 1);
  }

  const $ = (sel: string) => pop.querySelector(sel) as HTMLElement;

  // ---- ir a un paso ----
  function go(n: number) {
    clearWait();
    if (n >= steps.length) return end(true);
    if (n < 0) return;
    idx = n;
    const s = steps[idx];
    const el = document.querySelector(s.el);
    if (!el) return go(n + 1); // si el elemento no existe, lo salta

    $(".t-step").textContent = `Paso ${idx + 1} de ${steps.length}`;
    $(".t-title").textContent = s.title;
    $(".t-text").textContent = s.text;
    $(".t-hint").textContent = s.hint || "";
    $(".t-hint").hidden = !s.hint;
    $(".t-prev").hidden = idx === 0;
    $(".t-next").hidden = Boolean(s.await);
    $(".t-next").textContent = idx === steps.length - 1 ? "Listo" : "Siguiente";

    // en pasos interactivos quitamos el bloqueo para que el usuario pueda tocar el elemento
    block.style.pointerEvents = s.await ? "none" : "auto";

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(place, 320); // espera a que termine el scroll

    if (s.await) {
      const fn = () => go(idx + 1);
      document.addEventListener(s.await, fn, { once: true });
      waiting = { ev: s.await, fn };
    }
    $(".t-next").focus?.();
  }

  // ---- posicionar hueco y globo ----
  function place() {
    if (!active) return;
    const el = document.querySelector(steps[idx].el);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const sx = window.scrollX;
    const sy = window.scrollY;

    Object.assign(spot.style, {
      top: r.top + sy - padding + "px",
      left: r.left + sx - padding + "px",
      width: r.width + padding * 2 + "px",
      height: r.height + padding * 2 + "px",
    });

    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    const gap = 14;
    const m = 16;
    const cabeAbajo = r.bottom + gap + ph < window.innerHeight;
    let top = cabeAbajo ? r.bottom + sy + gap : r.top + sy - ph - gap;
    let left = r.left + sx + r.width / 2 - pw / 2;
    left = Math.max(sx + m, Math.min(left, sx + window.innerWidth - pw - m));
    top = Math.max(sy + m, top);
    pop.style.top = top + "px";
    pop.style.left = left + "px";
  }

  function clearWait() {
    if (waiting) {
      document.removeEventListener(waiting.ev, waiting.fn);
      waiting = null;
    }
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") end(false);
    if (e.key === "ArrowRight" && !steps[idx].await) go(idx + 1);
    if (e.key === "ArrowLeft") go(idx - 1);
  }

  // ---- API pública ----
  function start(from = 0) {
    if (typeof document === "undefined") return;
    if (!spot!) build();
    if (!active) {
      document.body.append(block, spot, pop);
      window.addEventListener("resize", place);
      window.addEventListener("scroll", place, { passive: true });
      document.addEventListener("keydown", onKey);
      active = true;
    }
    go(from);
  }

  function end(completado: boolean) {
    clearWait();
    if (arranque) {
      clearTimeout(arranque);
      arranque = null;
    }
    if (!active) return;
    block.remove();
    spot.remove();
    pop.remove();
    window.removeEventListener("resize", place);
    window.removeEventListener("scroll", place);
    document.removeEventListener("keydown", onKey);
    active = false;
    try {
      localStorage.setItem(storageKey, "1");
    } catch {}
    onEnd?.(completado);
  }

  function startIfFirstTime(delay = 500) {
    let visto = false;
    try {
      visto = localStorage.getItem(storageKey) === "1";
    } catch {}
    if (!visto) arranque = setTimeout(() => start(), delay);
  }

  function reset() {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }

  return { start, end: () => end(false), startIfFirstTime, reset, refresh: place, activo: () => active };
}
