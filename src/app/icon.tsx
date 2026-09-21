import { ImageResponse } from "next/og";

// Ícono de la pestaña y de la app instalada: cuadro negro con la tapa mostaza.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111111",
          borderRadius: 112,
        }}
      >
        <svg width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="#d9a833" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10h16" />
          <path d="M5 10a7 7 0 0 1 14 0" />
          <path d="M4 14h16" />
          <path d="M5 14v1a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-1" />
        </svg>
      </div>
    ),
    size,
  );
}
