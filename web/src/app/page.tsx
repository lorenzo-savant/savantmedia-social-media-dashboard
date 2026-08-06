import Link from "next/link";
import { BarList } from "@/components/charts/bar-list";
import { ChartCard } from "@/components/charts/chart-card";
import { FunnelLadder } from "@/components/charts/funnel-ladder";
import { Legend } from "@/components/charts/legend";
import { StackedAreaChart } from "@/components/charts/stacked-area";
import { CampaignTable } from "@/components/campaigns/campaign-table";
import { FilterShell } from "@/components/shell/filter-shell";
import { IconAlert, IconChevronRight } from "@/components/ui/icons";
import {
  Badge,
  Card,
  CardHead,
  Meter,
  Note,
  PLATFORM_LABEL,
  PLATFORM_VAR,
  PageHeader,
  cx,
} from "@/components/ui/primitives";
import { StatTile } from "@/components/ui/stat-tile";
import {
  byCampaign,
  byPlatform,
  dailyMetric,
  dailySpendSeries,
  delta,
  filterRows,
  funnelOf,
  pacingFor,
  previousRows,
  totalsOf,
} from "@/lib/aggregate";
import { CLIENTS, CLIENT_BY_ID, OBJECTIVE_LABELS } from "@/lib/demo/catalog";
import { MATURING_DAYS, addDays, getDataset } from "@/lib/demo/generate";
import { money, moneyCompact, num, pct, rangeLabel, roasText, shortDate } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/prefs";
import { parseFilters, type SearchParams } from "@/lib/query";
import type { Platform } from "@/lib/types";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const lang = await getLang();
  const s = t(lang);
  const sp = await searchParams;
  const f = parseFilters(sp);

  const ds = getDataset();
  const to = ds.endDate;
  const from = addDays(to, -(f.days - 1));

  const rows = filterRows(ds.rows, f, to);
  const prev = previousRows(ds.rows, f, to);
  const totals = totalsOf(rows, f.days);
  const prevTotals = totalsOf(prev, f.days);

  const series = dailySpendSeries(rows, from, to);
  const platforms = byPlatform(rows, f.days);
  const campaigns = byCampaign(rows, f.days);
  const pacing = pacingFor(ds.rows, f.clientId ? CLIENTS.filter((c) => c.id === f.clientId) : CLIENTS, to);
  const alerts = pacing.filter((p) => p.status === "over" || p.status === "near");

  const activeSeries = f.platforms.map((p) => ({
    key: p,
    label: PLATFORM_LABEL[p],
    color: PLATFORM_VAR[p],
  }));

  const funnel = funnelOf(totals);
  const accountsCount = new Set(rows.map((r) => r.accountId)).size;
  const clientsCount = new Set(rows.map((r) => r.clientId)).size;

  return (
    <>
      <PageHeader
        title={s.overview.title}
        sub={`${s.overview.subtitle} · ${rangeLabel(from, to, lang)}`}
        right={
          <Link
            href="/datakallor"
            className="inline-flex items-center gap-1 rounded-lg border border-hairline px-2.5 py-1.5 text-[12px] font-medium text-ink-secondary transition-colors hover:bg-sunken"
          >
            {s.nav.sources}
            <IconChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="mb-4">
        <Note title={s.demoTitle}>
          {s.demoBody}{" "}
          <Link href="/datakallor" className="font-medium text-ink underline underline-offset-2">
            {s.nav.sources} →
          </Link>
        </Note>
      </div>

      <FilterShell
        lang={lang}
        clients={CLIENTS.map((c) => ({ id: c.id, name: c.name }))}
        from={from}
        to={to}
      >
        {/* ------------------------------------------------------------ KPI */}
        <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-3">
          <StatTile
            lang={lang}
            emphasis
            label={s.overview.heroLabel}
            value={money(totals.spend, lang)}
            delta={delta(totals.spend, prevTotals.spend)}
            good="neutral"
            sub={`${campaigns.length} ${s.overview.activeCampaigns} · ${accountsCount} ${s.overview.accounts} · ${clientsCount} ${s.overview.clients}`}
            spark={dailyMetric(rows, from, to, "spend")}
          />
          <StatTile
            lang={lang}
            label={s.metric.conversions}
            value={num(totals.conversions, lang, totals.conversions % 1 ? 1 : 0)}
            delta={delta(totals.conversions, prevTotals.conversions)}
            good="up"
            sub={`CPA ${money(totals.cpa, lang)}`}
            spark={dailyMetric(rows, from, to, "conversions")}
          />
          <StatTile
            lang={lang}
            label={s.metric.roas}
            value={roasText(totals.roas, lang)}
            delta={totals.roas != null ? delta(totals.roas, prevTotals.roas ?? 0) : undefined}
            good="up"
            sub={
              totals.conversionValue != null
                ? `${s.metric.value} ${moneyCompact(totals.conversionValue, lang)}`
                : s.clients.revenueNotTracked
            }
          />
          <StatTile
            lang={lang}
            label={s.metric.clicks}
            value={num(totals.clicks, lang)}
            delta={delta(totals.clicks, prevTotals.clicks)}
            good="up"
            sub={`CTR ${pct(totals.ctr, lang)} · CPC ${money(totals.cpc, lang, 2)}`}
            spark={dailyMetric(rows, from, to, "clicks")}
          />
          <StatTile
            lang={lang}
            label={s.metric.impressions}
            value={num(totals.impressions, lang)}
            delta={delta(totals.impressions, prevTotals.impressions)}
            good="neutral"
            sub={`CPM ${money(totals.cpm, lang, 2)}`}
          />
          {/* Nessun tile "räckvidd" a livello aggregato: nessuna piattaforma
              deduplica contro le altre, quindi una reach cross-platform
              sarebbe un numero senza significato. Sta per piattaforma nella
              card qui sotto e per campagna nel dettaglio. */}
          <StatTile
            lang={lang}
            label={s.metric.videoViews}
            value={totals.videoViews != null ? num(totals.videoViews, lang) : "–"}
            delta={
              totals.videoViews != null && prevTotals.videoViews != null
                ? delta(totals.videoViews, prevTotals.videoViews)
                : undefined
            }
            good="up"
            sub={
              totals.videoViews != null && totals.impressions
                ? `${pct(totals.videoViews / totals.impressions, lang, 1)} ${s.chart.ofImpressions}`
                : undefined
            }
          />
        </div>

        {/* -------------------------------------------------- spesa nel tempo */}
        <div className="mb-4">
          <ChartCard
            lang={lang}
            title={s.chart.dailySpend}
            sub={s.chart.dailySpendSub}
            legend={
              <Legend
                items={activeSeries.map((a) => ({
                  label: a.label,
                  color: a.color,
                  value: money(
                    platforms.find((p) => p.meta === a.key)?.totals.spend ?? 0,
                    lang,
                  ),
                }))}
              />
            }
            chart={
              <div className="px-3 sm:px-3">
                <StackedAreaChart
                  data={series}
                  series={activeSeries}
                  lang={lang}
                  maturingDays={MATURING_DAYS}
                />
              </div>
            }
            table={
              <div className="max-h-80 overflow-auto rounded-lg border border-hairline">
                <table className="w-full text-[12px]">
                  <thead className="sticky top-0 bg-surface">
                    <tr className="border-b border-hairline text-ink-muted">
                      <th scope="col" className="py-1.5 pl-2 text-left font-medium">
                        {s.footer.updated}
                      </th>
                      {activeSeries.map((a) => (
                        <th key={a.key} scope="col" className="px-2 py-1.5 text-right font-medium">
                          {a.label}
                        </th>
                      ))}
                      <th scope="col" className="py-1.5 pr-2 text-right font-medium">
                        Σ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...series].reverse().map((d) => (
                      <tr key={d.date} className="border-b border-hairline last:border-0">
                        <td className="py-1.5 pl-2 text-ink-secondary">{shortDate(d.date, lang)}</td>
                        {activeSeries.map((a) => (
                          <td key={a.key} className="tnum px-2 py-1.5 text-right text-ink">
                            {money(d[a.key], lang)}
                          </td>
                        ))}
                        <td className="tnum py-1.5 pr-2 text-right font-semibold text-ink">
                          {money(d.total, lang)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
            footer={s.notes.attributionBody(MATURING_DAYS)}
          />
        </div>

        {/* ------------------------------------- split piattaforma + funnel */}
        <div className="mb-4 grid gap-4 lg:grid-cols-2">
          <ChartCard
            lang={lang}
            title={s.chart.spendByPlatform}
            sub={s.notes.ratios}
            chart={
              <div className="px-4 pb-4 pt-2 sm:px-5">
                <BarList
                  items={platforms.map((p) => {
                    const platform = p.meta as Platform;
                    return {
                      key: platform,
                      label: PLATFORM_LABEL[platform],
                      value: p.totals.spend,
                      valueLabel: money(p.totals.spend, lang),
                      color: PLATFORM_VAR[platform],
                      details: [
                        { label: s.metric.clicks, value: num(p.totals.clicks, lang) },
                        { label: "CTR", value: pct(p.totals.ctr, lang) },
                        { label: "CPC", value: money(p.totals.cpc, lang, 2) },
                        {
                          label: s.metric.conversions,
                          value: num(p.totals.conversions, lang, p.totals.conversions % 1 ? 1 : 0),
                        },
                        { label: "CPA", value: p.totals.conversions ? money(p.totals.cpa, lang) : "–" },
                        { label: "ROAS", value: roasText(p.totals.roas, lang) },
                        // La reach ha senso QUI, dentro una piattaforma: è lì
                        // che è deduplicata. Google non la espone → "–".
                        {
                          label: s.metric.reach,
                          value: p.totals.reach != null ? num(p.totals.reach, lang) : "–",
                        },
                        {
                          label: s.metric.frequency,
                          value: p.totals.frequency != null ? num(p.totals.frequency, lang, 2) : "–",
                        },
                      ],
                    };
                  })}
                />
              </div>
            }
          />

          <ChartCard
            lang={lang}
            title={s.chart.funnel}
            sub={s.chart.funnelSub}
            chart={
              <FunnelLadder
                steps={[
                  { label: s.metric.impressions, value: num(funnel[0].value, lang) },
                  {
                    label: s.metric.clicks,
                    value: num(funnel[1].value, lang),
                    rateLabel: "CTR",
                    rate: pct(funnel[1].rate ?? 0, lang),
                  },
                  {
                    label: s.metric.conversions,
                    value: num(funnel[2].value, lang, funnel[2].value % 1 ? 1 : 0),
                    rateLabel: "CVR",
                    rate: pct(funnel[2].rate ?? 0, lang),
                  },
                ]}
              />
            }
            footer={s.notes.roasNull}
          />
        </div>

        {/* ------------------------------------------------ budget pacing */}
        <Card className="mb-4">
          <CardHead
            title={s.chart.budgetPacing}
            sub={s.chart.budgetPacingSub}
            right={
              alerts.length > 0 ? (
                <Badge tone="critical" icon={<IconAlert className="h-3 w-3" />}>
                  {alerts.length}
                </Badge>
              ) : undefined
            }
          />
          <div className="space-y-3.5 px-4 pb-4 pt-3 sm:px-5">
            {pacing.map((p) => {
              const tone =
                p.status === "over"
                  ? "critical"
                  : p.status === "near"
                    ? "warning"
                    : p.status === "under"
                      ? "quiet"
                      : "good";
              const label =
                p.status === "over"
                  ? s.pacing.over
                  : p.status === "near"
                    ? s.pacing.near
                    : p.status === "under"
                      ? s.pacing.under
                      : s.pacing.ok;
              return (
                <div key={p.client.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <Link
                      href={`/kunder#${p.client.id}`}
                      className="min-w-0 truncate text-[13px] font-medium text-ink hover:underline"
                    >
                      {p.client.name}
                    </Link>
                    <Badge tone={tone}>{label}</Badge>
                  </div>
                  <div className="mt-1.5">
                    <Meter
                      value={p.used}
                      target={p.elapsed}
                      status={p.status}
                      label={`${p.client.name}: ${Math.round(p.used * 100)}%`}
                    />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[11.5px] text-ink-muted">
                    <span className="tnum">
                      {s.pacing.monthToDate} <span className="font-medium text-ink-secondary">{money(p.monthToDate, lang)}</span>{" "}
                      / {money(p.client.monthlyBudget, lang)}
                    </span>
                    <span className="tnum">
                      {s.pacing.projected}{" "}
                      <span
                        className={cx(
                          "font-medium",
                          p.status === "over" ? "text-delta-down" : "text-ink-secondary",
                        )}
                      >
                        {money(p.projected, lang)}
                      </span>{" "}
                      ({pct(p.projectedUse, lang, 0)} {s.pacing.ofBudget})
                    </span>
                  </div>
                </div>
              );
            })}
            <p className="pt-1 text-[11px] leading-relaxed text-ink-muted">
              {s.pacing.daysLeft(pacing[0] ? pacing[0].daysInMonth - pacing[0].daysElapsed : 0)} ·{" "}
              {s.notes.currency}
            </p>
          </div>
        </Card>

        {/* -------------------------------------------------- top campagne */}
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[13px] font-semibold text-ink">{s.chart.topCampaigns}</h2>
              <p className="mt-0.5 text-[11.5px] text-ink-muted">{s.campaigns.subtitle}</p>
            </div>
            <Link
              href="/kampanjer"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-hairline px-2.5 py-1.5 text-[12px] font-medium text-ink-secondary transition-colors hover:bg-sunken"
            >
              {s.nav.campaigns}
              <IconChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <CampaignTable
            lang={lang}
            href="/kampanjer"
            searchable={false}
            initialLimit={6}
            rows={campaigns.map((c) => ({
              campaignId: c.campaignId,
              campaignName: c.campaignName,
              platform: c.platform,
              clientName: CLIENT_BY_ID.get(c.clientId)?.name ?? c.clientId,
              objectiveLabel: OBJECTIVE_LABELS[c.objective] ?? c.objective,
              status: c.status,
              spend: c.totals.spend,
              impressions: c.totals.impressions,
              clicks: c.totals.clicks,
              ctr: c.totals.ctr,
              cpc: c.totals.cpc,
              conversions: c.totals.conversions,
              cpa: c.totals.cpa,
              roas: c.totals.roas,
            }))}
          />
        </Card>

        <p className="mt-4 text-[11.5px] leading-relaxed text-ink-muted">
          {s.footer.updated} {shortDate(to, lang)} · {s.footer.line}
        </p>
      </FilterShell>
    </>
  );
}
