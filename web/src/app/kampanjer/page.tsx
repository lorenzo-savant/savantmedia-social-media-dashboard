import { CampaignTable } from "@/components/campaigns/campaign-table";
import { FilterShell } from "@/components/shell/filter-shell";
import { Card, Note, PageHeader } from "@/components/ui/primitives";
import { byCampaign, filterRows, totalsOf } from "@/lib/aggregate";
import { CLIENTS, CLIENT_BY_ID, OBJECTIVE_LABELS } from "@/lib/demo/catalog";
import { MATURING_DAYS, addDays, getDataset } from "@/lib/demo/generate";
import { money, num, rangeLabel } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/prefs";
import { parseFilters, type SearchParams } from "@/lib/query";

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const lang = await getLang();
  const s = t(lang);
  const f = parseFilters(await searchParams);

  const ds = getDataset();
  const to = ds.endDate;
  const from = addDays(to, -(f.days - 1));
  const rows = filterRows(ds.rows, f, to);
  const campaigns = byCampaign(rows, f.days);
  const totals = totalsOf(rows, f.days);

  return (
    <>
      <PageHeader
        title={s.campaigns.title}
        sub={`${campaigns.length} ${s.table.campaigns.toLowerCase()} · ${rangeLabel(from, to, lang)} · ${money(totals.spend, lang)}`}
      />

      <FilterShell
        lang={lang}
        clients={CLIENTS.map((c) => ({ id: c.id, name: c.name }))}
        from={from}
        to={to}
      >
        <Card className="p-4 sm:p-5">
          <CampaignTable
            lang={lang}
            href="/kampanjer"
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

        <div className="mt-4 space-y-2.5">
          <Note title={s.notes.attribution}>{s.notes.attributionBody(MATURING_DAYS)}</Note>
          <Note>{s.notes.roasNull}</Note>
          <Note>
            {s.notes.ratios} {s.notes.currency}
          </Note>
        </div>

        <p className="mt-4 text-[11.5px] text-ink-muted">
          {s.table.rows}: {num(rows.length, lang)} ({s.chart.dailySpendSub.toLowerCase()})
        </p>
      </FilterShell>
    </>
  );
}
