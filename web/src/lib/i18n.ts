/**
 * Stringhe di interfaccia, svedese e inglese.
 *
 * Solo la UI si traduce. Nomi di clienti, campagne, account, enum delle API e
 * nomi di campo restano com'è: sono DATI, e tradurli renderebbe impossibile
 * ritrovarli dentro Meta Business Manager o Google Ads.
 */

import type { Lang } from "./format";

export type { Lang };

const sv = {
  brand: "Savant Ads",
  tagline: "Enad annonsrapportering · Meta · Google · Snapchat",
  demoBadge: "DEMO",
  demoTitle: "Demodata",
  demoBody:
    "Inga API-nycklar är kopplade ännu. Kundnamn, kampanjer och siffror är påhittade — men varje kolumn motsvarar ett verkligt fält i Meta-, Google- och Snapchat-API:erna. Se Datakällor för fält-för-fält-mappningen.",

  nav: {
    overview: "Översikt",
    campaigns: "Kampanjer",
    clients: "Kunder",
    insights: "Insikter",
    accounts: "Konton",
    sources: "Datakällor",
  },

  filters: {
    period: "Period",
    platform: "Plattform",
    client: "Kund",
    allClients: "Alla kunder",
    days: (n: number) => `${n} dagar`,
    apply: "Använd",
    reset: "Nollställ",
    filtersTitle: "Filter",
    close: "Stäng",
    comparedTo: "jämfört med föregående period",
  },

  metric: {
    spend: "Kostnad",
    impressions: "Visningar",
    clicks: "Klick",
    conversions: "Konverteringar",
    conversionValue: "Konverteringsvärde",
    value: "Värde",
    roas: "ROAS",
    cpa: "CPA",
    ctr: "CTR",
    cpc: "CPC",
    cpm: "CPM",
    reach: "Räckvidd",
    frequency: "Frekvens",
    videoViews: "Videovisningar",
    budget: "Budget",
    dailyBudget: "Dagsbudget",
  },

  chart: {
    dailySpend: "Daglig kostnad per plattform",
    dailySpendSub: "Staplad yta — summan är totalkostnaden per dag",
    spendByPlatform: "Kostnad per plattform",
    funnel: "Från visning till konvertering",
    funnelSub: "Varje steg i förhållande till det föregående",
    topCampaigns: "Största kampanjer",
    budgetPacing: "Budgetpacing per kund",
    budgetPacingSub: "Prognos för hela månaden mot avtalad månadsbudget",
    placement: "Placering",
    device: "Enhet",
    age: "Ålder",
    gender: "Kön",
    country: "Land",
    tableView: "Tabellvy",
    chartView: "Diagram",
    ofImpressions: "av visningarna",
    noData: "Ingen data i den valda perioden.",
  },

  table: {
    campaign: "Kampanj",
    client: "Kund",
    platform: "Plattform",
    account: "Konto",
    objective: "Mål",
    status: "Status",
    share: "Andel",
    spend: "Kostnad",
    impressions: "Visn.",
    clicks: "Klick",
    ctr: "CTR",
    cpc: "CPC",
    conversions: "Konv.",
    cpa: "CPA",
    roas: "ROAS",
    currency: "Valuta",
    lastSync: "Senaste synk",
    rows: "Rader",
    campaigns: "Kampanjer",
    sortBy: "Sortera",
    showAll: "Visa alla",
    showLess: "Visa färre",
  },

  status: {
    active: "Aktiv",
    paused: "Pausad",
    success: "ok",
    error: "fel",
    running: "pågår",
  },

  pacing: {
    over: "Över budget",
    near: "Nära gränsen",
    ok: "I fas",
    under: "Under budget",
    title: "Budgetlarm",
    projected: "Prognos",
    monthToDate: "Hittills i månaden",
    ofBudget: "av månadsbudget",
    daysLeft: (n: number) => `${n} dagar kvar av månaden`,
    noAlerts: "Inga kunder ligger utanför sin budgetplan.",
  },

  notes: {
    attribution: "Attributionsfönster",
    attributionBody: (n: number) =>
      `De senaste ${n} dagarnas konverteringar är ännu inte färdigattribuerade (Meta 7d_click/1d_view, Google datadriven). Nattsynken hämtar om 28 dagar, så siffrorna justeras uppåt i efterhand.`,
    reach: "Räckvidd",
    reachBody:
      "Räckvidd är deduplicerad över perioden och summeras därför inte per dag. Google Ads API exponerar ingen räckvidd per kampanj och dag — den kolumnen är tom, inte uppskattad.",
    roasNull: "ROAS visas som “–” när konverteringsåtgärden saknar värde i plattformen (typiskt för leads). Det är inte 0.",
    ratios: "CTR, CPC, CPM, CPA och ROAS räknas på periodens summor — aldrig som medelvärde av dagsvärden.",
    currency: "Alla belopp i SEK, kontots valuta. Ingen valutaomräkning görs.",
  },

  overview: {
    title: "Översikt",
    subtitle: "Alla plattformar, alla kunder",
    heroLabel: "Total annonskostnad",
    activeCampaigns: "kampanjer med leverans",
    across: "över",
    accounts: "konton",
    clients: "kunder",
  },

  campaigns: {
    title: "Kampanjer",
    subtitle: "Varje rad är en kampanj i perioden",
    search: "Sök kampanj…",
    noMatch: "Ingen kampanj matchar sökningen.",
    detail: "Kampanjdetalj",
    bidStrategy: "Budstrategi",
    conversionAction: "Konverteringsåtgärd",
    campaignId: "Kampanj-ID",
    dailyBudgetNote: "Dagsbudget enligt kampanjinställningen i plattformen.",
    breakdownNote: "Fördelningen kommer från plattformens egna breakdown-parametrar.",
  },

  clients: {
    title: "Kunder",
    subtitle: "Resultat och budgetläge per kund",
    industry: "Bransch",
    monthlyBudget: "Månadsbudget",
    revenueTracked: "Konverteringsvärde spåras",
    revenueNotTracked: "Inget konverteringsvärde konfigurerat",
    perPlatform: "Fördelning per plattform",
    leadClient: "Leadkund — CPA är nyckeltalet, inte ROAS.",
  },

  insights: {
    title: "Insikter",
    subtitle: "Fördelningar hämtade med plattformarnas egna breakdown-parametrar",
    dimension: "Dimension",
    taxonomyNote:
      "Taxonomierna slås medvetet INTE ihop. Meta, Google och Snapchat använder olika åldersintervall och placeringsnamn — en sammanslagning skulle ge siffror som ser jämförbara ut utan att vara det.",
    apiParam: "API-parameter",
  },

  accounts: {
    title: "Konton",
    subtitle: "Anslutning, synkstatus och täckning per annonskonto",
    connection: "Anslutning",
    credentials: "Nycklar",
    connected: "Ansluten",
    demoMode: "Demoläge",
    missingKeys: "Saknade nycklar",
    allSet: "Alla nycklar satta",
    apiVersion: "API-version",
    scope: "Behörighet",
    timezone: "Tidszon",
    attribution: "Attribution",
    externalId: "Konto-ID",
    syncTitle: "Senaste synk",
    syncNote:
      "I demoläge är synkloggen simulerad. Med nycklar på plats kommer den från tabellen sync_log, som nattjobbet skriver till.",
    duration: "Tid",
    whatIsMissing: "Vad som saknas för skarp data",
  },

  sources: {
    title: "Datakällor",
    subtitle: "Varje siffra i dashboarden mappad till sitt fält i API:et",
    intro:
      "Den här sidan är kontraktet: allt som visas kommer från ett fält som faktiskt går att hämta med en API-nyckel. Ingenting är uppskattat, ingenting är påhittat.",
    endpoint: "Endpoint",
    method: "Metod",
    auth: "Autentisering",
    granularity: "Granularitet",
    envVars: "Miljövariabler",
    fields: "Fältmappning",
    metric: "Mätvärde i dashboarden",
    apiField: "Fält i API:et",
    note: "Att tänka på",
    breakdowns: "Breakdowns som stöds",
    gotchas: "Fallgropar",
    rateLimit: "Rate limit",
    derived: "Härledda mätvärden",
    formula: "Formel",
    notAvailable: "Vad API:erna INTE ger",
    notAvailableIntro:
      "Lika viktigt som vad som finns: det här går inte att hämta ur annons-API:erna, och finns därför inte i dashboarden.",
    notProvided: "Finns inte i API:et",
    docs: "Dokumentation",
  },

  a11y: {
    theme: "Växla ljust/mörkt läge",
    lang: "Byt språk",
    menu: "Meny",
    sortAsc: "stigande",
    sortDesc: "fallande",
  },

  footer: {
    line: "Samma vyer läser skarp data när nycklarna är på plats — inga ändringar i gränssnittet.",
    updated: "Data till och med",
  },
};

type Dict = typeof sv;

const en: Dict = {
  brand: "Savant Ads",
  tagline: "Unified ad reporting · Meta · Google · Snapchat",
  demoBadge: "DEMO",
  demoTitle: "Demo data",
  demoBody:
    "No API keys are connected yet. Client names, campaigns and figures are fictional — but every column maps to a real field in the Meta, Google and Snapchat APIs. See Data sources for the field-by-field mapping.",

  nav: {
    overview: "Overview",
    campaigns: "Campaigns",
    clients: "Clients",
    insights: "Insights",
    accounts: "Accounts",
    sources: "Data sources",
  },

  filters: {
    period: "Period",
    platform: "Platform",
    client: "Client",
    allClients: "All clients",
    days: (n: number) => `${n} days`,
    apply: "Apply",
    reset: "Reset",
    filtersTitle: "Filters",
    close: "Close",
    comparedTo: "vs. previous period",
  },

  metric: {
    spend: "Spend",
    impressions: "Impressions",
    clicks: "Clicks",
    conversions: "Conversions",
    conversionValue: "Conversion value",
    value: "Value",
    roas: "ROAS",
    cpa: "CPA",
    ctr: "CTR",
    cpc: "CPC",
    cpm: "CPM",
    reach: "Reach",
    frequency: "Frequency",
    videoViews: "Video views",
    budget: "Budget",
    dailyBudget: "Daily budget",
  },

  chart: {
    dailySpend: "Daily spend by platform",
    dailySpendSub: "Stacked area — the sum is total spend that day",
    spendByPlatform: "Spend by platform",
    funnel: "From impression to conversion",
    funnelSub: "Each step relative to the one before",
    topCampaigns: "Largest campaigns",
    budgetPacing: "Budget pacing by client",
    budgetPacingSub: "Full-month projection against the agreed monthly budget",
    placement: "Placement",
    device: "Device",
    age: "Age",
    gender: "Gender",
    country: "Country",
    tableView: "Table view",
    chartView: "Chart",
    ofImpressions: "of impressions",
    noData: "No data in the selected period.",
  },

  table: {
    campaign: "Campaign",
    client: "Client",
    platform: "Platform",
    account: "Account",
    objective: "Objective",
    status: "Status",
    share: "Share",
    spend: "Spend",
    impressions: "Impr.",
    clicks: "Clicks",
    ctr: "CTR",
    cpc: "CPC",
    conversions: "Conv.",
    cpa: "CPA",
    roas: "ROAS",
    currency: "Currency",
    lastSync: "Last sync",
    rows: "Rows",
    campaigns: "Campaigns",
    sortBy: "Sort",
    showAll: "Show all",
    showLess: "Show fewer",
  },

  status: {
    active: "Active",
    paused: "Paused",
    success: "ok",
    error: "error",
    running: "running",
  },

  pacing: {
    over: "Over budget",
    near: "Near limit",
    ok: "On plan",
    under: "Under budget",
    title: "Budget alerts",
    projected: "Projection",
    monthToDate: "Month to date",
    ofBudget: "of monthly budget",
    daysLeft: (n: number) => `${n} days left this month`,
    noAlerts: "No client is outside its budget plan.",
  },

  notes: {
    attribution: "Attribution window",
    attributionBody: (n: number) =>
      `Conversions from the last ${n} days are not fully attributed yet (Meta 7d_click/1d_view, Google data-driven). The nightly sync re-pulls 28 days, so these numbers get revised upward.`,
    reach: "Reach",
    reachBody:
      "Reach is deduplicated across the period and therefore never summed per day. The Google Ads API exposes no reach per campaign and day — that column is empty, not estimated.",
    roasNull: "ROAS shows “–” when the conversion action has no value configured in the platform (typical for leads). That is not 0.",
    ratios: "CTR, CPC, CPM, CPA and ROAS are computed on period sums — never as an average of daily values.",
    currency: "All amounts in SEK, the account currency. No currency conversion is applied.",
  },

  overview: {
    title: "Overview",
    subtitle: "All platforms, all clients",
    heroLabel: "Total ad spend",
    activeCampaigns: "campaigns delivering",
    across: "across",
    accounts: "accounts",
    clients: "clients",
  },

  campaigns: {
    title: "Campaigns",
    subtitle: "One row per campaign in the period",
    search: "Search campaign…",
    noMatch: "No campaign matches the search.",
    detail: "Campaign detail",
    bidStrategy: "Bid strategy",
    conversionAction: "Conversion action",
    campaignId: "Campaign ID",
    dailyBudgetNote: "Daily budget as configured on the campaign in the platform.",
    breakdownNote: "The split comes from the platform's own breakdown parameters.",
  },

  clients: {
    title: "Clients",
    subtitle: "Performance and budget status per client",
    industry: "Industry",
    monthlyBudget: "Monthly budget",
    revenueTracked: "Conversion value tracked",
    revenueNotTracked: "No conversion value configured",
    perPlatform: "Split by platform",
    leadClient: "Lead client — CPA is the KPI here, not ROAS.",
  },

  insights: {
    title: "Insights",
    subtitle: "Breakdowns pulled with each platform's own breakdown parameters",
    dimension: "Dimension",
    taxonomyNote:
      "The taxonomies are deliberately NOT merged. Meta, Google and Snapchat use different age buckets and placement names — merging them would produce numbers that look comparable without being so.",
    apiParam: "API parameter",
  },

  accounts: {
    title: "Accounts",
    subtitle: "Connection, sync status and coverage per ad account",
    connection: "Connection",
    credentials: "Keys",
    connected: "Connected",
    demoMode: "Demo mode",
    missingKeys: "Missing keys",
    allSet: "All keys set",
    apiVersion: "API version",
    scope: "Scope",
    timezone: "Time zone",
    attribution: "Attribution",
    externalId: "Account ID",
    syncTitle: "Last sync",
    syncNote:
      "In demo mode the sync log is simulated. With keys in place it comes from the sync_log table written by the nightly job.",
    duration: "Duration",
    whatIsMissing: "What is missing for live data",
  },

  sources: {
    title: "Data sources",
    subtitle: "Every number in the dashboard mapped to its API field",
    intro:
      "This page is the contract: everything shown comes from a field that can actually be fetched with an API key. Nothing is estimated, nothing is invented.",
    endpoint: "Endpoint",
    method: "Method",
    auth: "Auth",
    granularity: "Granularity",
    envVars: "Environment variables",
    fields: "Field mapping",
    metric: "Metric in the dashboard",
    apiField: "API field",
    note: "Watch out for",
    breakdowns: "Supported breakdowns",
    gotchas: "Pitfalls",
    rateLimit: "Rate limit",
    derived: "Derived metrics",
    formula: "Formula",
    notAvailable: "What the APIs do NOT provide",
    notAvailableIntro:
      "As important as what exists: this cannot be pulled from the ad APIs, and therefore is not in the dashboard.",
    notProvided: "Not in the API",
    docs: "Documentation",
  },

  a11y: {
    theme: "Toggle light/dark mode",
    lang: "Change language",
    menu: "Menu",
    sortAsc: "ascending",
    sortDesc: "descending",
  },

  footer: {
    line: "The same views read live data once the keys are in place — no interface changes.",
    updated: "Data through",
  },
};

export const DICT: Record<Lang, Dict> = { sv, en };

export function t(lang: Lang): Dict {
  return DICT[lang];
}
