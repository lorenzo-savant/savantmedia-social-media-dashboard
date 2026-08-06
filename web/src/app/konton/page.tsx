import Link from "next/link";
import { FilterShell } from "@/components/shell/filter-shell";
import { IconAlert, IconCheck, IconChevronRight, IconKey } from "@/components/ui/icons";
import {
  Badge,
  Card,
  CardHead,
  KeyValue,
  Note,
  PLATFORM_LABEL,
  PLATFORM_VAR,
  PageHeader,
  PlatformTag,
  cx,
} from "@/components/ui/primitives";
import { filterRows } from "@/lib/aggregate";
import { API_SOURCES, API_VERSIONS } from "@/lib/api-catalog";
import { connectionStatus } from "@/lib/connection";
import { ACCOUNTS, CAMPAIGNS, CLIENTS, CLIENT_BY_ID } from "@/lib/demo/catalog";
import { addDays, getDataset } from "@/lib/demo/generate";
import { dateTime, money, num, rangeLabel } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/prefs";
import { parseFilters, type SearchParams } from "@/lib/query";
import type { Platform } from "@/lib/types";

export default async function AccountsPage({
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
  const connection = await connectionStatus();

  const spendByAccount = new Map<string, number>();
  for (const r of rows) spendByAccount.set(r.accountId, (spendByAccount.get(r.accountId) ?? 0) + r.spend);

  const syncByAccount = new Map(ds.syncLog.map((e) => [e.accountId, e]));
  const visibleAccounts = ACCOUNTS.filter(
    (a) => f.platforms.includes(a.platform) && (!f.clientId || a.clientId === f.clientId),
  );

  return (
    <>
      <PageHeader title={s.accounts.title} sub={`${s.accounts.subtitle} · ${rangeLabel(from, to, lang)}`} />

      <FilterShell
        lang={lang}
        clients={CLIENTS.map((c) => ({ id: c.id, name: c.name }))}
        from={from}
        to={to}
      >
        {/* ---------------- stato connettori ---------------- */}
        <div className="mb-4 grid gap-4 lg:grid-cols-3">
          {(Object.keys(connection) as Platform[])
            .filter((p) => f.platforms.includes(p))
            .map((p) => {
              const c = connection[p];
              const source = API_SOURCES.find((a) => a.platform === p)!;
              return (
                <Card key={p} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: PLATFORM_VAR[p] }}
                      />
                      <h2 className="text-[14px] font-semibold text-ink">{PLATFORM_LABEL[p]}</h2>
                    </div>
                    <Badge
                      tone={c.ready ? "good" : "warning"}
                      icon={
                        c.ready ? <IconCheck className="h-3 w-3" /> : <IconKey className="h-3 w-3" />
                      }
                    >
                      {c.ready ? s.accounts.connected : s.accounts.demoMode}
                    </Badge>
                  </div>

                  <dl className="mt-3 divide-y divide-hairline">
                    <KeyValue k={s.accounts.apiVersion} v={API_VERSIONS[p]} mono />
                    <KeyValue k={s.sources.endpoint} v={source.endpoint} mono />
                    <KeyValue k={s.accounts.scope} v={source.scope} mono />
                  </dl>

                  <div className="mt-3 border-t border-hairline pt-3">
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium tracking-[0.02em] text-ink-muted">
                      {s.accounts.credentials}
                    </div>
                    <ul className="space-y-1.5">
                      {c.credentials.map((cred) => (
                        <li key={cred.name} className="flex items-start gap-2">
                          <span
                            aria-hidden
                            className={cx(
                              "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                              cred.set ? "bg-good" : "bg-warning",
                            )}
                          />
                          <div className="min-w-0">
                            <code className="block truncate font-mono text-[11px] text-ink-secondary">
                              {cred.name}
                            </code>
                            <span className="text-[10.5px] text-ink-muted">{cred.from}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              );
            })}
        </div>

        {/* ---------------- tabella account ---------------- */}
        <Card className="overflow-hidden">
          <CardHead title={s.accounts.title} sub={s.accounts.syncNote} />

          {/* mobile */}
          <ul className="space-y-2 px-4 pb-4 pt-3 lg:hidden">
            {visibleAccounts.map((a) => {
              const sync = syncByAccount.get(a.id);
              const campaigns = CAMPAIGNS.filter((c) => c.accountId === a.id).length;
              return (
                <li key={a.id} className="rounded-xl border border-hairline p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-ink">{a.name}</div>
                      <code className="mt-0.5 block truncate font-mono text-[11px] text-ink-muted">
                        {a.id}
                      </code>
                    </div>
                    <Badge tone={sync?.status === "success" ? "good" : "warning"}>
                      {s.status[sync?.status ?? "running"]}
                    </Badge>
                  </div>
                  <dl className="mt-2.5 grid grid-cols-3 gap-2">
                    <div>
                      <dt className="text-[10px] text-ink-muted">{s.table.spend}</dt>
                      <dd className="tnum text-[12.5px] font-semibold text-ink">
                        {money(spendByAccount.get(a.id) ?? 0, lang)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-ink-muted">{s.table.campaigns}</dt>
                      <dd className="tnum text-[12.5px] font-semibold text-ink">{campaigns}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-ink-muted">{s.table.rows}</dt>
                      <dd className="tnum text-[12.5px] font-semibold text-ink">
                        {num(sync?.rowsUpserted ?? 0, lang)}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-hairline pt-2">
                    <PlatformTag platform={a.platform} />
                    <span className="tnum text-[11px] text-ink-muted">
                      {sync ? dateTime(sync.finishedAt, lang) : "–"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* desktop */}
          <div className="hidden overflow-x-auto px-4 pb-4 pt-2 sm:px-5 lg:block">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-hairline text-ink-muted">
                  <th scope="col" className="py-2 pr-3 text-left font-medium">
                    {s.table.account}
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">
                    {s.table.platform}
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">
                    {s.table.client}
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    {s.table.spend}
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    {s.table.campaigns}
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    {s.table.rows}
                  </th>
                  <th scope="col" className="px-3 py-2 text-center font-medium">
                    {s.table.status}
                  </th>
                  <th scope="col" className="py-2 pl-3 text-right font-medium">
                    {s.table.lastSync}
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleAccounts.map((a) => {
                  const sync = syncByAccount.get(a.id);
                  const campaigns = CAMPAIGNS.filter((c) => c.accountId === a.id).length;
                  return (
                    <tr key={a.id} className="border-b border-hairline last:border-0 hover:bg-sunken/60">
                      <td className="py-2.5 pr-3">
                        <div className="font-medium text-ink">{a.name}</div>
                        <code className="font-mono text-[11px] text-ink-muted">{a.id}</code>
                      </td>
                      <td className="px-3 py-2.5">
                        <PlatformTag platform={a.platform} />
                      </td>
                      <td className="px-3 py-2.5 text-ink-secondary">
                        {CLIENT_BY_ID.get(a.clientId)?.name ?? "–"}
                      </td>
                      <td className="tnum px-3 py-2.5 text-right text-ink">
                        {money(spendByAccount.get(a.id) ?? 0, lang)}
                      </td>
                      <td className="tnum px-3 py-2.5 text-right text-ink">{campaigns}</td>
                      <td className="tnum px-3 py-2.5 text-right text-ink">
                        {num(sync?.rowsUpserted ?? 0, lang)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge tone={sync?.status === "success" ? "good" : "warning"}>
                          {s.status[sync?.status ?? "running"]}
                        </Badge>
                      </td>
                      <td className="tnum py-2.5 pl-3 text-right text-ink-muted">
                        {sync ? dateTime(sync.finishedAt, lang) : "–"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ---------------- cosa manca ---------------- */}
        <Card className="mt-4 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <IconAlert className="h-4 w-4 text-warning" />
            <h2 className="text-[13px] font-semibold text-ink">{s.accounts.whatIsMissing}</h2>
          </div>
          <ul className="space-y-2.5">
            {(Object.keys(connection) as Platform[]).map((p) => {
              const c = connection[p];
              if (c.ready) return null;
              return (
                <li key={p} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[12.5px]">
                  <span className="font-medium text-ink">{PLATFORM_LABEL[p]}:</span>
                  <span className="text-ink-secondary">
                    {c.missing.map((m) => (
                      <code key={m} className="mr-1.5 rounded bg-sunken px-1 py-0.5 font-mono text-[11px]">
                        {m}
                      </code>
                    ))}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3.5">
            <Note>
              {s.accounts.syncNote}{" "}
              <Link href="/datakallor" className="font-medium text-ink underline underline-offset-2">
                {s.nav.sources} →
              </Link>
            </Note>
          </div>
        </Card>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {(Object.keys(connection) as Platform[])
            .filter((p) => f.platforms.includes(p))
            .slice(0, 2)
            .map((p) => {
              const source = API_SOURCES.find((a) => a.platform === p)!;
              return (
                <Card key={p} className="p-4 sm:p-5">
                  <h2 className="mb-2 text-[13px] font-semibold text-ink">
                    {PLATFORM_LABEL[p]} · {s.sources.rateLimit}
                  </h2>
                  <p className="text-[12px] leading-relaxed text-ink-secondary">{source.rateLimit}</p>
                  <Link
                    href="/datakallor"
                    className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-ink-secondary hover:text-ink"
                  >
                    {s.sources.gotchas}
                    <IconChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Card>
              );
            })}
        </div>
      </FilterShell>
    </>
  );
}
