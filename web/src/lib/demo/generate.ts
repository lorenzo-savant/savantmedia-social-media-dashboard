/**
 * Generatore dei dati di demo.
 *
 * Tre proprietà, tutte volute:
 *
 *  1. DETERMINISTICO PER (campagna, giorno). Il valore di un giorno non dipende
 *     dall'ordine di generazione né dall'ampiezza della finestra: cambiare il
 *     filtro 7/30/90 giorni non fa "ballare" i numeri già visti. È hash-based,
 *     non un RNG con stato.
 *
 *  2. STESSA FORMA DEI DATI VERI. Ogni riga ha esattamente i campi che
 *     restituiscono le tre API a grana campagna/giorno (vedi api-catalog.ts).
 *     Dove un'API non espone un campo, qui è `null` — non stimato.
 *
 *  3. INTERNAMENTE COERENTE. I breakdown (placering, enhet, ålder, kön, land)
 *     sono ripartizioni della stessa riga giornaliera: la loro somma torna
 *     ESATTAMENTE al totale della campagna, come nei report reali.
 */

import type { DailyRow, Platform, SyncEntry } from "../types";
import {
  ACCOUNTS,
  BREAKDOWN_VALUES,
  CAMPAIGNS,
  CAMPAIGN_BY_ID,
  GOOGLE_NETWORK_BY_CHANNEL,
  type CampaignSpec,
} from "./catalog";

export const WINDOW_DAYS = 90;

// ---------------------------------------------------------------- rng hash-based

/** FNV-1a a 32 bit: stessa stringa → stesso numero, sempre. */
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Pseudo-random stabile in [0,1) derivato da una chiave testuale. */
function rand(key: string): number {
  const h = hash32(key);
  // mix finale (xorshift) per evitare correlazioni tra chiavi simili
  let x = h;
  x ^= x << 13;
  x >>>= 0;
  x ^= x >> 17;
  x ^= x << 5;
  x >>>= 0;
  return x / 4294967296;
}

/** Rumore moltiplicativo centrato su 1, ampiezza `spread` (es. 0.18 = ±18%). */
function jitter(key: string, spread: number): number {
  // media di due estrazioni → distribuzione a campana, niente salti innaturali
  const a = rand(key + "#a");
  const b = rand(key + "#b");
  return 1 + ((a + b) / 2 - 0.5) * 2 * spread;
}

// ------------------------------------------------------------------------ date

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/**
 * Ultimo giorno COMPLETO: le piattaforme chiudono la giornata nel fuso
 * dell'account, quindi una dashboard seria si ferma a ieri invece di mostrare
 * un "oggi" parziale che sembra un crollo.
 */
export function lastCompleteDay(now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - 1);
  return toISO(d);
}

// ----------------------------------------------------- curve di comportamento

/** Lun=1 … Dom=0. B2B crolla nel weekend, e-commerce sale. */
function weekdayFactor(iso: string, weekend: number): number {
  const dow = parseISO(iso).getDay();
  if (dow === 0 || dow === 6) return weekend;
  // il lunedì è tipicamente il picco B2B, il venerdì cala
  if (dow === 1) return 1.06;
  if (dow === 5) return 0.95;
  return 1;
}

/**
 * Maturazione dell'attribuzione: con finestra 7d_click di Meta (e data-driven di
 * Google) le conversioni degli ultimi giorni NON sono ancora tutte arrivate.
 * Il sync notturno ri-scarica 28 giorni proprio per questo (LOOKBACK_DAYS=28).
 */
export const ATTRIBUTION_MATURITY = [0.63, 0.82, 0.93, 0.98];

export function maturityAt(daysAgo: number): number {
  return ATTRIBUTION_MATURITY[daysAgo] ?? 1;
}

/** Giorni recenti ancora in maturazione — mostrato come nota nella UI. */
export const MATURING_DAYS = ATTRIBUTION_MATURITY.length;

// ------------------------------------------------------------------ generazione

function buildRow(spec: CampaignSpec, iso: string, daysAgo: number, totalDays: number): DailyRow | null {
  const key = `${spec.campaignId}|${iso}`;

  // posizione nella finestra: 0 = giorno più vecchio, 1 = giorno più recente
  const pos = totalDays > 1 ? (totalDays - 1 - daysAgo) / (totalDays - 1) : 1;

  // lancio tardivo / messa in pausa
  const ageFromStart = totalDays - 1 - daysAgo;
  if (spec.startsAfterDays != null && ageFromStart < spec.startsAfterDays) return null;
  if (spec.pausedAfterDays != null && ageFromStart >= spec.pausedAfterDays) return null;

  const trend = 1 + spec.trend * pos;
  const spend =
    spec.dailySpend * trend * weekdayFactor(iso, spec.weekend) * jitter(key + "spend", 0.19);
  if (spend <= 0) return null;

  const ctr = spec.ctr * jitter(key + "ctr", 0.16);

  let impressions: number;
  let clicks: number;
  if (spec.cpc != null) {
    // campagne Search: si ragiona in CPC, le impression seguono dal CTR
    const cpc = spec.cpc * jitter(key + "cpc", 0.14);
    clicks = spend / cpc;
    impressions = clicks / ctr;
  } else {
    const cpm = (spec.cpm ?? 50) * jitter(key + "cpm", 0.15);
    impressions = (spend / cpm) * 1000;
    clicks = impressions * ctr;
  }

  const cvr = spec.cvr * jitter(key + "cvr", 0.28);
  const rawConversions = clicks * cvr * maturityAt(daysAgo);

  /*
   * Meta e Snapchat riportano conversioni INTERE per giorno; Google riporta
   * decimali (attribuzione data-driven, conversioni frazionarie).
   *
   * L'arrotondamento intero dev'essere stocastico, non `Math.round`. Una
   * campagna con 0,17 conversioni attese al giorno — normalissima per un
   * e-commerce di mobili — con Math.round darebbe zero TUTTI i giorni, e quindi
   * zero nel mese: un artefatto, non un dato. Qui la parte frazionaria è la
   * probabilità di arrotondare per eccesso, con estrazione stabile per
   * (campagna, giorno): il totale del mese resta corretto e i singoli giorni
   * alternano 0 e 1 come nei report veri.
   */
  const conversions =
    spec.platform === "google"
      ? Math.round(rawConversions * 10) / 10
      : Math.floor(rawConversions) + (rand(key + "conv") < rawConversions % 1 ? 1 : 0);

  const conversionValue =
    spec.aov == null ? null : Math.round(conversions * spec.aov * jitter(key + "aov", 0.22) * 100) / 100;

  const reach =
    spec.frequency == null ? null : Math.round(impressions / (spec.frequency * jitter(key + "freq", 0.08)));

  const videoViews = spec.hasVideo ? Math.round(impressions * (0.11 + rand(key + "vv") * 0.14)) : null;

  return {
    date: iso,
    platform: spec.platform,
    accountId: spec.accountId,
    clientId: spec.clientId,
    campaignId: spec.campaignId,
    campaignName: spec.campaignName,
    objective: spec.objective,
    currency: "SEK",
    spend: Math.round(spend * 100) / 100,
    impressions: Math.round(impressions),
    clicks: Math.round(clicks),
    conversions,
    conversionValue,
    reach,
    videoViews,
  };
}

export interface Dataset {
  /** Ultimo giorno completo incluso (= ieri). */
  endDate: string;
  /** Primo giorno della finestra generata. */
  startDate: string;
  rows: DailyRow[];
  syncLog: SyncEntry[];
  generatedAt: string;
}

function buildSyncLog(endDate: string): SyncEntry[] {
  // Il sync notturno gira alle 03:00 (backend/register-sync-task.ps1).
  const runDay = addDays(endDate, 1);
  return ACCOUNTS.map((a, i) => {
    const startedAt = `${runDay}T03:00:${String(4 + ((i * 7) % 50)).padStart(2, "0")}`;
    const durationSec = Math.round(
      (a.platform === "meta" ? 42 : a.platform === "google" ? 26 : 14) * jitter(a.id + "dur", 0.3),
    );
    const finished = new Date(`${startedAt}`);
    finished.setSeconds(finished.getSeconds() + durationSec);
    const rowsUpserted = Math.round(
      CAMPAIGNS.filter((c) => c.accountId === a.id).length * 28 * jitter(a.id + "rows", 0.05),
    );
    return {
      platform: a.platform,
      accountId: a.id,
      startedAt,
      finishedAt: toISO(finished) + "T" + finished.toTimeString().slice(0, 8),
      status: "success" as const,
      rowsUpserted,
      error: null,
      durationSec,
    };
  });
}

function generate(endDate: string): Dataset {
  const rows: DailyRow[] = [];
  const days: string[] = [];
  for (let a = WINDOW_DAYS - 1; a >= 0; a--) days.push(addDays(endDate, -a));

  for (const spec of CAMPAIGNS) {
    for (let i = 0; i < days.length; i++) {
      const iso = days[i];
      const daysAgo = days.length - 1 - i;
      const row = buildRow(spec, iso, daysAgo, days.length);
      if (row) rows.push(row);
    }
  }

  return {
    endDate,
    startDate: days[0],
    rows,
    syncLog: buildSyncLog(endDate),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Memoizzato per giorno: la finestra scorre di un giorno a mezzanotte, non a
 * ogni richiesta.
 *
 * In produzione la cache sta su globalThis (sopravvive tra le richieste). In
 * sviluppo NO, di proposito: su globalThis sopravvivrebbe anche all'HMR, e
 * modificare il catalogo non cambierebbe nulla a schermo finché non si riavvia
 * il server. Una variabile di modulo si azzera a ogni ricompilazione.
 */
const CACHE_KEY = "__savant_dataset__";
type CacheShape = { key: string; value: Dataset } | undefined;

let devCache: CacheShape;

export function getDataset(): Dataset {
  const end = lastCompleteDay();
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    if (devCache && devCache.key === end) return devCache.value;
    const value = generate(end);
    devCache = { key: end, value };
    return value;
  }

  const g = globalThis as typeof globalThis & { [CACHE_KEY]?: CacheShape };
  const cached = g[CACHE_KEY];
  if (cached && cached.key === end) return cached.value;
  const value = generate(end);
  g[CACHE_KEY] = { key: end, value };
  return value;
}

// -------------------------------------------------------------- ripartizioni

/**
 * Ripartisce `total` sui pesi dati in modo che la somma delle parti sia
 * ESATTAMENTE `total` (metodo dei resti maggiori). Serve perché in un report
 * reale la somma dei breakdown coincide con il totale della campagna.
 */
function allocate(total: number, weights: number[], decimals = 0): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0 || total === 0) return weights.map(() => 0);
  const f = 10 ** decimals;
  const scaled = total * f;
  const exact = weights.map((w) => (scaled * w) / sum);
  const floored = exact.map(Math.floor);
  let remainder = Math.round(scaled - floored.reduce((a, b) => a + b, 0));
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < order.length && remainder > 0; k++, remainder--) floored[order[k].i]++;
  return floored.map((v) => v / f);
}

export type BreakdownDim = "placement" | "device" | "age" | "gender" | "country";

export interface BreakdownSlice {
  key: string;
  label: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number | null;
}

/**
 * Breakdown di una piattaforma su una dimensione, ricavato ripartendo i totali
 * già aggregati. I pesi base vengono dal catalogo (quote di mercato realistiche)
 * e ricevono un jitter stabile per campagna, così due campagne non hanno mai il
 * mix identico — esattamente come nei dati veri.
 */
export function breakdownFor(
  rows: DailyRow[],
  platform: Platform,
  dim: BreakdownDim,
): BreakdownSlice[] {
  const base = BREAKDOWN_VALUES[platform][dim];
  const relevant = rows.filter((r) => r.platform === platform);
  if (!relevant.length) return [];

  const acc = base.map((b) => ({
    key: b.key,
    label: b.label,
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    conversionValue: 0,
    hasValue: false,
  }));

  // Aggreghiamo prima per campagna: il mix di placement è una proprietà della
  // campagna (targeting, creatività), non del singolo giorno.
  const byCampaign = new Map<string, DailyRow[]>();
  for (const r of relevant) {
    const list = byCampaign.get(r.campaignId);
    if (list) list.push(r);
    else byCampaign.set(r.campaignId, [r]);
  }

  for (const [campaignId, list] of byCampaign) {
    // Su Google la rete dipende dal tipo di campagna, non è libera (vedi
    // GOOGLE_NETWORK_BY_CHANNEL). Un peso 0 resta 0 anche dopo il jitter.
    const channel = CAMPAIGN_BY_ID.get(campaignId)?.channelType;
    const constrained =
      platform === "google" && dim === "placement" && channel
        ? GOOGLE_NETWORK_BY_CHANNEL[channel]
        : null;

    const weights = base.map((b) => {
      const w = constrained ? (constrained[b.key] ?? 0) : b.weight;
      return w * jitter(`${campaignId}|${dim}|${b.key}`, 0.42);
    });
    const t = list.reduce(
      (a, r) => {
        a.spend += r.spend;
        a.impressions += r.impressions;
        a.clicks += r.clicks;
        a.conversions += r.conversions;
        if (r.conversionValue != null) {
          a.conversionValue += r.conversionValue;
          a.hasValue = true;
        }
        return a;
      },
      { spend: 0, impressions: 0, clicks: 0, conversions: 0, conversionValue: 0, hasValue: false },
    );

    const spend = allocate(t.spend, weights, 2);
    const impressions = allocate(t.impressions, weights);
    // click e conversioni non seguono lo stesso mix della spesa: alcune
    // placement/età convertono meglio. Pesi leggermente diversi, stabili.
    const perfWeights = base.map((b, i) => weights[i] * jitter(`${campaignId}|${dim}|${b.key}|perf`, 0.5));
    const clicks = allocate(t.clicks, perfWeights);
    const conversions = allocate(t.conversions, perfWeights, 1);
    const values = t.hasValue ? allocate(t.conversionValue, perfWeights, 2) : null;

    for (let i = 0; i < acc.length; i++) {
      acc[i].spend += spend[i];
      acc[i].impressions += impressions[i];
      acc[i].clicks += clicks[i];
      acc[i].conversions += conversions[i];
      if (values) {
        acc[i].conversionValue += values[i];
        acc[i].hasValue = true;
      }
    }
  }

  return acc
    .map((a) => ({
      key: a.key,
      label: a.label,
      spend: Math.round(a.spend * 100) / 100,
      impressions: a.impressions,
      clicks: a.clicks,
      conversions: Math.round(a.conversions * 10) / 10,
      conversionValue: a.hasValue ? Math.round(a.conversionValue * 100) / 100 : null,
    }))
    .filter((a) => a.impressions > 0)
    .sort((a, b) => b.spend - a.spend);
}
