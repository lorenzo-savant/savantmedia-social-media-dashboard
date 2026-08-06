import Link from "next/link";
import { notFound } from "next/navigation";
import { BarList } from "@/components/charts/bar-list";
import { ChartCard } from "@/components/charts/chart-card";
import { StackedAreaChart } from "@/components/charts/stacked-area";
import { IconChevronRight } from "@/components/ui/icons";
import {
  Badge,
  Card,
  CardHead,
  KeyValue,
  Note,
  PLATFORM_LABEL,
  PLATFORM_VAR,
  PlatformTag,
  PageHeader,
} from "@/components/ui/primitives";
import { StatTile } from "@/components/ui/stat-tile";
import { dailySpendSeries, totalsOf } from "@/lib/aggregate";
import { API_SOURCES, API_VERSIONS, BREAKDOWN_PARAM } from "@/lib/api-catalog";
import {
  ACCOUNT_BY_ID,
  CAMPAIGN_BY_ID,
  CLIENT_BY_ID,
  OBJECTIVE_LABELS,
} from "@/lib/demo/catalog";
import { addDays, breakdownFor, getDataset, type BreakdownDim } from "@/lib/demo/generate";
import { money, num, pct, rangeLabel, roasText } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/prefs";
import { parseFilters, type SearchParams } from "@/lib/query";

const DIMS: { dim: BreakdownDim; title: (s: ReturnType<typeof t>) => string }[] = [
  { dim: "placement", title: (s) => s.chart.placement },
  { dim: "device", title: (s) => s.chart.device },
  { dim: "age", title: (s) => s.chart.age },
  { dim: "gender", title: (s) => s.chart.gender },
  { dim: "country", title: (s) => s.chart.country },
];

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const lang = await getLang();
  const s = t(lang);
  const { id } = await params;
  const f = parseFilters(await searchParams);

  const spec = CAMPAIGN_BY_ID.get(id);
  if (!spec) notFound();

  const ds = getDataset();
  const to = ds.endDate;
  const from = addDays(to, -(f.days - 1));
  const rows = ds.rows.filter((r) => r.campaignId === id && r.date >= from && r.date <= to);
  const totals = totalsOf(rows, f.days);
  const series = dailySpendSeries(rows, from, to);
  const account = ACCOUNT_BY_ID.get(spec.accountId);
  const client = CLIENT_BY_ID.get(spec.clientId);
  const source = API_SOURCES.find((a) => a.platform === spec.platform)!;

  const bdParam = BREAKDOWN_PARAM[spec.platform];

  return (
    <>
      <nav className="mb-3 flex items-center gap-1 text-[12px] text-ink-muted">
        <Link href="/kampanjer" className="hover:text-ink">
          {s.nav.campaigns}
        </Link>
        <IconChevronRight className="h-3.5 w-3.5" />
        <span className="truncate text-ink-secondary">{s.campaigns.detail}</span>
      </nav>

      <PageHeader title={spec.campaignName} sub={`${client?.name ?? ""} · ${rangeLabel(from, to, lang)}`} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <PlatformTag platform={spec.platform} />
        <Badge tone={spec.pausedAfterDays != null ? "quiet" : "good"}>
          {spec.pausedAfterDays != null ? s.status.paused : s.status.active}
        </Badge>
        <Badge tone="neutral">{OBJECTIVE_LABELS[spec.objective] ?? spec.objective}</Badge>
        {spec.channelType && <Badge tone="neutral">{spec.channelType}</Badge>}
      </div>

      {!rows.length && (
        <Note tone="warning">
          {s.chart.noData} {spec.pausedAfterDays != null ? s.status.paused : ""}
        </Note>
      )}

      {rows.length > 0 && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">
            <StatTile lang={lang} label={s.metric.spend} value={money(totals.spend, lang)} />
            <StatTile lang={lang} label={s.metric.impressions} value={num(totals.impressions, lang)} sub={`CPM ${money(totals.cpm, lang, 2)}`} />
            <StatTile lang={lang} label={s.metric.clicks} value={num(totals.clicks, lang)} sub={`CTR ${pct(totals.ctr, lang)}`} />
            <StatTile
              lang={lang}
              label={s.metric.conversions}
              value={num(totals.conversions, lang, totals.conversions % 1 ? 1 : 0)}
              sub={totals.conversions ? `CPA ${money(totals.cpa, lang)}` : undefined}
            />
            <StatTile
              lang={lang}
              label={s.metric.roas}
              value={roasText(totals.roas, lang)}
              sub={totals.conversionValue != null ? money(totals.conversionValue, lang) : s.clients.revenueNotTracked}
            />
            <StatTile
              lang={lang}
              label={s.metric.reach}
              value={totals.reach != null ? num(totals.reach, lang) : "–"}
              sub={totals.frequency != null ? `${s.metric.frequency} ${num(totals.frequency, lang, 2)}` : s.sources.notProvided}
            />
          </div>

          <div className="mb-4">
            <ChartCard
              lang={lang}
              title={s.chart.dailySpend}
              sub={PLATFORM_LABEL[spec.platform]}
              chart={
                <div className="px-3">
                  <StackedAreaChart
                    data={series}
                    series={[
                      {
                        key: spec.platform,
                        label: PLATFORM_LABEL[spec.platform],
                        color: PLATFORM_VAR[spec.platform],
                      },
                    ]}
                    lang={lang}
                  />
                </div>
              }
            />
          </div>

          <div className="mb-4 grid gap-4 lg:grid-cols-2">
            {DIMS.map(({ dim, title }) => {
              const data = breakdownFor(rows, spec.platform, dim);
              if (!data.length) return null;
              return (
                <ChartCard
                  key={dim}
                  lang={lang}
                  title={title(s)}
                  sub={`${s.insights.apiParam}: ${bdParam[dim]}`}
                  chart={
                    <div className="px-4 pb-4 pt-2 sm:px-5">
                      <BarList
                        items={data.map((d) => ({
                          key: d.key,
                          label: d.label,
                          value: d.spend,
                          valueLabel: money(d.spend, lang),
                          details: [
                            { label: s.metric.impressions, value: num(d.impressions, lang) },
                            { label: s.metric.clicks, value: num(d.clicks, lang) },
                            {
                              label: "CTR",
                              value: pct(d.impressions ? d.clicks / d.impressions : 0, lang),
                            },
                            {
                              label: s.metric.conversions,
                              value: num(d.conversions, lang, d.conversions % 1 ? 1 : 0),
                            },
                          ],
                        }))}
                      />
                    </div>
                  }
                  table={
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-hairline text-ink-muted">
                          <th scope="col" className="py-1.5 text-left font-medium">
                            {title(s)}
                          </th>
                          <th scope="col" className="py-1.5 text-right font-medium">
                            {s.table.spend}
                          </th>
                          <th scope="col" className="py-1.5 text-right font-medium">
                            {s.table.impressions}
                          </th>
                          <th scope="col" className="py-1.5 text-right font-medium">
                            {s.table.clicks}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((d) => (
                          <tr key={d.key} className="border-b border-hairline last:border-0">
                            <td className="py-1.5 text-ink-secondary">{d.label}</td>
                            <td className="tnum py-1.5 text-right text-ink">{money(d.spend, lang)}</td>
                            <td className="tnum py-1.5 text-right text-ink">{num(d.impressions, lang)}</td>
                            <td className="tnum py-1.5 text-right text-ink">{num(d.clicks, lang)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  }
                />
              );
            })}
          </div>
        </>
      )}

      <Card>
        <CardHead title={s.campaigns.detail} sub={s.campaigns.breakdownNote} />
        <dl className="divide-y divide-hairline px-4 pb-4 pt-1 sm:px-5">
          <KeyValue k={s.campaigns.campaignId} v={spec.campaignId} mono />
          <KeyValue k={s.table.account} v={`${account?.name ?? ""} · ${spec.accountId}`} mono />
          <KeyValue k={s.table.client} v={client?.name ?? spec.clientId} />
          <KeyValue k={s.table.objective} v={spec.objective} mono />
          {spec.channelType && <KeyValue k="advertising_channel_type" v={spec.channelType} mono />}
          <KeyValue k={s.campaigns.bidStrategy} v={spec.bidStrategy} mono />
          <KeyValue
            k={s.metric.dailyBudget}
            v={spec.dailyBudget != null ? money(spec.dailyBudget, lang) : "–"}
          />
          <KeyValue k={s.campaigns.conversionAction} v={spec.conversionActionName} mono />
          <KeyValue k={s.accounts.attribution} v={account?.attribution ?? "–"} mono />
          <KeyValue k={s.accounts.apiVersion} v={API_VERSIONS[spec.platform]} mono />
          <KeyValue k={s.sources.endpoint} v={source.endpoint} mono />
        </dl>
      </Card>

      <div className="mt-4">
        <Note>{s.campaigns.dailyBudgetNote}</Note>
      </div>
    </>
  );
}
