import type { Metadata, Viewport } from "next";
import { DESCRIPCION_SITIO, PALABRAS_CLAVE, TITULO_SITIO, sitioUrl } from "@/lib/sitio";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(sitioUrl()),
  title: {
    default: TITULO_SITIO,
    template: "%s · Comandapp",
  },
  description: DESCRIPCION_SITIO,
  keywords: PALABRAS_CLAVE,
  applicationName: "Comandapp",
  appleWebApp: { capable: true, title: "Comandapp", statusBarStyle: "default" },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Comandapp",
    locale: "es_CO",
    url: "/",
    title: TITULO_SITIO,
    description: DESCRIPCION_SITIO,
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO_SITIO,
    description: DESCRIPCION_SITIO,
  },
  robots: { index: true, follow: true },
  // Le prueba a Search Console que el sitio es nuestro. El código es público a
  // propósito: va en el HTML de todas las páginas, no es un secreto.
  verification: { google: "eAgMIDN5Tz2GUEViyIHoP6q0YLjDrOU58MlLkVcKfB0" },
  category: "business",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#f6f3ec",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
