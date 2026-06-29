import React, { useState, useMemo, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";

/* ============================================================================
   Savant Ads — dashboard cross-platform (Meta · Google · Snapchat)

   Due viste (tab): "Rapportering" (report) e "Konton" (panoramica account).
   Dati: prova le API (`/api/metrics`, `/api/accounts`, che servono la view SQL
   `ad_metrics_enriched` e l'unione accounts+sync_log). Se l'API non risponde,
   usa i dati SEED incorporati — così il file funziona sia collegato al backend
   sia da solo (nessuna pagina bianca). Il badge in alto indica la sorgente.

   UI bilingue EN/SV: tutte le stringhe d'interfaccia stanno in `STRINGS`, il
   toggle in alto a destra cambia lingua (scelta salvata in localStorage).
   I nomi di clienti/campagne NON si traducono: sono dati, arrivano dal DB.
   ========================================================================== */

const API_METRICS = "/api/metrics";
const API_ACCOUNTS = "/api/accounts";
const ALERT_THRESHOLD = 0.9; // segnala i clienti dal 90% del budget mensile in su

const C = {
  canvas: "#FAFAF9",
  panel: "#FFFFFF",
  ink: "#17171C",
  sub: "#71717A",
  line: "#EAEAE4",
  accent: "#5B4FE9",
};
const PLATFORM = {
  meta:     { label: "Meta",     color: "#0866FF" },
  google:   { label: "Google",   color: "#1F9D55" },
  snapchat: { label: "Snapchat", color: "#E2A400" },
};
const SYNC_COLOR = {
  success: ["#DCFCE7", "#166534"],
  error:   ["#FEE2E2", "#991B1B"],
  running: ["#FEF3C7", "#92400E"],
};
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS = "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";

// ---- i18n: solo le stringhe d'interfaccia ---------------------------------
const STRINGS = {
  en: {
    locale: "en-US",
    badgeSeed: "seed data",
    badgeLive: "live data",
    subtitle: "Unified reporting · Meta · Google · Snapchat",
    tabReport: "Reporting",
    tabAccounts: "Accounts",
    spend: "Spend",
    impressions: "Impressions",
    clicks: "Clicks",
    conversions: "Conversions",
    roas: "ROAS",
    cpa: "CPA",
    daysSuffix: "d",                     // bottoni 7d / 14d / 30d
    days: (n) => `${n} days`,
    dailySpend: "Daily spend by platform",
    spendByPlatform: "Spend by platform",
    budgetPerClient: "Budget per client (month)",
    campaigns: "Campaigns",
    cols: ["Campaign", "Spend", "Impr.", "Clicks", "CTR", "Conv.", "CPA", "ROAS"],
    alertsTitle: "Budget alerts",
    alertOver: "over budget",
    alertNear: "near limit",
    accountsTitle: "Account overview",
    accCols: ["Platform", "Client", "Spend", "Sync status", "Last sync"],
    sync: { success: "ok", error: "error", running: "running" },
    accountsApiNote: "API offline — sync status unavailable",
    footerPre: "Data from the ",
    footerPost: " view (or the built-in seed if the API is offline). Swap the source and the dashboard shows real data with no other changes.",
  },
  sv: {
    locale: "sv-SE",
    badgeSeed: "testdata",
    badgeLive: "live-data",
    subtitle: "Enad rapportering · Meta · Google · Snapchat",
    tabReport: "Rapportering",
    tabAccounts: "Konton",
    spend: "Kostnad",
    impressions: "Visningar",
    clicks: "Klick",
    conversions: "Konverteringar",
    roas: "ROAS",
    cpa: "CPA",
    daysSuffix: "d",
    days: (n) => `${n} dagar`,
    dailySpend: "Daglig kostnad per plattform",
    spendByPlatform: "Kostnad per plattform",
    budgetPerClient: "Budget per kund (månad)",
    campaigns: "Kampanjer",
    cols: ["Kampanj", "Kostnad", "Visn.", "Klick", "CTR", "Konv.", "CPA", "ROAS"],
    alertsTitle: "Budgetlarm",
    alertOver: "över budget",
    alertNear: "nära gränsen",
    accountsTitle: "Kontoöversikt",
    accCols: ["Plattform", "Kund", "Kostnad", "Synk-status", "Senaste synk"],
    sync: { success: "ok", error: "fel", running: "pågår" },
    accountsApiNote: "API:et är nere — synk-status saknas",
    footerPre: "Data från vyn ",
    footerPost: " (eller inbyggd seed-data om API:et är nere). Byt källa så visar instrumentpanelen riktig data utan andra ändringar.",
  },
};

const CAMPAIGNS = ["Brand Awareness", "Retargeting", "AI Twin Launch", "Lead Gen Q3"];
const ACCOUNTS = {
  meta:     { name: "Savant – Meta",       client: "Nordic Talent AB", budget: 8000 },
  google:   { name: "Savant – Google Ads", client: "Aurora Studios",   budget: 5000 },
  snapchat: { name: "Savant – Snapchat",   client: "Helix Labs",       budget: 12000 },
};

// seed deterministico (stessa vista a ogni render)
function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
function useSeedData() {
  return useMemo(() => {
    const rnd = seededRandom(42);
    const rows = [];
    const today = new Date();
    for (let d = 29; d >= 0; d--) {
      const day = new Date(today); day.setDate(today.getDate() - d);
      const iso = day.toISOString().slice(0, 10);
      for (const p of Object.keys(PLATFORM)) {
        for (const camp of CAMPAIGNS) {
          const spend = 40 + rnd() * 360;
          const impressions = Math.round(spend * (80 + rnd() * 120));
          const clicks = Math.round(impressions * (0.005 + rnd() * 0.035));
          const conversions = +(clicks * (0.02 + rnd() * 0.1)).toFixed(1);
          const conversion_value = +(conversions * (15 + rnd() * 45)).toFixed(2);
          rows.push({
            platform: p, account_name: ACCOUNTS[p].name, client_name: ACCOUNTS[p].client,
            client_monthly_budget: ACCOUNTS[p].budget, campaign_name: camp, date: iso,
            currency: "EUR", spend: +spend.toFixed(2), impressions, clicks,
            conversions, conversion_value,
          });
        }
      }
    }
    return rows;
  }, []);
}

// Prova /api/metrics; in caso di errore/vuoto resta sul seed. Ritorna la sorgente.
function useMetrics() {
  const seed = useSeedData();
  const [rows, setRows] = useState(seed);
  const [source, setSource] = useState("seed");
  useEffect(() => {
    let cancelled = false;
    fetch(API_METRICS)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data) && data.length) { setRows(data); setSource("live"); }
      })
      .catch(() => { /* API non raggiungibile → resta sui dati seed */ });
    return () => { cancelled = true; };
  }, [seed]);
  return { rows, source };
}

// Prova /api/accounts quando la tab "Konton" è attiva. Fallback: null (il chiamante
// usa una panoramica derivata dai dati metriche).
function useAccounts(activeView, sinceIso) {
  const [rows, setRows] = useState(null);
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (activeView !== "accounts") return;
    let cancelled = false;
    fetch(`${API_ACCOUNTS}?since=${sinceIso}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => { if (!cancelled && Array.isArray(data)) { setRows(data); setLive(true); } })
      .catch(() => { if (!cancelled) { setRows(null); setLive(false); } });
    return () => { cancelled = true; };
  }, [activeView, sinceIso]);
  return { rows, live };
}

function KpiCard({ label, value, sub }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}` }} className="rounded-lg p-4">
      <div style={{ color: C.sub, fontFamily: SANS }} className="text-xs uppercase tracking-wider">{label}</div>
      <div style={{ color: C.ink, fontFamily: MONO }} className="text-2xl mt-2 tabular-nums">{value}</div>
      {sub && <div style={{ color: C.sub, fontFamily: MONO }} className="text-xs mt-1 tabular-nums">{sub}</div>}
    </div>
  );
}

export default function App() {
  const { rows: data, source } = useMetrics();
  const [view, setView] = useState("report");
  const [range, setRange] = useState(30);
  const [active, setActive] = useState({ meta: true, google: true, snapchat: true });
  const [lang, setLang] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("savant-lang");
      if (saved === "en" || saved === "sv") return saved;
    }
    return "sv";
  });
  const changeLang = (l) => {
    setLang(l);
    if (typeof window !== "undefined") window.localStorage.setItem("savant-lang", l);
  };

  const t = STRINGS[lang];
  // formattatori dipendenti dalla lingua (separatori migliaia, decimali, % )
  const fmt = (n, d = 0) =>
    n.toLocaleString(t.locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  const eur = (n) => "€" + fmt(n, 0);
  const pct = (n, d = 2) => fmt(n, d) + (lang === "sv" ? " %" : "%");

  const sinceIso = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - range);
    return d.toISOString().slice(0, 10);
  }, [range]);

  const filtered = useMemo(
    () => data.filter((r) => active[r.platform] && r.date >= sinceIso),
    [data, sinceIso, active],
  );

  const totals = useMemo(() => {
    const tot = { spend: 0, impressions: 0, clicks: 0, conversions: 0, value: 0 };
    for (const r of filtered) {
      tot.spend += r.spend; tot.impressions += r.impressions; tot.clicks += r.clicks;
      tot.conversions += r.conversions; tot.value += r.conversion_value;
    }
    return tot;
  }, [filtered]);

  const timeseries = useMemo(() => {
    const byDay = {};
    for (const r of filtered) {
      byDay[r.date] = byDay[r.date] || { date: r.date, meta: 0, google: 0, snapchat: 0 };
      byDay[r.date][r.platform] += r.spend;
    }
    return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ ...d, label: d.date.slice(5) }));
  }, [filtered]);

  const byPlatform = useMemo(() => {
    const m = {};
    for (const r of filtered) m[r.platform] = (m[r.platform] || 0) + r.spend;
    return Object.entries(m).map(([k, v]) => ({ platform: k, spend: +v.toFixed(0) }));
  }, [filtered]);

  const byClient = useMemo(() => {
    const m = {};
    for (const r of filtered) {
      m[r.client_name] = m[r.client_name] || { client: r.client_name, spend: 0, budget: r.client_monthly_budget };
      m[r.client_name].spend += r.spend;
    }
    return Object.values(m).map((c) => ({ ...c, pct: c.budget ? c.spend / c.budget : 0 }));
  }, [filtered]);

  // Task 6 — clienti dal 90% del budget in su
  const alerts = useMemo(
    () => byClient.filter((c) => c.budget && c.pct >= ALERT_THRESHOLD).sort((a, b) => b.pct - a.pct),
    [byClient],
  );

  const campaigns = useMemo(() => {
    const m = {};
    for (const r of filtered) {
      const key = r.platform + "·" + r.campaign_name;
      m[key] = m[key] || { platform: r.platform, name: r.campaign_name, spend: 0, impressions: 0, clicks: 0, conversions: 0, value: 0 };
      const a = m[key];
      a.spend += r.spend; a.impressions += r.impressions; a.clicks += r.clicks;
      a.conversions += r.conversions; a.value += r.conversion_value;
    }
    return Object.values(m).map((a) => ({
      ...a,
      ctr: a.impressions ? a.clicks / a.impressions : 0,
      cpa: a.conversions ? a.spend / a.conversions : 0,
      roas: a.spend ? a.value / a.spend : 0,
    })).sort((a, b) => b.spend - a.spend);
  }, [filtered]);

  // Panoramica account: live da /api/accounts, oppure derivata dai dati metriche.
  const { rows: accLiveRows, live: accLive } = useAccounts(view, sinceIso);
  const accountsFallback = useMemo(() => {
    const m = {};
    for (const r of data) {
      if (r.date < sinceIso) continue;
      const key = r.platform + "|" + (r.client_name || "");
      m[key] = m[key] || { platform: r.platform, client_name: r.client_name, spend: 0, last_sync_status: null, last_sync_at: null };
      m[key].spend += r.spend;
    }
    return Object.values(m).sort((a, b) => a.platform.localeCompare(b.platform));
  }, [data, sinceIso]);
  const accountRows = accLiveRows ?? accountsFallback;

  const roas = totals.spend ? totals.value / totals.spend : 0;
  const cpa = totals.conversions ? totals.spend / totals.conversions : 0;
  const live = source === "live";

  return (
    <div style={{ background: C.canvas, minHeight: "100vh", fontFamily: SANS, color: C.ink }} className="p-6">
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            Savant Ads
            <span style={{ background: live ? "#DCFCE7" : "#FEF3C7", color: live ? "#166534" : "#92400E" }} className="text-xs px-2 py-0.5 rounded-full font-normal">{live ? t.badgeLive : t.badgeSeed}</span>
          </h1>
          <p style={{ color: C.sub }} className="text-sm">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* language toggle EN / SV */}
          <div className="flex items-center gap-1">
            {["en", "sv"].map((l) => (
              <button key={l} onClick={() => changeLang(l)}
                aria-pressed={lang === l}
                style={{ background: lang === l ? C.accent : C.panel, color: lang === l ? "#fff" : C.sub, border: `1px solid ${lang === l ? C.accent : C.line}` }}
                className="text-xs px-2.5 py-1.5 rounded-md font-semibold uppercase tracking-wide">{l}</button>
            ))}
          </div>
          {/* range giorni */}
          <div className="flex items-center gap-2">
            {[7, 14, 30].map((d) => (
              <button key={d} onClick={() => setRange(d)}
                style={{ background: range === d ? C.ink : C.panel, color: range === d ? "#fff" : C.sub, border: `1px solid ${C.line}` }}
                className="text-xs px-3 py-1.5 rounded-md font-medium">{d}{t.daysSuffix}</button>
            ))}
          </div>
        </div>
      </div>

      {/* tabs: Rapportering / Konton */}
      <div className="flex gap-1 mb-5" style={{ borderBottom: `1px solid ${C.line}` }}>
        {[["report", t.tabReport], ["accounts", t.tabAccounts]].map(([k, label]) => (
          <button key={k} onClick={() => setView(k)}
            style={{ color: view === k ? C.ink : C.sub, borderBottom: view === k ? `2px solid ${C.accent}` : "2px solid transparent", marginBottom: -1 }}
            className="text-sm px-3 py-2 font-medium">{label}</button>
        ))}
      </div>

      {view === "report" && (
        <>
          {/* platform filter */}
          <div className="flex gap-2 mb-5">
            {Object.entries(PLATFORM).map(([k, p]) => (
              <button key={k} onClick={() => setActive((a) => ({ ...a, [k]: !a[k] }))}
                style={{ background: active[k] ? C.panel : "transparent", border: `1px solid ${active[k] ? p.color : C.line}`, color: active[k] ? C.ink : C.sub, opacity: active[k] ? 1 : 0.5 }}
                className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5">
                <span style={{ width: 8, height: 8, borderRadius: 99, background: p.color }} />
                {p.label}
              </button>
            ))}
          </div>

          {/* alert budget (Task 6) */}
          {alerts.length > 0 && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA" }} className="rounded-lg p-4 mb-6">
              <div style={{ color: "#991B1B" }} className="text-xs uppercase tracking-wider mb-2 font-semibold">{t.alertsTitle}</div>
              <div className="flex flex-col gap-1.5">
                {alerts.map((c) => (
                  <div key={c.client} className="flex items-center justify-between text-sm">
                    <span style={{ color: C.ink }}>{c.client}</span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums" style={{ color: "#991B1B", fontFamily: MONO }}>{eur(c.spend)} / {eur(c.budget)} ({pct(c.pct * 100, 0)})</span>
                      <span style={{ background: c.pct > 1 ? "#DC2626" : "#F59E0B", color: "#fff" }} className="text-xs px-2 py-0.5 rounded-full">{c.pct > 1 ? t.alertOver : t.alertNear}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <KpiCard label={t.spend} value={eur(totals.spend)} sub={t.days(range)} />
            <KpiCard label={t.impressions} value={fmt(totals.impressions)} />
            <KpiCard label={t.clicks} value={fmt(totals.clicks)} sub={`CTR ${pct(totals.impressions ? totals.clicks / totals.impressions * 100 : 0)}`} />
            <KpiCard label={t.conversions} value={fmt(totals.conversions)} />
            <KpiCard label={t.roas} value={roas.toFixed(2) + "×"} sub={eur(totals.value)} />
            <KpiCard label={t.cpa} value={eur(cpa)} />
          </div>

          {/* chart spesa nel tempo */}
          <div style={{ background: C.panel, border: `1px solid ${C.line}` }} className="rounded-lg p-4 mb-6">
            <div style={{ color: C.sub }} className="text-xs uppercase tracking-wider mb-3">{t.dailySpend}</div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={timeseries}>
                <defs>
                  {Object.entries(PLATFORM).map(([k, p]) => (
                    <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={p.color} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={p.color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.sub }} tickLine={false} axisLine={{ stroke: C.line }} />
                <YAxis tick={{ fontSize: 11, fill: C.sub }} tickLine={false} axisLine={false} width={44}
                  tickFormatter={(v) => "€" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)} />
                <Tooltip formatter={(v, n) => [eur(v), PLATFORM[n]?.label || n]}
                  contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontFamily: MONO, fontSize: 12 }} />
                {Object.entries(PLATFORM).filter(([k]) => active[k]).map(([k, p]) => (
                  <Area key={k} type="monotone" dataKey={k} stackId="1" stroke={p.color} fill={`url(#g-${k})`} strokeWidth={1.5} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* breakdown piattaforma */}
            <div style={{ background: C.panel, border: `1px solid ${C.line}` }} className="rounded-lg p-4">
              <div style={{ color: C.sub }} className="text-xs uppercase tracking-wider mb-3">{t.spendByPlatform}</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={byPlatform} layout="vertical" margin={{ left: 8 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="platform" width={70} tickLine={false} axisLine={false}
                    tick={{ fontSize: 12, fill: C.ink }} tickFormatter={(k) => PLATFORM[k]?.label || k} />
                  <Tooltip formatter={(v) => eur(v)} contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontFamily: MONO, fontSize: 12 }} />
                  <Bar dataKey="spend" radius={[0, 4, 4, 0]} barSize={22}>
                    {byPlatform.map((d) => <Cell key={d.platform} fill={PLATFORM[d.platform].color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* budget per cliente — feature richiesta da Rebecca */}
            <div style={{ background: C.panel, border: `1px solid ${C.line}` }} className="rounded-lg p-4">
              <div style={{ color: C.sub }} className="text-xs uppercase tracking-wider mb-3">{t.budgetPerClient}</div>
              <div className="space-y-4 mt-2">
                {byClient.map((c) => {
                  const over = c.pct > 1;
                  return (
                    <div key={c.client}>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: C.ink }}>{c.client}</span>
                        <span style={{ color: over ? "#DC2626" : C.sub, fontFamily: MONO }} className="tabular-nums">
                          {eur(c.spend)} / {eur(c.budget)}
                        </span>
                      </div>
                      <div style={{ background: C.line }} className="h-2 rounded-full overflow-hidden">
                        <div style={{ width: `${Math.min(c.pct * 100, 100)}%`, background: over ? "#DC2626" : C.accent }} className="h-full rounded-full" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* tabella campagne */}
          <div style={{ background: C.panel, border: `1px solid ${C.line}` }} className="rounded-lg p-4">
            <div style={{ color: C.sub }} className="text-xs uppercase tracking-wider mb-3">{t.campaigns}</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ fontFamily: MONO }}>
                <thead>
                  <tr style={{ color: C.sub, borderBottom: `1px solid ${C.line}` }} className="text-xs">
                    {t.cols.map((h, i) => (
                      <th key={h} style={{ fontFamily: SANS }} className={`pb-2 font-medium ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.platform + c.name} style={{ borderBottom: `1px solid ${C.line}` }}>
                      <td className="py-2.5 text-left">
                        <span className="flex items-center gap-2" style={{ fontFamily: SANS }}>
                          <span style={{ width: 7, height: 7, borderRadius: 99, background: PLATFORM[c.platform].color }} />
                          {c.name}
                        </span>
                      </td>
                      <td className="text-right tabular-nums">{eur(c.spend)}</td>
                      <td className="text-right tabular-nums">{fmt(c.impressions)}</td>
                      <td className="text-right tabular-nums">{fmt(c.clicks)}</td>
                      <td className="text-right tabular-nums">{pct(c.ctr * 100)}</td>
                      <td className="text-right tabular-nums">{fmt(c.conversions)}</td>
                      <td className="text-right tabular-nums">{eur(c.cpa)}</td>
                      <td className="text-right tabular-nums" style={{ color: c.roas >= 2 ? "#1F9D55" : C.ink }}>{c.roas.toFixed(2)}×</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p style={{ color: C.sub }} className="text-xs mt-4">
            {t.footerPre}<code>ad_metrics_enriched</code>{t.footerPost}
          </p>
        </>
      )}

      {view === "accounts" && (
        <div style={{ background: C.panel, border: `1px solid ${C.line}` }} className="rounded-lg p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div style={{ color: C.sub }} className="text-xs uppercase tracking-wider">{t.accountsTitle}</div>
            {!accLive && <span style={{ color: C.sub }} className="text-xs">{t.accountsApiNote}</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ fontFamily: MONO }}>
              <thead>
                <tr style={{ color: C.sub, borderBottom: `1px solid ${C.line}` }} className="text-xs">
                  {t.accCols.map((h, i) => (
                    <th key={h} style={{ fontFamily: SANS }} className={`pb-2 font-medium ${i < 2 ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accountRows.map((a, idx) => {
                  const [bg, fg] = SYNC_COLOR[a.last_sync_status] || ["#F4F4F5", C.sub];
                  return (
                    <tr key={a.platform + (a.client_name || "") + idx} style={{ borderBottom: `1px solid ${C.line}` }}>
                      <td className="py-2.5 text-left">
                        <span className="flex items-center gap-2" style={{ fontFamily: SANS }}>
                          <span style={{ width: 7, height: 7, borderRadius: 99, background: PLATFORM[a.platform]?.color || C.sub }} />
                          {PLATFORM[a.platform]?.label || a.platform}
                        </span>
                      </td>
                      <td className="py-2.5 text-left" style={{ fontFamily: SANS }}>{a.client_name || "—"}</td>
                      <td className="text-right tabular-nums">{eur(a.spend)}</td>
                      <td className="text-right">
                        <span style={{ background: bg, color: fg }} className="text-xs px-2 py-0.5 rounded-full">{t.sync[a.last_sync_status] || "—"}</span>
                      </td>
                      <td className="text-right tabular-nums" style={{ color: C.sub }}>{a.last_sync_at ? a.last_sync_at.slice(0, 16).replace("T", " ") : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
