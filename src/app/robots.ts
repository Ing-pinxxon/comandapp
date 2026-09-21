import type { MetadataRoute } from "next";
import { sitioUrl } from "@/lib/sitio";

// Le dice a Google qué puede mirar. Lo privado queda fuera del índice.
export default function robots(): MetadataRoute.Robots {
  const base = sitioUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/demo", "/registro", "/login"],
        disallow: ["/admin", "/comandas", "/quien", "/onboarding", "/plataforma", "/api/", "/auth/", "/vista-previa"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
