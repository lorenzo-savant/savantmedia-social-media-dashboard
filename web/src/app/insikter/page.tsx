import Link from "next/link";
import { BarList } from "@/components/charts/bar-list";
import { ChartCard } from "@/components/charts/chart-card";
import { FilterShell } from "@/components/shell/filter-shell";
import { Note, PLATFORM_LABEL, PageHeader, cx } from "@/components/ui/primitives";
import { filterRows } from "@/lib/aggregate";
import { BREAKDOWN_PARAM } from "@/lib/api-catalog";
import { CLIENTS } from "@/lib/demo/catalog";
import { addDays, breakdownFor, getDataset, type BreakdownDim } from "@/lib/demo/generate";
import { money, num, pct, rangeLabel, roasText } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/prefs";
import { parseFilters, toSearch, type SearchParams } from "@/lib/query";

const DIMS: BreakdownDim[] = ["placement", "device", "age", "gender", "country"];

function dimLabel(dim: BreakdownDim, s: ReturnType<typeof t>): string {
  return {
    placement: s.chart.placement,
    device: s.chart.device,
    age: s.chart.age,
    gender: s.chart.gender,
    country: s.chart.country,
  }[dim];
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const lang = await getLang();
  const s = t(lang);
  const sp = await searchParams;
  const f = parseFilters(sp);

  const raw = Array.isArray(sp.dim) ? sp.dim[0] : sp.dim;
  const dim: BreakdownDim = DIMS.includes(raw as BreakdownDim) ? (raw as BreakdownDim) : "placement";

  const ds = getDataset();
  const to = ds.endDate;
  const from = addDays(to, -(f.days - 1));
  const rows = filterRows(ds.rows, f, to);
  const base = toSearch(f);

  return (
    <>
      <PageHeader title={s.insights.title} sub={`${s.insights.subtitle} · ${rangeLabel(from, to, lang)}`} />

      <FilterShell
        lang={lang}
        clients={CLIENTS.map((c) => ({ id: c.id, name: c.name }))}
        from={from}
        to={to}
      >
        {/* selettore dimensione */}
        <div className="mb-4 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div
            role="group"
            aria-label={s.insights.dimension}
            className="inline-flex items-center gap-0.5 rounded-xl border border-hairline bg-surface p-0.5"
          >
            {DIMS.map((d) => {
              const q = base ? `${base}&dim=${d}` : `?dim=${d}`;
              const active = d === dim;
              return (
                <Link
                  key={d}
                  href={`/insikter${q}`}
                  aria-current={active ? "true" : undefined}
                  className={cx(
                    "whitespace-nowrap rounded-[9px] px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                    active ? "bg-ink text-plane" : "text-ink-muted hover:text-ink-secondary",
                  )}
                >
                  {dimLabel(d, s)}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <Note title={s.insights.dimension}>{s.insights.taxonomyNote}</Note>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {f.platforms.map((platform) => {
            const data = breakdownFor(rows, platform, dim);
            const total = data.reduce((a, b) => a + b.spend, 0);
            if (!data.length) return null;
            return (
              <ChartCard
                key={platform}
                lang={lang}
                title={`${PLATFORM_LABEL[platform]} · ${dimLabel(dim, s)}`}
                sub={`${s.insights.apiParam}: ${BREAKDOWN_PARAM[platform][dim]}`}
                chart={
                  <div className="px-4 pb-4 pt-2 sm:px-5">
                    <BarList
                      items={data.map((d) => ({
                        key: d.key,
                        label: d.label,
                        value: d.spend,
                        valueLabel: `${money(d.spend, lang)} · ${pct(total ? d.spend / total : 0, lang, 0)}`,
                        details: [
                          { label: s.metric.impressions, value: num(d.impressions, lang) },
                          { label: s.metric.clicks, value: num(d.clicks, lang) },
                          { label: "CTR", value: pct(d.impressions ? d.clicks / d.impressions : 0, lang) },
                          {
                            label: s.metric.conversions,
                            value: num(d.conversions, lang, d.conversions % 1 ? 1 : 0),
                          },
                          {
                            label: "CPA",
                            value: d.conversions ? money(d.spend / d.conversions, lang) : "–",
                          },
                          {
                            label: "ROAS",
                            value: roasText(
                              d.conversionValue != null && d.spend > 0 ? d.conversionValue / d.spend : null,
                              lang,
                            ),
                          },
                        ],
                      }))}
                    />
                  </div>
                }
                table={
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-hairline text-ink-muted">
                          <th scope="col" className="py-1.5 text-left font-medium">
                            {dimLabel(dim, s)}
                          </th>
                          <th scope="col" className="px-2 py-1.5 text-right font-medium">
                            {s.table.spend}
                          </th>
                          <th scope="col" className="px-2 py-1.5 text-right font-medium">
                            {s.table.impressions}
                          </th>
                          <th scope="col" className="px-2 py-1.5 text-right font-medium">
                            {s.table.clicks}
                          </th>
                          <th scope="col" className="py-1.5 text-right font-medium">
                            {s.table.conversions}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((d) => (
                          <tr key={d.key} className="border-b border-hairline last:border-0">
                            <td className="py-1.5 text-ink-secondary">{d.label}</td>
                            <td className="tnum px-2 py-1.5 text-right text-ink">{money(d.spend, lang)}</td>
                            <td className="tnum px-2 py-1.5 text-right text-ink">{num(d.impressions, lang)}</td>
                            <td className="tnum px-2 py-1.5 text-right text-ink">{num(d.clicks, lang)}</td>
                            <td className="tnum py-1.5 text-right text-ink">
                              {num(d.conversions, lang, d.conversions % 1 ? 1 : 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                }
                footer={`Σ ${money(total, lang)}`}
              />
            );
          })}
        </div>

        <div className="mt-4">
          <Note>{s.notes.ratios}</Note>
        </div>
      </FilterShell>
    </>
  );
}
