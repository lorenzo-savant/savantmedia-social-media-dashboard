import Link from "next/link";
import { BarList } from "@/components/charts/bar-list";
import { FilterShell } from "@/components/shell/filter-shell";
import { IconChevronRight } from "@/components/ui/icons";
import {
  Badge,
  Card,
  KeyValue,
  Meter,
  Note,
  PLATFORM_LABEL,
  PLATFORM_VAR,
  PageHeader,
  cx,
} from "@/components/ui/primitives";
import { byClient, filterRows, pacingFor } from "@/lib/aggregate";
import { CLIENTS } from "@/lib/demo/catalog";
import { addDays, getDataset } from "@/lib/demo/generate";
import { money, num, pct, rangeLabel, roasText } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/prefs";
import { parseFilters, type SearchParams } from "@/lib/query";

export default async function ClientsPage({
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
  const clients = byClient(rows, f.days);
  const pacing = pacingFor(ds.rows, CLIENTS, to);
  const pacingById = new Map(pacing.map((p) => [p.client.id, p]));

  return (
    <>
      <PageHeader title={s.clients.title} sub={`${s.clients.subtitle} · ${rangeLabel(from, to, lang)}`} />

      <FilterShell
        lang={lang}
        clients={CLIENTS.map((c) => ({ id: c.id, name: c.name }))}
        from={from}
        to={to}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {clients.map(({ client, totals, perPlatform }) => {
            const p = pacingById.get(client.id)!;
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
              <Card key={client.id} as="article" className="scroll-mt-24 p-4 sm:p-5">
                <div id={client.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-[16px] font-semibold tracking-[-0.01em] text-ink">
                      {client.name}
                    </h2>
                    <p className="mt-0.5 text-[12px] text-ink-muted">{client.industry}</p>
                  </div>
                  <Badge tone={tone}>{label}</Badge>
                </div>

                {/* -------- budget -------- */}
                <div className="mt-4">
                  <Meter
                    value={p.used}
                    target={p.elapsed}
                    status={p.status}
                    label={`${client.name}: ${Math.round(p.used * 100)}%`}
                  />
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-[10.5px] text-ink-muted">{s.pacing.monthToDate}</div>
                      <div className="tnum text-[13px] font-semibold text-ink">
                        {money(p.monthToDate, lang)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10.5px] text-ink-muted">{s.pacing.projected}</div>
                      <div
                        className={cx(
                          "tnum text-[13px] font-semibold",
                          p.status === "over" ? "text-delta-down" : "text-ink",
                        )}
                      >
                        {money(p.projected, lang)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10.5px] text-ink-muted">{s.clients.monthlyBudget}</div>
                      <div className="tnum text-[13px] font-semibold text-ink">
                        {money(client.monthlyBudget, lang)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* -------- performance nel periodo -------- */}
                <dl className="mt-4 grid grid-cols-2 gap-x-4 border-t border-hairline pt-2 sm:grid-cols-4">
                  <KeyValue k={s.metric.spend} v={money(totals.spend, lang)} />
                  <KeyValue
                    k={s.metric.conversions}
                    v={num(totals.conversions, lang, totals.conversions % 1 ? 1 : 0)}
                  />
                  <KeyValue k="CPA" v={totals.conversions ? money(totals.cpa, lang) : "–"} />
                  <KeyValue k="ROAS" v={roasText(totals.roas, lang)} />
                </dl>

                {/* -------- split piattaforma -------- */}
                {perPlatform.length > 0 && (
                  <div className="mt-3 border-t border-hairline pt-3">
                    <div className="mb-2 text-[11px] font-medium tracking-[0.02em] text-ink-muted">
                      {s.clients.perPlatform}
                    </div>
                    <BarList
                      items={perPlatform.map((x) => ({
                        key: x.platform,
                        label: PLATFORM_LABEL[x.platform],
                        value: x.spend,
                        valueLabel: `${money(x.spend, lang)} · ${pct(
                          totals.spend ? x.spend / totals.spend : 0,
                          lang,
                          0,
                        )}`,
                        color: PLATFORM_VAR[x.platform],
                      }))}
                    />
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-hairline pt-3">
                  <span className="text-[11px] text-ink-muted">
                    {client.revenueTracked ? s.clients.revenueTracked : s.clients.leadClient}
                  </span>
                  <Link
                    href={`/kampanjer?c=${client.id}&d=${f.days}`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-hairline px-2.5 py-1.5 text-[12px] font-medium text-ink-secondary transition-colors hover:bg-sunken"
                  >
                    {s.nav.campaigns}
                    <IconChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-4 space-y-2.5">
          <Note title={s.chart.budgetPacing}>
            {s.chart.budgetPacingSub}. {s.pacing.daysLeft(p0(pacing))}
          </Note>
          <Note>{s.notes.roasNull}</Note>
        </div>
      </FilterShell>
    </>
  );
}

function p0(pacing: { daysInMonth: number; daysElapsed: number }[]): number {
  return pacing[0] ? pacing[0].daysInMonth - pacing[0].daysElapsed : 0;
}
