import type { MetadataRoute } from "next";
import { sitioUrl } from "@/lib/sitio";

// Las páginas públicas que Google debería conocer.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = sitioUrl();
  const hoy = new Date();
  return [
    { url: `${base}/`, lastModified: hoy, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/demo`, lastModified: hoy, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/registro`, lastModified: hoy, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/privacidad`, lastModified: hoy, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terminos`, lastModified: hoy, changeFrequency: "yearly", priority: 0.3 },
  ];
}
