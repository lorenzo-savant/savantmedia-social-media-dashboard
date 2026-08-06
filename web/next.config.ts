import path from "node:path";
import type { NextConfig } from "next";

/**
 * Su Vercel la Root Directory del progetto è già `web/`, quindi la root di
 * Turbopack è corretta di default. In locale invece serve fissarla al repo:
 * altrimenti Turbopack risale la gerarchia finché trova un package-lock.json,
 * e ne esiste uno nella home dell'utente, fuori dal repo.
 */
const localRoot = process.env.VERCEL
  ? {}
  : { turbopack: { root: path.join(__dirname, "..") } };

const nextConfig: NextConfig = {
  ...localRoot,

  // L'indicatore di sviluppo sta in basso a sinistra per default, proprio sopra
  // il toggle di lingua della sidebar. Spostato per non rovinare la demo.
  devIndicators: { position: "bottom-right" },

  /**
   * Quando il backend FastAPI è acceso, decommenta il rewrite qui sotto e le
   * chiamate a /api/* vanno a Postgres invece che ai dati demo. La forma del
   * JSON è identica (vedi src/app/api/metrics/route.ts), quindi non cambia
   * nulla nei componenti.
   *
   * NB: in un deploy su Vercel il backend Python NON è raggiungibile su
   * 127.0.0.1 — servirebbe un host pubblico e le credenziali del database.
   * Finché siamo in demo, le route in src/app/api/ bastano e girano serverless.
   *
   * async rewrites() {
   *   return [{ source: "/api/:path*", destination: "http://127.0.0.1:8000/api/:path*" }];
   * },
   */
};

export default nextConfig;
