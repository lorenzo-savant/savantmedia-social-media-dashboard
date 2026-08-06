/**
 * Catalogo delle sorgenti API — la "prova" dietro ogni numero della dashboard.
 *
 * Questo file è la ragione per cui la demo non contiene metriche inventate:
 * per ogni valore mostrato è dichiarato l'endpoint, il nome esatto del campo
 * nell'API e la trappola di conversione da gestire. La pagina "Datakällor"
 * rende questo catalogo leggibile a schermo.
 *
 * Versioni allineate a backend/config.py: Meta v25.0, Google Ads v24,
 * Snapchat Marketing API v1.
 */

import type { Platform } from "./types";

export const API_VERSIONS: Record<Platform, string> = {
  meta: "v25.0",
  google: "v24",
  snapchat: "v1",
};

export interface FieldMapping {
  /** Nome della metrica come appare nella dashboard. */
  metric: string;
  /** null = l'API non espone questo dato a questa grana. */
  field: string | null;
  note?: string;
}

export interface PlatformSource {
  platform: Platform;
  label: string;
  /** Endpoint del report giornaliero a livello campagna. */
  endpoint: string;
  method: string;
  auth: string;
  scope: string;
  /** Come si chiede la grana giornaliera. */
  granularity: string;
  /** Variabili .env necessarie per accendere il connettore. */
  envVars: string[];
  /** Dimensioni di breakdown realmente supportate, con i valori nativi. */
  breakdowns: { param: string; label: string; values: string[] }[];
  fields: FieldMapping[];
  /** Trappole note: sono quelle già gestite nei connettori Python. */
  gotchas: string[];
  rateLimit: string;
  docs: string;
}

export const API_SOURCES: PlatformSource[] = [
  {
    platform: "meta",
    label: "Meta Marketing API — Insights",
    endpoint: "/{ad-account-id}/insights",
    method: "POST (async) → GET /{report_run_id}/insights",
    auth: "System User token (Business portfolio)",
    scope: "ads_read",
    granularity: "level=campaign & time_increment=1",
    envVars: ["META_ACCESS_TOKEN", "META_AD_ACCOUNTS"],
    breakdowns: [
      {
        param: "publisher_platform",
        label: "Plattform",
        values: ["facebook", "instagram", "audience_network", "messenger", "threads"],
      },
      {
        param: "platform_position",
        label: "Placering",
        values: ["feed", "story", "reels", "explore", "video_feeds", "marketplace", "search"],
      },
      {
        param: "impression_device",
        label: "Enhet",
        values: ["iphone", "android_smartphone", "desktop", "ipad", "android_tablet"],
      },
      { param: "age", label: "Ålder", values: ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"] },
      { param: "gender", label: "Kön", values: ["male", "female", "unknown"] },
      { param: "country", label: "Land", values: ["SE", "NO", "DK", "FI", "DE"] },
      {
        param: "hourly_stats_aggregated_by_advertiser_time_zone",
        label: "Timme",
        values: ["00:00:00 - 00:59:59", "…", "23:00:00 - 23:59:59"],
      },
    ],
    fields: [
      { metric: "Kostnad", field: "spend", note: "Kommer som sträng — casta till float." },
      { metric: "Visningar", field: "impressions", note: "Sträng." },
      { metric: "Klick", field: "clicks", note: "Alla klick. `inline_link_clicks` = endast länkklick." },
      {
        metric: "Konverteringar",
        field: "actions[] → action_type",
        note: "Inget enda 'conversions'-fält: summera de action_type ni räknar (purchase, lead, complete_registration…).",
      },
      {
        metric: "Konverteringsvärde",
        field: "action_values[] → action_type",
        note: "Endast för actions med värde (köp). Leads saknar oftast värde → ROAS går inte att räkna.",
      },
      { metric: "Räckvidd", field: "reach", note: "Deduplicerad per begärd period — summeras INTE över dagar." },
      { metric: "Frekvens", field: "frequency", note: "impressions / reach för perioden. Kvot: räkna, summera aldrig." },
      { metric: "Video (ThruPlay)", field: "video_thruplay_watched_actions", note: "≥15 s eller hela klippet." },
      { metric: "CTR / CPC / CPM", field: "ctr, cpc, cpm", note: "Vi räknar dem själva i SQL-vyn — additiva råtal ger rätt totaler." },
      { metric: "Valuta", field: "account_currency", note: "Per konto — kan skilja sig mellan konton." },
      { metric: "Kampanjmål", field: "campaign.objective", note: "Från kampanjentiteten, inte från Insights." },
      { metric: "Dagsbudget", field: "campaign.daily_budget", note: "I minsta valutaenhet (öre) → dela med 100." },
      { metric: "Status", field: "campaign.effective_status", note: "ACTIVE / PAUSED / ARCHIVED …" },
      { metric: "Kvalitetsranking", field: "quality_ranking", note: "Endast på annonsnivå och först vid ≥500 visningar." },
    ],
    gotchas: [
      "Alla numeriska fält returneras som strängar.",
      "Attributionsfönstret (7d_click,1d_view) gör att de senaste dagarnas konverteringar fortsätter stiga — därför hämtar synken om 28 dagar varje natt.",
      "Räckvidd och frekvens är dedupliserade per period: att summera dagsvärden ger fel svar.",
      "Stora rapporter måste köras asynkront (report_run_id + polling), annars timeout.",
    ],
    rateLimit: "Felkod 17 (User request limit reached) — throttling baserad på kontots spend. Exponentiell backoff.",
    docs: "developers.facebook.com/docs/marketing-api/insights",
  },
  {
    platform: "google",
    label: "Google Ads API — GAQL searchStream",
    endpoint: "/customers/{customerId}/googleAds:searchStream",
    method: "POST (GAQL)",
    auth: "OAuth2 refresh token + developer-token",
    scope: "https://www.googleapis.com/auth/adwords",
    granularity: "FROM campaign … segments.date",
    envVars: [
      "GOOGLE_DEVELOPER_TOKEN",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_REFRESH_TOKEN",
      "GOOGLE_CUSTOMER_IDS",
      "GOOGLE_LOGIN_CUSTOMER_ID (MCC, valfri)",
    ],
    breakdowns: [
      { param: "segments.device", label: "Enhet", values: ["MOBILE", "DESKTOP", "TABLET", "CONNECTED_TV"] },
      {
        param: "segments.ad_network_type",
        label: "Nätverk",
        values: ["SEARCH", "SEARCH_PARTNERS", "CONTENT", "YOUTUBE", "MIXED"],
      },
      { param: "geographic_view", label: "Land", values: ["SE", "NO", "DK", "FI", "DE"] },
      {
        param: "age_range_view",
        label: "Ålder",
        values: ["AGE_RANGE_18_24", "AGE_RANGE_25_34", "AGE_RANGE_35_44", "AGE_RANGE_45_54", "AGE_RANGE_55_64", "AGE_RANGE_65_UP", "UNDETERMINED"],
      },
      { param: "gender_view", label: "Kön", values: ["MALE", "FEMALE", "UNDETERMINED"] },
      { param: "segments.hour", label: "Timme", values: ["0 … 23"] },
    ],
    fields: [
      { metric: "Kostnad", field: "metrics.cost_micros", note: "Mikroenheter → dela med 1 000 000." },
      { metric: "Visningar", field: "metrics.impressions", note: "int64 levereras som sträng." },
      { metric: "Klick", field: "metrics.clicks" },
      { metric: "Konverteringar", field: "metrics.conversions", note: "Endast åtgärder markerade 'Primär'. `all_conversions` = allt." },
      { metric: "Konverteringsvärde", field: "metrics.conversions_value", note: "0 om konverteringsåtgärden saknar värde." },
      { metric: "Räckvidd", field: null, note: "Finns INTE per kampanj/dag i Google Ads API. Kolumnen lämnas tom — den estimeras inte." },
      { metric: "Frekvens", field: null, note: "Följer av räckvidden — alltså inte heller tillgänglig." },
      { metric: "Videovisningar", field: "metrics.video_views" },
      { metric: "Impression share", field: "metrics.search_impression_share", note: "Bara sökkampanjer; saknas när volymen är för låg." },
      { metric: "Kampanjtyp", field: "campaign.advertising_channel_type", note: "SEARCH / PERFORMANCE_MAX / DISPLAY / VIDEO / DEMAND_GEN / SHOPPING." },
      { metric: "Budget", field: "campaign_budget.amount_micros", note: "Mikroenheter." },
      { metric: "Budstrategi", field: "campaign.bidding_strategy_type" },
      { metric: "Status", field: "campaign.status", note: "ENABLED / PAUSED / REMOVED." },
      { metric: "Valuta", field: "customer.currency_code" },
    ],
    gotchas: [
      "cost_micros är mikroenheter: 1 234 560 000 = 1 234,56 kr.",
      "GAQL skrivs i snake_case men REST-svaret kommer i camelCase (costMicros, conversionsValue).",
      "int64 (impressions, clicks, cost_micros) kommer som strängar.",
      "Kund-ID i URL:en utan bindestreck: 123-456-7890 → 1234567890.",
      "Ligger kontona under en MCC måste headern login-customer-id sättas.",
      "searchStream svarar med en array av chunkar — resultaten måste konkateneras.",
    ],
    rateLimit: "Kvot per developer token (Basic: 15 000 operationer/dag). 429/500/503 → backoff.",
    docs: "developers.google.com/google-ads/api/docs/query/overview",
  },
  {
    platform: "snapchat",
    label: "Snapchat Marketing API — Stats",
    endpoint: "/campaigns/{campaign_id}/stats",
    method: "GET",
    auth: "OAuth2 refresh token",
    scope: "snapchat-marketing-api",
    granularity: "granularity=DAY",
    envVars: ["SNAPCHAT_CLIENT_ID", "SNAPCHAT_CLIENT_SECRET", "SNAPCHAT_REFRESH_TOKEN", "SNAPCHAT_AD_ACCOUNT_IDS"],
    breakdowns: [
      { param: "breakdown=os_type", label: "OS", values: ["iOS", "ANDROID"] },
      { param: "breakdown=country", label: "Land", values: ["se", "no", "dk", "fi", "de"] },
      { param: "breakdown=gender", label: "Kön", values: ["male", "female", "other"] },
      { param: "breakdown=age_bucket", label: "Ålder", values: ["13-17", "18-20", "21-24", "25-34", "35+"] },
      { param: "breakdown=ad", label: "Annons", values: ["per ad_id"] },
    ],
    fields: [
      { metric: "Kostnad", field: "spend", note: "Mikroenheter i kontots valuta → dela med 1 000 000." },
      { metric: "Visningar", field: "impressions" },
      { metric: "Klick", field: "swipes", note: "Snapchats motsvarighet till klick — det finns inget 'clicks'-fält." },
      { metric: "Konverteringar", field: "conversion_purchases / conversion_sign_ups", note: "Ett fält per konverteringstyp — det finns ingen samlad summa." },
      { metric: "Konverteringsvärde", field: "conversion_purchases_value", note: "Kräver Snap Pixel eller App Ads Kit." },
      { metric: "Räckvidd", field: "uniques", note: "Deduplicerad per period — summeras inte över dagar." },
      { metric: "Frekvens", field: "frequency" },
      { metric: "Videovisningar", field: "video_views", note: "≥2 s. Kvartiler: quartile_1/2/3, view_completion." },
      { metric: "Swipe-up-frekvens", field: "swipe_up_percent" },
      { metric: "Kampanjmål", field: "campaign.objective", note: "AWARENESS / WEB_CONVERSION / APP_INSTALLS / LEAD_GENERATION / VIDEO_VIEW." },
      { metric: "Status", field: "campaign.status", note: "ACTIVE / PAUSED." },
      { metric: "Valuta", field: "adaccount.currency" },
    ],
    gotchas: [
      "spend är i mikroenheter, precis som Google.",
      "'swipes' måste mappas till klick — annars saknas kolumnen i den gemensamma modellen.",
      "Konverteringar ligger i separata fält per typ; vilka som räknas måste bestämmas per kund.",
      "Stats hämtas per entitet (campaign/adsquad/ad) — inte som ett samlat kontoreport.",
    ],
    rateLimit: "Standardkvot per app; 429 → backoff.",
    docs: "developers.snap.com/api/marketing-api/Ads-API/measurement",
  },
];

/**
 * Parametro API che produce ciascun breakdown mostrato nella dashboard.
 * Le tassonomie restano quelle native: non vengono fuse tra piattaforme.
 */
export const BREAKDOWN_PARAM: Record<
  Platform,
  Record<"placement" | "device" | "age" | "gender" | "country", string>
> = {
  meta: {
    placement: "breakdowns=publisher_platform,platform_position",
    device: "breakdowns=impression_device",
    age: "breakdowns=age",
    gender: "breakdowns=gender",
    country: "breakdowns=country",
  },
  google: {
    placement: "segments.ad_network_type",
    device: "segments.device",
    age: "FROM age_range_view",
    gender: "FROM gender_view",
    country: "FROM geographic_view",
  },
  snapchat: {
    placement: "breakdown=placement",
    device: "breakdown=os_type",
    age: "breakdown=age_bucket",
    gender: "breakdown=gender",
    country: "breakdown=country",
  },
};

/** Metriche derivate: si calcolano dai grezzi, mai salvate (evita valori "congelati"). */
export const DERIVED_METRICS = [
  { metric: "CTR", formula: "clicks / impressions", note: "Räknas på summan, inte som medelvärde av dagliga CTR." },
  { metric: "CPC", formula: "spend / clicks" },
  { metric: "CPM", formula: "spend / impressions × 1000" },
  { metric: "CPA", formula: "spend / conversions" },
  { metric: "ROAS", formula: "conversion_value / spend", note: "Odefinierad när konverteringsvärde saknas — visas som “–”, aldrig som 0." },
  { metric: "Frekvens", formula: "impressions / reach", note: "Endast Meta och Snapchat: Google saknar räckvidd." },
  { metric: "Budgetutnyttjande", formula: "kostnad hittills i månaden / månadsbudget", note: "Månadsbudgeten är ett affärsvärde (tabellen clients), inte ett API-fält." },
];

/** Campi che una dashboard ads mostra spesso ma che le API NON danno: qui non ci sono. */
export const NOT_AVAILABLE = [
  {
    label: "Intäkt / marginal per order",
    reason: "Ligger i affärssystemet eller e-handelsplattformen, inte i annons-API:erna. Kräver egen integration.",
  },
  {
    label: "Räckvidd för Google Ads",
    reason: "Google Ads API exponerar ingen räckvidd per kampanj och dag.",
  },
  {
    label: "Cross-platform unik räckvidd",
    reason: "Ingen plattform kan deduplicera mot en annan — samma person räknas en gång per plattform.",
  },
  {
    label: "Organiska sociala siffror",
    reason: "Annat API (Instagram Graph / Page Insights) med egen behörighet — inte del av annonsdatan.",
  },
  {
    label: "Kundens LTV / churn",
    reason: "CRM-data. Kan kopplas på senare, men får aldrig blandas in som om den kom från annons-API:et.",
  },
];
