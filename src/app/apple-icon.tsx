import { ImageResponse } from "next/og";

// Ícono para la pantalla de inicio en iPad/iPhone.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        }}
      >
        <svg width="110" height="110" viewBox="0 0 24 24" fill="none" stroke="#d9a833" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
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
