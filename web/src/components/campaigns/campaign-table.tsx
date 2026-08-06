"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, PLATFORM_VAR, PlatformTag, cx } from "@/components/ui/primitives";
import { IconChevronRight, IconSearch } from "@/components/ui/icons";
import { money, num, pct, roasText } from "@/lib/format";
import { t, type Lang } from "@/lib/i18n";
import type { Platform } from "@/lib/types";

export interface CampaignTableRow {
  campaignId: string;
  campaignName: string;
  platform: Platform;
  clientName: string;
  objectiveLabel: string;
  status: "ACTIVE" | "PAUSED";
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cpa: number;
  roas: number | null;
}

type SortKey = "spend" | "impressions" | "clicks" | "ctr" | "cpc" | "conversions" | "cpa" | "roas";

const NUMERIC_COLS: { key: SortKey; label: (s: ReturnType<typeof t>) => string }[] = [
  { key: "spend", label: (s) => s.table.spend },
  { key: "impressions", label: (s) => s.table.impressions },
  { key: "clicks", label: (s) => s.table.clicks },
  { key: "ctr", label: (s) => s.table.ctr },
  { key: "cpc", label: (s) => s.table.cpc },
  { key: "conversions", label: (s) => s.table.conversions },
  { key: "cpa", label: (s) => s.table.cpa },
  { key: "roas", label: (s) => s.table.roas },
];

function cell(row: CampaignTableRow, key: SortKey, lang: Lang): string {
  switch (key) {
    case "spend":
      return money(row.spend, lang);
    case "impressions":
      return num(row.impressions, lang);
    case "clicks":
      return num(row.clicks, lang);
    case "ctr":
      return pct(row.ctr, lang);
    case "cpc":
      return money(row.cpc, lang, 2);
    case "conversions":
      return num(row.conversions, lang, row.conversions % 1 ? 1 : 0);
    case "cpa":
      return row.conversions > 0 ? money(row.cpa, lang) : "–";
    case "roas":
      return roasText(row.roas, lang);
  }
}

export function CampaignTable({
  rows,
  lang,
  href,
  searchable = true,
  initialLimit,
}: {
  rows: CampaignTableRow[];
  lang: Lang;
  /** Base del link di dettaglio. Omesso = righe non cliccabili. */
  href?: string;
  searchable?: boolean;
  initialLimit?: number;
}) {
  const s = t(lang);
  const [sort, setSort] = useState<SortKey>("spend");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = needle
      ? rows.filter(
          (r) =>
            r.campaignName.toLowerCase().includes(needle) ||
            r.clientName.toLowerCase().includes(needle),
        )
      : rows;
    // ROAS null in fondo in entrambi i versi: "nessun valore" non è "il peggiore".
    return [...base].sort((a, b) => {
      const av = a[sort];
      const bv = b[sort];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return dir === "desc" ? bv - av : av - bv;
    });
  }, [rows, q, sort, dir]);

  const limit = initialLimit && !expanded ? initialLimit : filtered.length;
  const visible = filtered.slice(0, limit);
  const maxSpend = Math.max(...rows.map((r) => r.spend), 1);

  function toggleSort(key: SortKey) {
    if (key === sort) setDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSort(key);
      setDir("desc");
    }
  }

  return (
    <div className="min-w-0">
      {searchable && (
        <div className="relative mb-3">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={s.campaigns.search}
            aria-label={s.campaigns.search}
            className="h-10 w-full rounded-xl border border-hairline bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-muted focus-visible:border-hairline-strong"
          />
        </div>
      )}

      {/* ---------------- mobile: una scheda per campagna ---------------- */}
      <ul className="space-y-2 lg:hidden">
        {visible.map((r) => {
          const inner = (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: PLATFORM_VAR[r.platform] }}
                    />
                    <span className="truncate text-[13px] font-medium text-ink">
                      {r.campaignName}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-ink-muted">{r.clientName}</span>
                    <span aria-hidden className="text-ink-muted">·</span>
                    <span className="text-[11px] text-ink-muted">{r.objectiveLabel}</span>
                    {r.status === "PAUSED" && <Badge tone="quiet">{s.status.paused}</Badge>}
                  </div>
                </div>
                {href && <IconChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />}
              </div>

              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-[2px] bg-sunken">
                <div
                  className="h-full rounded-r-[3px]"
                  style={{
                    width: `${Math.max((r.spend / maxSpend) * 100, 1.5)}%`,
                    background: PLATFORM_VAR[r.platform],
                  }}
                />
              </div>

              <dl className="mt-2.5 grid grid-cols-4 gap-2">
                {(["spend", "clicks", "conversions", r.roas != null ? "roas" : "cpa"] as SortKey[]).map(
                  (k) => (
                    <div key={k} className="min-w-0">
                      <dt className="truncate text-[10px] text-ink-muted">
                        {NUMERIC_COLS.find((c) => c.key === k)!.label(s)}
                      </dt>
                      <dd className="tnum truncate text-[12.5px] font-semibold text-ink">
                        {cell(r, k, lang)}
                      </dd>
                    </div>
                  ),
                )}
              </dl>
            </>
          );
          return (
            <li key={r.campaignId}>
              {href ? (
                <Link
                  href={`${href}/${r.campaignId}`}
                  className="block rounded-xl border border-hairline bg-surface p-3 transition-colors active:bg-sunken"
                >
                  {inner}
                </Link>
              ) : (
                <div className="rounded-xl border border-hairline bg-surface p-3">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>

      {/* ---------------- desktop: tabella vera ---------------- */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-hairline">
              <th scope="col" className="sticky left-0 z-10 bg-surface py-2 pr-3 text-left font-medium text-ink-muted">
                {s.table.campaign}
              </th>
              <th scope="col" className="px-3 py-2 text-left font-medium text-ink-muted">
                {s.table.client}
              </th>
              {NUMERIC_COLS.map((c) => {
                const activeSort = sort === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={activeSort ? (dir === "desc" ? "descending" : "ascending") : "none"}
                    className="px-2 py-2 text-right font-medium"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={cx(
                        "inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-ink",
                        activeSort ? "text-ink" : "text-ink-muted",
                      )}
                    >
                      {c.label(s)}
                      <span aria-hidden className="text-[9px] leading-none">
                        {activeSort ? (dir === "desc" ? "▼" : "▲") : ""}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.campaignId} className="group border-b border-hairline last:border-0 hover:bg-sunken/60">
                <td className="sticky left-0 z-10 max-w-[340px] bg-surface py-2.5 pr-3 group-hover:bg-sunken/60">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: PLATFORM_VAR[r.platform] }}
                    />
                    {href ? (
                      <Link
                        href={`${href}/${r.campaignId}`}
                        className="truncate font-medium text-ink hover:underline"
                      >
                        {r.campaignName}
                      </Link>
                    ) : (
                      <span className="truncate font-medium text-ink">{r.campaignName}</span>
                    )}
                    {r.status === "PAUSED" && <Badge tone="quiet">{s.status.paused}</Badge>}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-ink-secondary">
                  <div className="truncate">{r.clientName}</div>
                  <div className="truncate text-[11px] text-ink-muted">{r.objectiveLabel}</div>
                </td>
                {NUMERIC_COLS.map((c) => (
                  <td key={c.key} className="tnum whitespace-nowrap px-2 py-2.5 text-right text-ink">
                    {cell(r, c.key, lang)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!visible.length && (
        <p className="py-8 text-center text-[13px] text-ink-muted">{s.campaigns.noMatch}</p>
      )}

      {initialLimit && filtered.length > initialLimit && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 w-full rounded-xl border border-hairline py-2 text-[12.5px] font-medium text-ink-secondary transition-colors hover:bg-sunken"
        >
          {expanded ? s.table.showLess : `${s.table.showAll} (${filtered.length})`}
        </button>
      )}

      {/* la piattaforma non è solo colore: c'è sempre anche la legenda */}
      <div className="mt-3 flex flex-wrap gap-3">
        {(["meta", "google", "snapchat"] as Platform[]).map((p) => (
          <PlatformTag key={p} platform={p} />
        ))}
      </div>
    </div>
  );
}
