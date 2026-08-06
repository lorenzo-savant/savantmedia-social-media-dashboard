/**
 * Stato delle credenziali — SOLO lato server.
 *
 * Legge quali variabili sono valorizzate nel `.env` della root del progetto e
 * restituisce ESCLUSIVAMENTE booleani. Nessun valore, nemmeno troncato, lascia
 * mai il server: è precisamente il tipo di fuga che questo progetto è nato per
 * evitare (vedi la sezione "Sicurezza" del README).
 *
 * Serve alla pagina Konton per rispondere alla domanda pratica: "cosa manca,
 * esattamente, perché la dashboard mostri dati veri?"
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Platform } from "./types";

export interface CredentialCheck {
  name: string;
  set: boolean;
  /** Chi la fornisce: serve per sapere a chi chiedere. */
  from: string;
}

const REQUIRED: Record<Platform, CredentialCheck[]> = {
  meta: [
    { name: "META_ACCESS_TOKEN", set: false, from: "System User-token (Business Manager)" },
    { name: "META_AD_ACCOUNTS", set: false, from: "Konto-ID act_… från kunden" },
  ],
  google: [
    { name: "GOOGLE_DEVELOPER_TOKEN", set: false, from: "API Center i MCC" },
    { name: "GOOGLE_CLIENT_ID", set: false, from: "Google Cloud OAuth" },
    { name: "GOOGLE_CLIENT_SECRET", set: false, from: "Google Cloud OAuth" },
    { name: "GOOGLE_REFRESH_TOKEN", set: false, from: "OAuth-flöde, engångs" },
    { name: "GOOGLE_CUSTOMER_IDS", set: false, from: "Kund-ID 123-456-7890" },
  ],
  snapchat: [
    { name: "SNAPCHAT_CLIENT_ID", set: false, from: "Snapchat Business · OAuth-app" },
    { name: "SNAPCHAT_CLIENT_SECRET", set: false, from: "Snapchat Business · OAuth-app" },
    { name: "SNAPCHAT_REFRESH_TOKEN", set: false, from: "OAuth-flöde, engångs" },
    { name: "SNAPCHAT_AD_ACCOUNT_IDS", set: false, from: "Ad account-ID" },
  ],
};

/** Parser .env minimale: nessuna dipendenza, e non tiene i valori in memoria. */
async function envKeysPresent(): Promise<Set<string>> {
  const present = new Set<string>();
  // Le variabili d'ambiente reali vincono sempre sul file (come in config.py).
  for (const [k, v] of Object.entries(process.env)) if (v) present.add(k);

  // Il .env sta nella root del repo, un livello sopra web/. Il percorso è
  // dinamico solo in apparenza: turbopackIgnore evita che il bundler tracci
  // (e includa nel deploy) l'intero progetto per questa singola lettura.
  for (const rel of ["../.env", ".env"]) {
    try {
      const text = await readFile(path.join(/* turbopackIgnore: true */ process.cwd(), rel), "utf8");
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
        const [key, ...rest] = trimmed.split("=");
        const value = rest.join("=").trim().replace(/^["']|["']$/g, "");
        if (value) present.add(key.trim());
      }
      break;
    } catch {
      /* file assente: normale finché non si copia .env.example */
    }
  }
  return present;
}

export interface PlatformConnection {
  platform: Platform;
  credentials: CredentialCheck[];
  missing: string[];
  ready: boolean;
}

export async function connectionStatus(): Promise<Record<Platform, PlatformConnection>> {
  const present = await envKeysPresent();
  const out = {} as Record<Platform, PlatformConnection>;
  for (const platform of Object.keys(REQUIRED) as Platform[]) {
    const credentials = REQUIRED[platform].map((c) => ({ ...c, set: present.has(c.name) }));
    const missing = credentials.filter((c) => !c.set).map((c) => c.name);
    out[platform] = { platform, credentials, missing, ready: missing.length === 0 };
  }
  return out;
}
