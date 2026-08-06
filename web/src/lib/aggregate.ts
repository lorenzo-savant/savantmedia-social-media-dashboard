/**
 * Aggregazione e metriche derivate.
 *
 * Due regole che qui non si violano mai:
 *
 *  · I RAPPORTI SI CALCOLANO SULLE SOMME. CTR di periodo = Σclick / Σimpression,
 *    non la media dei CTR giornalieri (che pesa allo stesso modo un giorno da
 *    10 impression e uno da 2 milioni). Vale per CTR, CPC, CPM, CPA, ROAS.
 *
 *  · `null` NON È ZERO. Se nessuna campagna del gruppo ha un valore di
 *    conversione configurato, il ROAS non esiste: resta `null` e la UI stampa
 *    "–". Mostrare 0,00× farebbe sembrare fallimentare una campagna lead gen
 *    che sta andando benissimo.
 */

import { CAMPAIGN_BY_ID, CLIENT_BY_ID } from "./demo/catalog";
import { addDays, parseISO } from "./demo/generate";
import type { Client, DailyRow, Filters, Platform, Totals } from "./types";

// ------------------------------------------------------------------- totali

interface Acc {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
  hasValue: boolean;
  reachSum: number;
  /** Impression delle SOLE righe che hanno anche la reach — vedi `frequency`. */
  reachImpressions: number;
  hasReach: boolean;
  videoViews: number;
  hasVideo: boolean;
}

function emptyAcc(): Acc {
  return {
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    conversionValue: 0,
    hasValue: false,
    reachSum: 0,
    reachImpressions: 0,
    hasReach: false,
    videoViews: 0,
    hasVideo: false,
  };
}

function push(a: Acc, r: DailyRow): Acc {
  a.spend += r.spend;
  a.impressions += r.impressions;
  a.clicks += r.clicks;
  a.conversions += r.conversions;
  if (r.conversionValue != null) {
    a.conversionValue += r.conversionValue;
    a.hasValue = true;
  }
  if (r.reach != null) {
    a.reachSum += r.reach;
    // La frequenza è impressions/reach: al numeratore devono finire SOLO le
    // impression delle righe che hanno una reach. Google non espone la reach,
    // quindi includere le sue impression gonfierebbe la frequenza di Meta.
    a.reachImpressions += r.impressions;
    a.hasReach = true;
  }
  if (r.videoViews != null) {
    a.videoViews += r.videoViews;
    a.hasVideo = true;
  }
  return a;
}

/**
 * Deduplicazione della reach sul periodo.
 *
 * La reach NON è additiva: la stessa persona vista in giorni diversi conta una
 * volta sola. In produzione il numero arriva da una chiamata dedicata (Meta
 * Insights senza `time_increment`, Snapchat stats sull'intero intervallo), che
 * è già deduplicata. Qui modelliamo quella deduplicazione con una curva
 * logaritmica sul numero di giorni, così il valore mostrato ha lo stesso ordine
 * di grandezza di quello reale invece di essere una somma sbagliata.
 *
 * Il coefficiente è calibrato sulla regola pratica dei report Meta: la
 * frequenza a 30 giorni è circa 2,2× quella giornaliera, quella a 7 giorni
 * circa 1,7×. Sopra 30 giorni la curva si appiattisce, come nella realtà.
 */
function dedupeReach(reachSum: number, days: number): number {
  if (days <= 1) return Math.round(reachSum);
  return Math.round(reachSum / (1 + 0.35 * Math.log(days)));
}

function finalize(a: Acc, days: number): Totals {
  const reach = a.hasReach ? dedupeReach(a.reachSum, days) : null;
  return {
    spend: round2(a.spend),
    impressions: a.impressions,
    clicks: a.clicks,
    conversions: round1(a.conversions),
    conversionValue: a.hasValue ? round2(a.conversionValue) : null,
    ctr: a.impressions > 0 ? a.clicks / a.impressions : 0,
    cpc: a.clicks > 0 ? a.spend / a.clicks : 0,
    cpm: a.impressions > 0 ? (a.spend / a.impressions) * 1000 : 0,
    cpa: a.conversions > 0 ? a.spend / a.conversions : 0,
    roas: a.hasValue && a.spend > 0 ? a.conversionValue / a.spend : null,
    reach,
    frequency: reach && reach > 0 ? a.reachImpressions / reach : null,
    videoViews: a.hasVideo ? a.videoViews : null,
  };
}

export function totalsOf(rows: DailyRow[], days: number): Totals {
  const a = emptyAcc();
  for (const r of rows) push(a, r);
  return finalize(a, days);
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;

// ------------------------------------------------------------------ filtri

export function filterRows(rows: DailyRow[], f: Filters, endDate: string): DailyRow[] {
  const since = addDays(endDate, -(f.days - 1));
  const platforms = new Set(f.platforms);
  return rows.filter(
    (r) =>
      r.date >= since &&
      r.date <= endDate &&
      platforms.has(r.platform) &&
      (f.clientId == null || r.clientId === f.clientId),
  );
}

/** Finestra immediatamente precedente, stessa lunghezza — base dei delta. */
export function previousRows(rows: DailyRow[], f: Filters, endDate: string): DailyRow[] {
  const prevEnd = addDays(endDate, -f.days);
  const prevStart = addDays(prevEnd, -(f.days - 1));
  const platforms = new Set(f.platforms);
  return rows.filter(
    (r) =>
      r.date >= prevStart &&
      r.date <= prevEnd &&
      platforms.has(r.platform) &&
      (f.clientId == null || r.clientId === f.clientId),
  );
}

/** Variazione relativa; null se la base è 0 (un delta "+∞%" non informa nessuno). */
export function delta(current: number, previous: number): number | null {
  if (!previous) return null;
  return (current - previous) / previous;
}

// -------------------------------------------------------------- serie storica

export interface DayPoint {
  date: string;
  meta: number;
  google: number;
  snapchat: number;
  total: number;
}

export function dailySpendSeries(rows: DailyRow[], from: string, to: string): DayPoint[] {
  const byDate = new Map<string, DayPoint>();
  for (let d = from; d <= to; d = addDays(d, 1)) {
    byDate.set(d, { date: d, meta: 0, google: 0, snapchat: 0, total: 0 });
  }
  for (const r of rows) {
    const p = byDate.get(r.date);
    if (!p) continue;
    p[r.platform] += r.spend;
    p.total += r.spend;
  }
  return [...byDate.values()].map((p) => ({
    date: p.date,
    meta: round2(p.meta),
    google: round2(p.google),
    snapchat: round2(p.snapchat),
    total: round2(p.total),
  }));
}

/** Serie giornaliera di una singola metrica — per gli sparkline. */
export function dailyMetric(
  rows: DailyRow[],
  from: string,
  to: string,
  metric: "spend" | "clicks" | "conversions" | "impressions",
): number[] {
  const byDate = new Map<string, number>();
  for (let d = from; d <= to; d = addDays(d, 1)) byDate.set(d, 0);
  for (const r of rows) {
    if (!byDate.has(r.date)) continue;
    byDate.set(r.date, (byDate.get(r.date) ?? 0) + r[metric]);
  }
  return [...byDate.values()];
}

// -------------------------------------------------------------- raggruppamenti

export interface Group<T> {
  key: string;
  meta: T;
  totals: Totals;
}

function groupBy<T>(
  rows: DailyRow[],
  days: number,
  keyOf: (r: DailyRow) => string,
  metaOf: (r: DailyRow) => T,
): Group<T>[] {
  const acc = new Map<string, { acc: Acc; meta: T }>();
  for (const r of rows) {
    const k = keyOf(r);
    let entry = acc.get(k);
    if (!entry) {
      entry = { acc: emptyAcc(), meta: metaOf(r) };
      acc.set(k, entry);
    }
    push(entry.acc, r);
  }
  return [...acc.entries()].map(([key, v]) => ({
    key,
    meta: v.meta,
    totals: finalize(v.acc, days),
  }));
}

export function byPlatform(rows: DailyRow[], days: number) {
  return groupBy(rows, days, (r) => r.platform, (r) => r.platform as Platform).sort(
    (a, b) => b.totals.spend - a.totals.spend,
  );
}

export interface CampaignRow {
  campaignId: string;
  campaignName: string;
  platform: Platform;
  accountId: string;
  clientId: string;
  objective: string;
  channelType: string | null;
  status: "ACTIVE" | "PAUSED";
  dailyBudget: number | null;
  bidStrategy: string;
  conversionActionName: string;
  totals: Totals;
}

export function byCampaign(rows: DailyRow[], days: number): CampaignRow[] {
  const groups = groupBy(rows, days, (r) => r.campaignId, (r) => r);
  return groups
    .map(({ key, meta, totals }) => {
      const spec = CAMPAIGN_BY_ID.get(key);
      return {
        campaignId: key,
        campaignName: meta.campaignName,
        platform: meta.platform,
        accountId: meta.accountId,
        clientId: meta.clientId,
        objective: meta.objective,
        channelType: spec?.channelType ?? null,
        // Le campagne che smettono di comparire nel report sono in pausa: è così
        // che si legge anche nei dati veri (nessuna riga = nessuna erogazione).
        status: (spec?.pausedAfterDays != null ? "PAUSED" : "ACTIVE") as "ACTIVE" | "PAUSED",
        dailyBudget: spec?.dailyBudget ?? null,
        bidStrategy: spec?.bidStrategy ?? "",
        conversionActionName: spec?.conversionActionName ?? "",
        totals,
      };
    })
    .sort((a, b) => b.totals.spend - a.totals.spend);
}

export interface ClientRow {
  client: Client;
  totals: Totals;
  perPlatform: { platform: Platform; spend: number }[];
}

export function byClient(rows: DailyRow[], days: number): ClientRow[] {
  const groups = groupBy(rows, days, (r) => r.clientId, (r) => r.clientId);
  return groups
    .map(({ key, totals }) => {
      const client = CLIENT_BY_ID.get(key)!;
      const perPlatform = (["meta", "google", "snapchat"] as Platform[])
        .map((p) => ({
          platform: p,
          spend: round2(
            rows.filter((r) => r.clientId === key && r.platform === p).reduce((s, r) => s + r.spend, 0),
          ),
        }))
        .filter((x) => x.spend > 0);
      return { client, totals, perPlatform };
    })
    .sort((a, b) => b.totals.spend - a.totals.spend);
}

// --------------------------------------------------------------- budget pacing

export interface Pacing {
  client: Client;
  /** Speso dal 1° del mese all'ultimo giorno completo. */
  monthToDate: number;
  /** Giorni del mese trascorsi / giorni totali del mese. */
  elapsed: number;
  daysElapsed: number;
  daysInMonth: number;
  /** Proiezione a fine mese: MTD + media ultimi 7 giorni × giorni rimanenti. */
  projected: number;
  /** monthToDate / monthlyBudget */
  used: number;
  /** projected / monthlyBudget — è questo che fa scattare l'alert. */
  projectedUse: number;
  status: "ok" | "near" | "over" | "under";
}

/** Soglie di allerta sulla proiezione a fine mese. */
export const PACING_NEAR = 0.95;
export const PACING_OVER = 1.02;
export const PACING_UNDER = 0.85;

export function pacingFor(allRows: DailyRow[], clients: Client[], endDate: string): Pacing[] {
  const end = parseISO(endDate);
  const monthStart = `${endDate.slice(0, 7)}-01`;
  const daysInMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
  const daysElapsed = end.getDate();
  const elapsed = daysElapsed / daysInMonth;
  const last7Start = addDays(endDate, -6);

  return clients
    .map((client) => {
      let monthToDate = 0;
      let last7 = 0;
      for (const r of allRows) {
        if (r.clientId !== client.id) continue;
        if (r.date >= monthStart && r.date <= endDate) monthToDate += r.spend;
        if (r.date >= last7Start && r.date <= endDate) last7 += r.spend;
      }
      const avgDaily = last7 / 7;
      const projected = monthToDate + avgDaily * (daysInMonth - daysElapsed);
      const used = client.monthlyBudget > 0 ? monthToDate / client.monthlyBudget : 0;
      const projectedUse = client.monthlyBudget > 0 ? projected / client.monthlyBudget : 0;
      const status: Pacing["status"] =
        projectedUse >= PACING_OVER
          ? "over"
          : projectedUse >= PACING_NEAR
            ? "near"
            : projectedUse < PACING_UNDER
              ? "under"
              : "ok";
      return {
        client,
        monthToDate: round2(monthToDate),
        elapsed,
        daysElapsed,
        daysInMonth,
        projected: round2(projected),
        used,
        projectedUse,
        status,
      };
    })
    .sort((a, b) => b.projectedUse - a.projectedUse);
}

// ------------------------------------------------------------------ funnel

export interface FunnelStep {
  key: string;
  value: number;
  /** Conversione dallo step precedente. */
  rate: number | null;
}

export function funnelOf(t: Totals): FunnelStep[] {
  return [
    { key: "impressions", value: t.impressions, rate: null },
    { key: "clicks", value: t.clicks, rate: t.impressions ? t.clicks / t.impressions : null },
    { key: "conversions", value: t.conversions, rate: t.clicks ? t.conversions / t.clicks : null },
  ];
}
