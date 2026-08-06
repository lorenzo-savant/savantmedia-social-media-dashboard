/**
 * Anagrafica della demo: clienti, account, campagne.
 *
 * Tutti i valori di struttura (objective, channel type, bid strategy, status,
 * nomi delle azioni di conversione) sono valori ENUM REALI delle rispettive API
 * — non etichette inventate. I profili di performance (CPM, CTR, CVR, AOV) sono
 * range di mercato nordico in SEK: servono al generatore per produrre numeri
 * plausibili, e sono l'unica parte "sintetica" della demo.
 *
 * Quando arrivano le chiavi API questo file sparisce: la stessa dashboard legge
 * `/api/metrics` dal backend FastAPI, che ha esattamente la stessa forma.
 */

import type { Account, CampaignMeta, Client, Platform } from "../types";

export const CURRENCY = "SEK" as const;
export const TIMEZONE = "Europe/Stockholm";

export const CLIENTS: Client[] = [
  {
    id: "vinterhamn",
    name: "Vinterhamn AB",
    industry: "Rekrytering & employer branding",
    monthlyBudget: 85_000,
    revenueTracked: false,
  },
  {
    id: "blomlyckan",
    name: "Blomlyckan",
    industry: "E-handel · hudvård",
    monthlyBudget: 62_000,
    revenueTracked: true,
  },
  {
    id: "taktil",
    name: "Taktil Analytics",
    industry: "B2B SaaS",
    monthlyBudget: 140_000,
    revenueTracked: true,
  },
  {
    id: "ekbacken",
    name: "Ekbacken Interiör",
    industry: "E-handel · heminredning",
    monthlyBudget: 48_000,
    revenueTracked: true,
  },
  {
    id: "varljus",
    name: "Vårljus Vårdklinik",
    industry: "Vårdklinik · lokal lead gen",
    monthlyBudget: 36_000,
    revenueTracked: false,
  },
];

export const ACCOUNTS: Account[] = [
  // Meta — external_id nel formato act_… come lo restituisce la Graph API.
  { id: "act_1042778319", platform: "meta", name: "Vinterhamn – Meta", clientId: "vinterhamn", currency: CURRENCY, timezone: TIMEZONE, attribution: "7d_click,1d_view" },
  { id: "act_1042778452", platform: "meta", name: "Blomlyckan – Meta", clientId: "blomlyckan", currency: CURRENCY, timezone: TIMEZONE, attribution: "7d_click,1d_view" },
  { id: "act_1042779106", platform: "meta", name: "Taktil Analytics – Meta", clientId: "taktil", currency: CURRENCY, timezone: TIMEZONE, attribution: "7d_click,1d_view" },
  { id: "act_1042779884", platform: "meta", name: "Ekbacken Interiör – Meta", clientId: "ekbacken", currency: CURRENCY, timezone: TIMEZONE, attribution: "7d_click,1d_view" },

  // Google Ads — customer id nel formato 123-456-7890 (nell'URL va senza trattini).
  { id: "471-905-2288", platform: "google", name: "Vinterhamn – Google Ads", clientId: "vinterhamn", currency: CURRENCY, timezone: TIMEZONE, attribution: "data-driven" },
  { id: "583-114-9027", platform: "google", name: "Blomlyckan – Google Ads", clientId: "blomlyckan", currency: CURRENCY, timezone: TIMEZONE, attribution: "data-driven" },
  { id: "620-447-3351", platform: "google", name: "Taktil Analytics – Google Ads", clientId: "taktil", currency: CURRENCY, timezone: TIMEZONE, attribution: "data-driven" },
  { id: "714-882-6045", platform: "google", name: "Ekbacken Interiör – Google Ads", clientId: "ekbacken", currency: CURRENCY, timezone: TIMEZONE, attribution: "data-driven" },
  { id: "806-233-7719", platform: "google", name: "Vårljus Vårdklinik – Google Ads", clientId: "varljus", currency: CURRENCY, timezone: TIMEZONE, attribution: "data-driven" },

  // Snapchat
  { id: "snap_55501", platform: "snapchat", name: "Blomlyckan – Snapchat", clientId: "blomlyckan", currency: CURRENCY, timezone: TIMEZONE, attribution: "28d_swipe,1d_view" },
  { id: "snap_55507", platform: "snapchat", name: "Ekbacken Interiör – Snapchat", clientId: "ekbacken", currency: CURRENCY, timezone: TIMEZONE, attribution: "28d_swipe,1d_view" },
];

/**
 * Profilo di performance della campagna. Guida il generatore:
 *   - `cpc` valorizzato (tipico Search) → clicks = spend / cpc, impressions = clicks / ctr
 *   - altrimenti                        → impressions = spend / cpm × 1000, clicks = impressions × ctr
 */
export interface CampaignSpec extends CampaignMeta {
  /** Spesa media giornaliera di riferimento, SEK. */
  dailySpend: number;
  cpm: number | null;
  cpc: number | null;
  ctr: number;
  /** Conversion rate sui click. */
  cvr: number;
  /** Valore medio per conversione; null = nessun valore configurato → ROAS assente. */
  aov: number | null;
  /** Moltiplicatore weekend (sab/dom). <1 = B2B, >1 = e-commerce. */
  weekend: number;
  /** Drift lineare sull'intera finestra: 0.2 = +20% alla fine rispetto all'inizio. */
  trend: number;
  /** Frequenza media giornaliera (impressions/reach). null dove l'API non dà reach. */
  frequency: number | null;
  /** Offset in giorni dall'inizio finestra in cui la campagna parte (lancio tardivo). */
  startsAfterDays?: number;
  /** Offset in giorni dall'inizio finestra in cui viene messa in pausa. */
  pausedAfterDays?: number;
}

type Spec = Omit<CampaignSpec, "campaignId" | "clientId"> & { campaignId?: string };

function build(accountId: string, clientId: string, specs: Spec[]): CampaignSpec[] {
  return specs.map((s, i) => ({
    ...s,
    clientId,
    accountId,
    campaignId:
      s.campaignId ??
      (s.platform === "meta"
        ? `238${accountId.slice(-6)}${String(i).padStart(2, "0")}`
        : s.platform === "google"
          ? `${accountId.replace(/-/g, "").slice(0, 8)}${String(i).padStart(2, "0")}`
          : `snap-c-${accountId.slice(-5)}-${String(i).padStart(2, "0")}`),
  }));
}

const META_BASE = {
  platform: "meta" as Platform,
  channelType: null,
  status: "ACTIVE" as const,
  startDate: "2026-06-15",
  pausedFrom: null,
};
const GOOGLE_BASE = {
  platform: "google" as Platform,
  status: "ACTIVE" as const,
  startDate: "2026-05-04",
  pausedFrom: null,
};
const SNAP_BASE = {
  platform: "snapchat" as Platform,
  channelType: null,
  status: "ACTIVE" as const,
  startDate: "2026-06-01",
  pausedFrom: null,
};

export const CAMPAIGNS: CampaignSpec[] = [
  /* ---------------------------------------------------------------- Vinterhamn
     Rekrytering: konverteringen är en ansökan. Ingen intäkt kopplad till leadet
     → `aov: null` → ROAS visas som "–" i hela gränssnittet, aldrig som 0. */
  ...build("act_1042778319", "vinterhamn", [
    {
      ...META_BASE, accountId: "", hasVideo: false,
      campaignName: "VHN | META | LEADS | Broad SE 25–54 | Q3-26",
      objective: "OUTCOME_LEADS", bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      conversionModel: "lead", conversionActionName: "Lead (Facebook-formulär)",
      dailyBudget: 750, dailySpend: 570,
      cpm: 74, cpc: null, ctr: 0.0128, cvr: 0.032, aov: null,
      weekend: 0.72, trend: 0.12, frequency: 1.42,
    },
    {
      ...META_BASE, accountId: "", hasVideo: false,
      campaignName: "VHN | META | LEADS | Lookalike 2% ansökningar | Q3-26",
      objective: "OUTCOME_LEADS", bidStrategy: "COST_CAP",
      conversionModel: "lead", conversionActionName: "Lead (Facebook-formulär)",
      dailyBudget: 600, dailySpend: 442,
      cpm: 88, cpc: null, ctr: 0.0151, cvr: 0.042, aov: null,
      weekend: 0.75, trend: 0.24, frequency: 1.68,
    },
    {
      ...META_BASE, accountId: "", hasVideo: true,
      campaignName: "VHN | META | AWARENESS | Employer brand – film | Q3-26",
      objective: "OUTCOME_AWARENESS", bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      conversionModel: "lead", conversionActionName: "Lead (Facebook-formulär)",
      dailyBudget: 380, dailySpend: 276,
      cpm: 41, cpc: null, ctr: 0.0061, cvr: 0.0054, aov: null,
      weekend: 0.94, trend: -0.08, frequency: 2.15,
    },
  ]),
  ...build("471-905-2288", "vinterhamn", [
    {
      ...GOOGLE_BASE, accountId: "", hasVideo: false,
      campaignName: "VHN | GADS | SEARCH | Varumärke | Always-on",
      objective: "SEARCH", channelType: "SEARCH", bidStrategy: "MAXIMIZE_CONVERSIONS",
      conversionModel: "lead", conversionActionName: "Ansökan skickad",
      dailyBudget: 220, dailySpend: 166,
      cpm: null, cpc: 4.2, ctr: 0.187, cvr: 0.107, aov: null,
      weekend: 0.68, trend: 0.04, frequency: null,
    },
    {
      ...GOOGLE_BASE, accountId: "", hasVideo: false,
      campaignName: "VHN | GADS | SEARCH | Jobb & karriär – generisk | Q3-26",
      objective: "SEARCH", channelType: "SEARCH", bidStrategy: "TARGET_CPA",
      conversionModel: "lead", conversionActionName: "Ansökan skickad",
      dailyBudget: 800, dailySpend: 589,
      cpm: null, cpc: 21.4, ctr: 0.062, cvr: 0.023, aov: null,
      weekend: 0.61, trend: 0.09, frequency: null,
    },
    {
      ...GOOGLE_BASE, accountId: "", hasVideo: true,
      campaignName: "VHN | GADS | DEMAND_GEN | Kandidatprofiler | Q3-26",
      objective: "DEMAND_GEN", channelType: "DEMAND_GEN", bidStrategy: "MAXIMIZE_CONVERSIONS",
      conversionModel: "lead", conversionActionName: "Ansökan skickad",
      dailyBudget: 300, dailySpend: 221,
      cpm: 36, cpc: null, ctr: 0.0074, cvr: 0.0126, aov: null,
      weekend: 0.88, trend: 0.31, frequency: null,
    },
  ]),

  /* --------------------------------------------------------------- Blomlyckan
     E-handel hudvård, snittorder ~700 kr. Här FINNS konverteringsvärde, så ROAS
     är nyckeltalet. Reels-kampanjen pausades mitt i perioden — den försvinner ur
     rapporten från den dagen, precis som i ett riktigt uttag. */
  ...build("act_1042778452", "blomlyckan", [
    {
      ...META_BASE, accountId: "", hasVideo: true,
      campaignName: "BLM | META | SALES | Prospecting – hudvård brett | Q3-26",
      objective: "OUTCOME_SALES", bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      conversionModel: "purchase", conversionActionName: "offsite_conversion.fb_pixel_purchase",
      dailyBudget: 640, dailySpend: 494,
      cpm: 62, cpc: null, ctr: 0.0114, cvr: 0.0105, aov: 689,
      weekend: 1.14, trend: 0.18, frequency: 1.55,
    },
    {
      ...META_BASE, accountId: "", hasVideo: false,
      campaignName: "BLM | META | SALES | Retargeting 30d – katalog | Always-on",
      objective: "OUTCOME_SALES", bidStrategy: "COST_CAP",
      conversionModel: "purchase", conversionActionName: "offsite_conversion.fb_pixel_purchase",
      dailyBudget: 400, dailySpend: 314,
      cpm: 118, cpc: null, ctr: 0.0243, cvr: 0.0395, aov: 742,
      weekend: 1.08, trend: 0.06, frequency: 3.4,
    },
    {
      ...META_BASE, accountId: "", hasVideo: true,
      campaignName: "BLM | META | ENGAGEMENT | Reels UGC – nytt serum | Q3-26",
      objective: "OUTCOME_ENGAGEMENT", bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      conversionModel: "purchase", conversionActionName: "offsite_conversion.fb_pixel_purchase",
      dailyBudget: 240, dailySpend: 171,
      cpm: 33, cpc: null, ctr: 0.0089, cvr: 0.003, aov: 610,
      weekend: 1.22, trend: -0.15, frequency: 1.9, pausedAfterDays: 62,
    },
  ]),
  ...build("583-114-9027", "blomlyckan", [
    {
      ...GOOGLE_BASE, accountId: "", hasVideo: true,
      campaignName: "BLM | GADS | PMAX | Hudvård – produktflöde | Always-on",
      objective: "PERFORMANCE_MAX", channelType: "PERFORMANCE_MAX",
      bidStrategy: "MAXIMIZE_CONVERSION_VALUE",
      conversionModel: "purchase", conversionActionName: "Köp",
      dailyBudget: 520, dailySpend: 399,
      cpm: 44, cpc: null, ctr: 0.0121, cvr: 0.019, aov: 715,
      weekend: 1.11, trend: 0.14, frequency: null,
    },
    {
      ...GOOGLE_BASE, accountId: "", hasVideo: false,
      campaignName: "BLM | GADS | SEARCH | Varumärke | Always-on",
      objective: "SEARCH", channelType: "SEARCH", bidStrategy: "TARGET_ROAS",
      conversionModel: "purchase", conversionActionName: "Köp",
      dailyBudget: 140, dailySpend: 104,
      cpm: null, cpc: 3.1, ctr: 0.214, cvr: 0.088, aov: 803,
      weekend: 1.05, trend: 0.03, frequency: null,
    },
    {
      ...GOOGLE_BASE, accountId: "", hasVideo: false,
      campaignName: "BLM | GADS | SHOPPING | Bästsäljare | Q3-26",
      objective: "SHOPPING", channelType: "SHOPPING", bidStrategy: "TARGET_ROAS",
      conversionModel: "purchase", conversionActionName: "Köp",
      dailyBudget: 260, dailySpend: 187,
      cpm: null, cpc: 6.8, ctr: 0.0091, cvr: 0.0245, aov: 664,
      weekend: 1.16, trend: 0.21, frequency: null,
    },
  ]),
  ...build("snap_55501", "blomlyckan", [
    {
      ...SNAP_BASE, accountId: "", hasVideo: true,
      campaignName: "BLM | SNAP | WEB_CONVERSION | Gen Z – hudvårdsrutin | Q3-26",
      objective: "WEB_CONVERSION", bidStrategy: "AUTO_BID",
      conversionModel: "purchase", conversionActionName: "conversion_purchases",
      dailyBudget: 140, dailySpend: 95,
      cpm: 38, cpc: null, ctr: 0.0104, cvr: 0.012, aov: 512,
      weekend: 1.26, trend: 0.27, frequency: 1.72,
    },
    {
      ...SNAP_BASE, accountId: "", hasVideo: true,
      campaignName: "BLM | SNAP | VIDEO_VIEW | Story Ads – sommarkampanj | Q3-26",
      objective: "VIDEO_VIEW", bidStrategy: "AUTO_BID",
      conversionModel: "purchase", conversionActionName: "conversion_purchases",
      dailyBudget: 90, dailySpend: 57,
      cpm: 24, cpc: null, ctr: 0.0058, cvr: 0.004, aov: 470,
      weekend: 1.31, trend: -0.05, frequency: 2.35,
    },
  ]),

  /* ------------------------------------------------------------------- Taktil Analytics
     B2B SaaS: konverteringen är en bokad demo, och kunden HAR satt ett värde på
     leadet i plattformen — därför går ROAS att räkna här men inte hos Nordic
     Talent. Tydlig helgsvacka (weekend < 0.5), som all B2B-trafik. */
  ...build("act_1042779106", "taktil", [
    {
      ...META_BASE, accountId: "", hasVideo: true,
      campaignName: "TKA | META | LEADS | ICP – IT-chefer Norden | Q3-26",
      objective: "OUTCOME_LEADS", bidStrategy: "COST_CAP",
      conversionModel: "lead", conversionActionName: "Lead (Facebook-formulär)",
      dailyBudget: 1350, dailySpend: 1100,
      cpm: 132, cpc: null, ctr: 0.0097, cvr: 0.0267, aov: 1450,
      weekend: 0.42, trend: 0.16, frequency: 2.05,
    },
    {
      ...META_BASE, accountId: "", hasVideo: false,
      campaignName: "TKA | META | LEADS | Retargeting – demosida 30d | Always-on",
      objective: "OUTCOME_LEADS", bidStrategy: "COST_CAP",
      conversionModel: "lead", conversionActionName: "Lead (Facebook-formulär)",
      dailyBudget: 600, dailySpend: 480,
      cpm: 164, cpc: null, ctr: 0.0186, cvr: 0.0694, aov: 1650,
      weekend: 0.48, trend: 0.08, frequency: 4.1,
    },
  ]),
  ...build("620-447-3351", "taktil", [
    {
      ...GOOGLE_BASE, accountId: "", hasVideo: false,
      campaignName: "TKA | GADS | SEARCH | Varumärke | Always-on",
      objective: "SEARCH", channelType: "SEARCH", bidStrategy: "MAXIMIZE_CONVERSIONS",
      conversionModel: "lead", conversionActionName: "Demo bokad",
      dailyBudget: 320, dailySpend: 260,
      cpm: null, cpc: 8.4, ctr: 0.163, cvr: 0.126, aov: 1900,
      weekend: 0.44, trend: 0.05, frequency: null,
    },
    {
      ...GOOGLE_BASE, accountId: "", hasVideo: false,
      campaignName: "TKA | GADS | SEARCH | Konkurrenter | Q3-26",
      objective: "SEARCH", channelType: "SEARCH", bidStrategy: "TARGET_CPA",
      conversionModel: "lead", conversionActionName: "Demo bokad",
      dailyBudget: 900, dailySpend: 720,
      cpm: null, cpc: 41.5, ctr: 0.038, cvr: 0.0167, aov: 1300,
      weekend: 0.46, trend: -0.11, frequency: null,
    },
    {
      ...GOOGLE_BASE, accountId: "", hasVideo: false,
      campaignName: 'TKA | GADS | SEARCH | Kategori – "workforce analytics" | Q3-26',
      objective: "SEARCH", channelType: "SEARCH", bidStrategy: "TARGET_CPA",
      conversionModel: "lead", conversionActionName: "Demo bokad",
      dailyBudget: 1750, dailySpend: 1450,
      cpm: null, cpc: 33.8, ctr: 0.049, cvr: 0.0236, aov: 1500,
      weekend: 0.43, trend: 0.19, frequency: null,
    },
    {
      ...GOOGLE_BASE, accountId: "", hasVideo: false,
      campaignName: "TKA | GADS | DISPLAY | Remarketing – prissida | Always-on",
      objective: "DISPLAY", channelType: "DISPLAY", bidStrategy: "TARGET_CPA",
      conversionModel: "lead", conversionActionName: "Demo bokad",
      dailyBudget: 420, dailySpend: 348,
      cpm: 19, cpc: null, ctr: 0.0044, cvr: 0.0087, aov: 1150,
      weekend: 0.66, trend: -0.04, frequency: null,
    },
    {
      ...GOOGLE_BASE, accountId: "", hasVideo: true,
      campaignName: "TKA | GADS | VIDEO | YouTube – produktdemo | Q3-26",
      objective: "VIDEO", channelType: "VIDEO", bidStrategy: "MAXIMIZE_CONVERSIONS",
      conversionModel: "lead", conversionActionName: "Demo bokad",
      dailyBudget: 950, dailySpend: 800,
      cpm: 31, cpc: null, ctr: 0.0029, cvr: 0.0056, aov: 1100,
      weekend: 0.71, trend: 0.42, frequency: null, startsAfterDays: 56,
    },
  ]),

  /* ---------------------------------------------------------------- Ekbacken Interiör
     Heminredning: hög snittorder (~2 500 kr) och låg konverteringsgrad — typiskt
     för dyra, övervägda köp. Helguppgång (weekend > 1), tvärtemot B2B. */
  ...build("act_1042779884", "ekbacken", [
    {
      ...META_BASE, accountId: "", hasVideo: true,
      campaignName: "EKB | META | SALES | Prospecting – möbler brett | Q3-26",
      objective: "OUTCOME_SALES", bidStrategy: "LOWEST_COST_WITHOUT_CAP",
      conversionModel: "purchase", conversionActionName: "offsite_conversion.fb_pixel_purchase",
      dailyBudget: 470, dailySpend: 323,
      cpm: 57, cpc: null, ctr: 0.0102, cvr: 0.0025, aov: 2380,
      weekend: 1.18, trend: 0.11, frequency: 1.48,
    },
    {
      ...META_BASE, accountId: "", hasVideo: false,
      campaignName: "EKB | META | SALES | Retargeting – varukorg 14d | Always-on",
      objective: "OUTCOME_SALES", bidStrategy: "COST_CAP",
      conversionModel: "purchase", conversionActionName: "offsite_conversion.fb_pixel_purchase",
      dailyBudget: 260, dailySpend: 178,
      cpm: 128, cpc: null, ctr: 0.0271, cvr: 0.0146, aov: 2610,
      weekend: 1.09, trend: 0.07, frequency: 3.75,
    },
  ]),
  ...build("714-882-6045", "ekbacken", [
    {
      ...GOOGLE_BASE, accountId: "", hasVideo: true,
      campaignName: "EKB | GADS | PMAX | Heminredning – produktflöde | Always-on",
      objective: "PERFORMANCE_MAX", channelType: "PERFORMANCE_MAX",
      bidStrategy: "MAXIMIZE_CONVERSION_VALUE",
      conversionModel: "purchase", conversionActionName: "Köp",
      dailyBudget: 420, dailySpend: 289,
      cpm: 39, cpc: null, ctr: 0.0108, cvr: 0.0045, aov: 2470,
      weekend: 1.13, trend: 0.16, frequency: null,
    },
    {
      ...GOOGLE_BASE, accountId: "", hasVideo: false,
      campaignName: "EKB | GADS | SEARCH | Varumärke | Always-on",
      objective: "SEARCH", channelType: "SEARCH", bidStrategy: "TARGET_ROAS",
      conversionModel: "purchase", conversionActionName: "Köp",
      dailyBudget: 110, dailySpend: 72,
      cpm: null, cpc: 3.6, ctr: 0.198, cvr: 0.0339, aov: 2740,
      weekend: 1.06, trend: 0.02, frequency: null,
    },
    {
      ...GOOGLE_BASE, accountId: "", hasVideo: false,
      campaignName: "EKB | GADS | SHOPPING | Soffor & fåtöljer | Q3-26",
      objective: "SHOPPING", channelType: "SHOPPING", bidStrategy: "TARGET_ROAS",
      conversionModel: "purchase", conversionActionName: "Köp",
      dailyBudget: 310, dailySpend: 210,
      cpm: null, cpc: 9.4, ctr: 0.0084, cvr: 0.0059, aov: 2905,
      weekend: 1.21, trend: 0.24, frequency: null,
    },
  ]),
  ...build("snap_55507", "ekbacken", [
    {
      ...SNAP_BASE, accountId: "", hasVideo: true,
      campaignName: "EKB | SNAP | WEB_CONVERSION | Första hemmet 21–34 | Q3-26",
      objective: "WEB_CONVERSION", bidStrategy: "AUTO_BID",
      conversionModel: "purchase", conversionActionName: "conversion_purchases",
      dailyBudget: 110, dailySpend: 68,
      cpm: 31, cpc: null, ctr: 0.0079, cvr: 0.0031, aov: 1980,
      weekend: 1.28, trend: 0.13, frequency: 1.64,
    },
  ]),

  /* --------------------------------------------------------------- Vårljus Vårdklinik
     Lokal lead gen, bara Google. Konverteringen är en bokning; inget värde satt
     på åtgärden → CPA är nyckeltalet, ROAS visas som "–". */
  ...build("806-233-7719", "varljus", [
    {
      ...GOOGLE_BASE, accountId: "", hasVideo: false,
      campaignName: "VLJ | GADS | SEARCH | Varumärke | Always-on",
      objective: "SEARCH", channelType: "SEARCH", bidStrategy: "MAXIMIZE_CONVERSIONS",
      conversionModel: "lead", conversionActionName: "Bokning – klinik",
      dailyBudget: 120, dailySpend: 95,
      cpm: null, cpc: 5.1, ctr: 0.229, cvr: 0.098, aov: null,
      weekend: 0.79, trend: 0.06, frequency: null,
    },
    {
      ...GOOGLE_BASE, accountId: "", hasVideo: false,
      campaignName: "VLJ | GADS | SEARCH | Behandlingar – Stockholm | Always-on",
      objective: "SEARCH", channelType: "SEARCH", bidStrategy: "TARGET_CPA",
      conversionModel: "lead", conversionActionName: "Bokning – klinik",
      dailyBudget: 520, dailySpend: 420,
      cpm: null, cpc: 27.6, ctr: 0.071, cvr: 0.030, aov: null,
      weekend: 0.74, trend: 0.1, frequency: null,
    },
    {
      ...GOOGLE_BASE, accountId: "", hasVideo: false,
      campaignName: "VLJ | GADS | SEARCH | Behandlingar – Göteborg | Q3-26",
      objective: "SEARCH", channelType: "SEARCH", bidStrategy: "TARGET_CPA",
      conversionModel: "lead", conversionActionName: "Bokning – klinik",
      dailyBudget: 320, dailySpend: 250,
      cpm: null, cpc: 24.9, ctr: 0.066, cvr: 0.0256, aov: null,
      weekend: 0.76, trend: 0.15, frequency: null,
    },
    {
      ...GOOGLE_BASE, accountId: "", hasVideo: true,
      campaignName: "VLJ | GADS | DEMAND_GEN | Hälsokontroll | Q3-26",
      objective: "DEMAND_GEN", channelType: "DEMAND_GEN", bidStrategy: "MAXIMIZE_CONVERSIONS",
      conversionModel: "lead", conversionActionName: "Bokning – klinik",
      dailyBudget: 200, dailySpend: 159,
      cpm: 29, cpc: null, ctr: 0.0068, cvr: 0.0067, aov: null,
      weekend: 0.91, trend: 0.22, frequency: null,
    },
  ]),
];

export const CLIENT_BY_ID = new Map(CLIENTS.map((c) => [c.id, c]));
export const ACCOUNT_BY_ID = new Map(ACCOUNTS.map((a) => [a.id, a]));
export const CAMPAIGN_BY_ID = new Map(CAMPAIGNS.map((c) => [c.campaignId, c]));

/**
 * Valori nativi dei breakdown, per piattaforma. Le tassonomie NON sono unificate
 * apposta: Meta, Google e Snapchat usano bucket diversi (soprattutto per l'età),
 * e fonderli darebbe numeri falsamente confrontabili.
 */
export const BREAKDOWN_VALUES: Record<
  Platform,
  Record<string, { key: string; label: string; weight: number }[]>
> = {
  meta: {
    placement: [
      { key: "instagram:reels", label: "Instagram · Reels", weight: 0.27 },
      { key: "instagram:feed", label: "Instagram · Feed", weight: 0.21 },
      { key: "facebook:feed", label: "Facebook · Feed", weight: 0.24 },
      { key: "facebook:story", label: "Facebook · Stories", weight: 0.09 },
      { key: "instagram:story", label: "Instagram · Stories", weight: 0.11 },
      { key: "audience_network:classic", label: "Audience Network", weight: 0.05 },
      { key: "messenger:feed", label: "Messenger", weight: 0.03 },
    ],
    device: [
      { key: "iphone", label: "iPhone", weight: 0.41 },
      { key: "android_smartphone", label: "Android-mobil", weight: 0.34 },
      { key: "desktop", label: "Desktop", weight: 0.16 },
      { key: "ipad", label: "iPad", weight: 0.06 },
      { key: "android_tablet", label: "Android-surfplatta", weight: 0.03 },
    ],
    age: [
      { key: "18-24", label: "18–24", weight: 0.14 },
      { key: "25-34", label: "25–34", weight: 0.29 },
      { key: "35-44", label: "35–44", weight: 0.26 },
      { key: "45-54", label: "45–54", weight: 0.18 },
      { key: "55-64", label: "55–64", weight: 0.09 },
      { key: "65+", label: "65+", weight: 0.04 },
    ],
    gender: [
      { key: "female", label: "Kvinnor", weight: 0.54 },
      { key: "male", label: "Män", weight: 0.43 },
      { key: "unknown", label: "Okänt", weight: 0.03 },
    ],
    country: [
      { key: "SE", label: "Sverige", weight: 0.68 },
      { key: "NO", label: "Norge", weight: 0.13 },
      { key: "DK", label: "Danmark", weight: 0.1 },
      { key: "FI", label: "Finland", weight: 0.06 },
      { key: "DE", label: "Tyskland", weight: 0.03 },
    ],
  },
  google: {
    placement: [
      { key: "SEARCH", label: "Sök", weight: 0.62 },
      { key: "SEARCH_PARTNERS", label: "Sökpartner", weight: 0.08 },
      { key: "CONTENT", label: "Display", weight: 0.17 },
      { key: "YOUTUBE", label: "YouTube", weight: 0.13 },
    ],
    device: [
      { key: "MOBILE", label: "Mobil", weight: 0.63 },
      { key: "DESKTOP", label: "Desktop", weight: 0.29 },
      { key: "TABLET", label: "Surfplatta", weight: 0.06 },
      { key: "CONNECTED_TV", label: "Connected TV", weight: 0.02 },
    ],
    age: [
      { key: "AGE_RANGE_18_24", label: "18–24", weight: 0.11 },
      { key: "AGE_RANGE_25_34", label: "25–34", weight: 0.24 },
      { key: "AGE_RANGE_35_44", label: "35–44", weight: 0.23 },
      { key: "AGE_RANGE_45_54", label: "45–54", weight: 0.17 },
      { key: "AGE_RANGE_55_64", label: "55–64", weight: 0.1 },
      { key: "AGE_RANGE_65_UP", label: "65+", weight: 0.05 },
      { key: "UNDETERMINED", label: "Okänd", weight: 0.1 },
    ],
    gender: [
      { key: "FEMALE", label: "Kvinnor", weight: 0.46 },
      { key: "MALE", label: "Män", weight: 0.44 },
      { key: "UNDETERMINED", label: "Okänt", weight: 0.1 },
    ],
    country: [
      { key: "SE", label: "Sverige", weight: 0.74 },
      { key: "NO", label: "Norge", weight: 0.11 },
      { key: "DK", label: "Danmark", weight: 0.08 },
      { key: "FI", label: "Finland", weight: 0.05 },
      { key: "DE", label: "Tyskland", weight: 0.02 },
    ],
  },
  snapchat: {
    placement: [
      { key: "INTERSTITIAL", label: "Between Content", weight: 0.52 },
      { key: "STORY", label: "Stories", weight: 0.29 },
      { key: "SPOTLIGHT", label: "Spotlight", weight: 0.19 },
    ],
    device: [
      { key: "iOS", label: "iOS", weight: 0.61 },
      { key: "ANDROID", label: "Android", weight: 0.39 },
    ],
    age: [
      { key: "13-17", label: "13–17", weight: 0.08 },
      { key: "18-20", label: "18–20", weight: 0.19 },
      { key: "21-24", label: "21–24", weight: 0.27 },
      { key: "25-34", label: "25–34", weight: 0.31 },
      { key: "35+", label: "35+", weight: 0.15 },
    ],
    gender: [
      { key: "female", label: "Kvinnor", weight: 0.58 },
      { key: "male", label: "Män", weight: 0.39 },
      { key: "other", label: "Övrigt", weight: 0.03 },
    ],
    country: [
      { key: "se", label: "Sverige", weight: 0.79 },
      { key: "no", label: "Norge", weight: 0.09 },
      { key: "dk", label: "Danmark", weight: 0.07 },
      { key: "fi", label: "Finland", weight: 0.05 },
    ],
  },
};

/**
 * Su Google la rete su cui una campagna può servire NON è libera: dipende dal
 * suo `advertising_channel_type`. Una campagna SEARCH non produce impression su
 * YouTube, e una DISPLAY non ne produce sulla rete di ricerca. Applicare gli
 * stessi pesi a tutte le campagne darebbe un breakdown impossibile — quindi
 * `segments.ad_network_type` viene ripartito con questi pesi, per tipo.
 * Un peso a 0 resta 0: la riga semplicemente non esiste per quella campagna.
 */
export const GOOGLE_NETWORK_BY_CHANNEL: Record<string, Record<string, number>> = {
  SEARCH: { SEARCH: 0.87, SEARCH_PARTNERS: 0.13, CONTENT: 0, YOUTUBE: 0 },
  SHOPPING: { SEARCH: 0.78, SEARCH_PARTNERS: 0.09, CONTENT: 0.13, YOUTUBE: 0 },
  DISPLAY: { SEARCH: 0, SEARCH_PARTNERS: 0, CONTENT: 1, YOUTUBE: 0 },
  VIDEO: { SEARCH: 0, SEARCH_PARTNERS: 0, CONTENT: 0.06, YOUTUBE: 0.94 },
  DEMAND_GEN: { SEARCH: 0, SEARCH_PARTNERS: 0, CONTENT: 0.42, YOUTUBE: 0.58 },
  PERFORMANCE_MAX: { SEARCH: 0.38, SEARCH_PARTNERS: 0.06, CONTENT: 0.31, YOUTUBE: 0.25 },
};

/** Etichette leggibili per gli enum objective/channel type delle tre API. */
export const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_LEADS: "Leads",
  OUTCOME_SALES: "Försäljning",
  OUTCOME_AWARENESS: "Kännedom",
  OUTCOME_ENGAGEMENT: "Engagemang",
  OUTCOME_TRAFFIC: "Trafik",
  SEARCH: "Sök",
  PERFORMANCE_MAX: "Performance Max",
  SHOPPING: "Shopping",
  DISPLAY: "Display",
  VIDEO: "Video",
  DEMAND_GEN: "Demand Gen",
  WEB_CONVERSION: "Webbkonvertering",
  VIDEO_VIEW: "Videovisning",
  AWARENESS: "Kännedom",
};
