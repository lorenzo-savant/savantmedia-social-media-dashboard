/**
 * Modello dati della dashboard.
 *
 * REGOLA DI PROGETTO: ogni campo qui dentro deve esistere davvero in almeno una
 * delle tre Marketing API (Meta / Google Ads / Snapchat). Se un'API non espone
 * un campo, il tipo lo rende `null` — non lo inventiamo e non lo stimiamo.
 * La mappatura campo → endpoint → nome API sta in `src/lib/api-catalog.ts`
 * ed è mostrata all'utente nella pagina "Datakällor".
 */

export type Platform = "meta" | "google" | "snapchat";

export const PLATFORMS: Platform[] = ["meta", "google", "snapchat"];

/** Come ogni piattaforma chiama, nella sua API, la "conversione" che contiamo. */
export type ConversionModel = "purchase" | "lead" | "signup";

/**
 * Riga giornaliera a grana campagna — la stessa grana che restituiscono le tre
 * API con `time_increment=1` (Meta), `segments.date` (Google), `granularity=DAY`
 * (Snapchat). È anche la grana della tabella `ad_metrics` del backend.
 */
export interface DailyRow {
  date: string; // YYYY-MM-DD
  platform: Platform;
  accountId: string; // external_id: act_… | 123-456-7890 | snap_…
  clientId: string;
  campaignId: string;
  campaignName: string;
  /** Valore enum reale dell'API (Meta objective / Google channel type / Snapchat objective). */
  objective: string;
  currency: "SEK";

  spend: number;
  impressions: number;
  /** Meta+Google: `clicks`. Snapchat: `swipes` (è il suo equivalente di click). */
  clicks: number;
  conversions: number;
  /**
   * Valore conversioni. `null` quando l'azione di conversione NON ha un valore
   * configurato nella piattaforma — caso reale e frequentissimo sui lead.
   * `null` ≠ 0: senza valore configurato il ROAS non è calcolabile, non è zero.
   */
  conversionValue: number | null;

  /**
   * Reach giornaliero deduplicato. Meta (`reach`) e Snapchat (`uniques`) lo
   * espongono; Google Ads NON lo espone a livello campagna/giorno → `null`.
   * ATTENZIONE: non è additivo tra i giorni (vedi `dedupedReach`).
   */
  reach: number | null;

  /**
   * Video: Meta `video_thruplay_watched_actions`, Google `metrics.video_views`,
   * Snapchat `video_views`. `null` se la campagna non ha creatività video.
   */
  videoViews: number | null;
}

/** Anagrafica campagna: campi che si leggono dall'entità campagna, non dai report. */
export interface CampaignMeta {
  campaignId: string;
  campaignName: string;
  platform: Platform;
  accountId: string;
  clientId: string;
  objective: string;
  /** Google Ads: `campaign.advertising_channel_type`. Solo Google. */
  channelType: string | null;
  /** `campaign.status` / `effective_status`: ACTIVE | PAUSED. */
  status: "ACTIVE" | "PAUSED";
  /** Budget giornaliero dichiarato nella piattaforma, in SEK. */
  dailyBudget: number | null;
  bidStrategy: string;
  startDate: string;
  /** Data in cui la campagna è stata messa in pausa, se lo è. */
  pausedFrom: string | null;
  conversionModel: ConversionModel;
  /** Nome dell'azione di conversione così com'è configurata in piattaforma. */
  conversionActionName: string;
  hasVideo: boolean;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  /** Budget mediatico mensile concordato, SEK. Dato di business, non API. */
  monthlyBudget: number;
  /** Il cliente ha un valore di conversione configurato → ROAS calcolabile. */
  revenueTracked: boolean;
}

export interface Account {
  id: string; // external_id
  platform: Platform;
  name: string;
  clientId: string;
  currency: "SEK";
  /** Fuso orario dell'account: determina il taglio dei giorni nei report. */
  timezone: string;
  /** Meta: attribution setting dell'account (es. "7d_click,1d_view"). */
  attribution: string;
}

/** Metriche aggregate + derivate. I rapporti si calcolano, non si sommano. */
export interface Totals {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  /** null quando NESSUNA riga del gruppo ha un valore di conversione tracciato. */
  conversionValue: number | null;
  ctr: number;
  cpc: number;
  cpm: number;
  cpa: number;
  /** null se conversionValue è null → il ROAS non esiste, non vale 0. */
  roas: number | null;
  /** Reach deduplicato sul periodo (solo Meta+Snapchat) — vedi `dedupedReach`. */
  reach: number | null;
  frequency: number | null;
  videoViews: number | null;
}

export interface Breakdown {
  key: string;
  label: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number | null;
}

export interface SyncEntry {
  platform: Platform;
  accountId: string;
  startedAt: string;
  finishedAt: string;
  status: "success" | "error" | "running";
  rowsUpserted: number;
  error: string | null;
  /** Durata in secondi — utile per stimare i tempi di sync reali. */
  durationSec: number;
}

export interface Filters {
  /** Numero di giorni della finestra, con fine = ultimo giorno completo. */
  days: number;
  platforms: Platform[];
  clientId: string | null;
}
