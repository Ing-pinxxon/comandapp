import { afterEach, describe, expect, it, vi } from "vitest";
import { enDireccionPrincipal, rutaInterna } from "./sitio";

function enProduccion(principal: string) {
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", principal);
}

describe("enDireccionPrincipal", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("manda a la principal lo que llega por la dirección del equipo, con ruta y parámetros", () => {
    enProduccion("https://comandapp-co.vercel.app");
    const destino = enDireccionPrincipal("comandapp-ing-pinxxons-projects.vercel.app", new URL("http://localhost:3000/login?volver=%2Fadmin"));
    expect(destino?.toString()).toBe("https://comandapp-co.vercel.app/login?volver=%2Fadmin");
  });

  it("el regreso de Google que cayó en otra dirección llega a la principal con su código", () => {
    enProduccion("https://comandapp-co.vercel.app");
    const destino = enDireccionPrincipal("comandapp-ing-pinxxons-projects.vercel.app", new URL("http://localhost:3000/?code=abc-123"));
    expect(destino?.toString()).toBe("https://comandapp-co.vercel.app/?code=abc-123");
  });

  it("no hace nada si ya se está en la principal", () => {
    enProduccion("https://comandapp-co.vercel.app/");
    expect(enDireccionPrincipal("comandapp-co.vercel.app", new URL("http://localhost:3000/comandas"))).toBeNull();
    expect(enDireccionPrincipal("Comandapp-CO.vercel.app", new URL("http://localhost:3000/comandas"))).toBeNull();
  });

  it("sin cabecera Host no adivina: deja pasar", () => {
    enProduccion("https://comandapp-co.vercel.app");
    expect(enDireccionPrincipal(null, new URL("http://localhost:3000/"))).toBeNull();
  });

  it("no toca las vistas previas ni el PC", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://comandapp-co.vercel.app");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(enDireccionPrincipal("comandapp-git-rama-ing-pinxxons-projects.vercel.app", new URL("http://localhost:3000/login"))).toBeNull();
    vi.stubEnv("VERCEL_ENV", "");
    expect(enDireccionPrincipal("localhost:3000", new URL("http://localhost:3000/login"))).toBeNull();
  });
});

describe("rutaInterna", () => {
  it("deja pasar las rutas de Comandapp", () => {
    expect(rutaInterna("/admin")).toBe("/admin");
    expect(rutaInterna("/comandas/12/editar?x=1")).toBe("/comandas/12/editar?x=1");
  });

  it("cualquier otro sitio vuelve a la cola", () => {
    for (const ruta of [null, "", "https://otro.com", "//otro.com", "/\\otro.com", "javascript:alert(1)"]) {
      expect(rutaInterna(ruta)).toBe("/comandas");
    }
  });
});
