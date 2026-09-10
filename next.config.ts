import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir la app desde la tablet o el celular usando la IP del PC
  // (ej. http://192.168.1.10:3000) mientras se corre en modo desarrollo.
  allowedDevOrigins: ["192.168.1.10", "192.168.0.*", "192.168.1.*", "10.0.0.*"],
};

export default nextConfig;
