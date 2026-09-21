import { ImageResponse } from "next/og";

// Imagen que se ve al compartir el enlace (WhatsApp, redes, Google).
export const alt = "Comandapp · Comandas y pedidos para restaurantes y comidas rápidas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f6f3ec",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        {/* Logotipo */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 84, height: 84, background: "#111111", borderRadius: 24 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d9a833" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10h16" />
              <path d="M5 10a7 7 0 0 1 14 0" />
              <path d="M4 14h16" />
              <path d="M5 14v1a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-1" />
            </svg>
          </div>
          <div style={{ fontSize: 52, fontWeight: 800, color: "#141414" }}>Comandapp</div>
        </div>

        {/* Frase principal */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 76, fontWeight: 800, color: "#141414", lineHeight: 1.05 }}>Tus pedidos en orden.</div>
          <div style={{ fontSize: 76, fontWeight: 800, color: "#9a7318", lineHeight: 1.05 }}>Tu cocina a tiempo.</div>
        </div>

        {/* Pie con los tres colores del semáforo */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: "#6b6760" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 13, background: "#22c55e" }} />
            <div style={{ width: 26, height: 26, borderRadius: 13, background: "#facc15" }} />
            <div style={{ width: 26, height: 26, borderRadius: 13, background: "#f97316" }} />
          </div>
          <div>Comandas, cocina y ventas para restaurantes y comidas rápidas</div>
        </div>
      </div>
    ),
    size,
  );
}
