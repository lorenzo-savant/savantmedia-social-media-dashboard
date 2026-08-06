import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La root del progetto è il repo, non la home dell'utente: senza questo
  // Turbopack risale fino a trovare un package-lock.json fuori dal repo.
  turbopack: { root: path.join(__dirname, "..") },

  // L'indicatore di sviluppo sta in basso a sinistra per default, proprio sopra
  // il toggle di lingua della sidebar. Spostato per non rovinare la demo.
  devIndicators: { position: "bottom-right" },

  /**
   * Quando il backend FastAPI è acceso, decommenta il rewrite qui sotto e le
   * chiamate a /api/* vanno a Postgres invece che ai dati demo. La forma del
   * JSON è identica (vedi src/app/api/metrics/route.ts), quindi non cambia
   * nulla nei componenti.
   *
   * async rewrites() {
   *   return [{ source: "/api/:path*", destination: "http://127.0.0.1:8000/api/:path*" }];
   * },
   */
};

export default nextConfig;
