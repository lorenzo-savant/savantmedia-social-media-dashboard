"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { IconClose, IconFilter } from "@/components/ui/icons";
import { PLATFORM_LABEL, PLATFORM_VAR, cx } from "@/components/ui/primitives";
import { rangeLabel } from "@/lib/format";
import { t, type Lang } from "@/lib/i18n";
import { DEFAULT_RANGE, RANGE_OPTIONS } from "@/lib/query";
import { PLATFORMS, type Platform } from "@/lib/types";

/**
 * Barra filtri + contenuto.
 *
 * I filtri stanno in UNA riga sopra tutto ciò che governano (mai dentro una
 * card, mai uno per grafico): così ogni numero della pagina si riferisce alla
 * stessa fetta di dati e le cifre non possono contraddirsi tra loro.
 *
 * Durante il refetch il contenuto precedente resta a opacità ridotta invece di
 * lasciare il posto a uno skeleton: niente salto di layout, niente lampeggio.
 */
export function FilterShell({
  lang,
  clients,
  from,
  to,
  children,
}: {
  lang: Lang;
  clients: { id: string; name: string }[];
  from: string;
  to: string;
  children: React.ReactNode;
}) {
  const s = t(lang);
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [sheet, setSheet] = useState(false);

  const days = Number(sp.get("d")) || DEFAULT_RANGE;
  const selectedPlatforms = (sp.get("p")?.split(",").filter(Boolean) as Platform[] | undefined) ?? PLATFORMS;
  const clientId = sp.get("c");

  const push = useCallback(
    (mutate: (q: URLSearchParams) => void) => {
      const q = new URLSearchParams(sp.toString());
      mutate(q);
      const qs = q.toString();
      startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [pathname, router, sp],
  );

  const setDays = (d: number) =>
    push((q) => (d === DEFAULT_RANGE ? q.delete("d") : q.set("d", String(d))));

  const togglePlatform = (p: Platform) => {
    const next = selectedPlatforms.includes(p)
      ? selectedPlatforms.filter((x) => x !== p)
      : [...PLATFORMS.filter((x) => selectedPlatforms.includes(x) || x === p)];
    // almeno una piattaforma deve restare attiva: una dashboard vuota non informa
    if (!next.length) return;
    push((q) => (next.length === PLATFORMS.length ? q.delete("p") : q.set("p", next.join(","))));
  };

  const setClient = (id: string) => push((q) => (id ? q.set("c", id) : q.delete("c")));

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheet]);

  const activeFilters =
    (selectedPlatforms.length !== PLATFORMS.length ? 1 : 0) + (clientId ? 1 : 0);

  const periodButtons = (
    <div role="group" aria-label={s.filters.period} className="flex items-center rounded-xl border border-hairline bg-surface p-0.5">
      {RANGE_OPTIONS.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => setDays(d)}
          aria-pressed={days === d}
          className={cx(
            "rounded-[9px] px-2.5 py-1.5 text-[12px] font-medium tabular-nums transition-colors",
            days === d ? "bg-ink text-plane" : "text-ink-muted hover:text-ink-secondary",
          )}
        >
          {d}
          <span className="ml-px text-[10px]">d</span>
        </button>
      ))}
    </div>
  );

  const platformChips = (
    <div role="group" aria-label={s.filters.platform} className="flex flex-wrap items-center gap-1.5">
      {PLATFORMS.map((p) => {
        const on = selectedPlatforms.includes(p);
        return (
          <button
            key={p}
            type="button"
            onClick={() => togglePlatform(p)}
            aria-pressed={on}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
              on
                ? "border-hairline-strong bg-surface text-ink"
                : "border-hairline bg-transparent text-ink-muted",
            )}
          >
            <span
              aria-hidden
              className="h-2 w-2 rounded-full transition-opacity"
              style={{ background: PLATFORM_VAR[p], opacity: on ? 1 : 0.3 }}
            />
            {PLATFORM_LABEL[p]}
          </button>
        );
      })}
    </div>
  );

  const clientSelect = (
    <label className="flex items-center gap-2">
      <span className="sr-only">{s.filters.client}</span>
      <select
        value={clientId ?? ""}
        onChange={(e) => setClient(e.target.value)}
        className="h-9 max-w-[210px] rounded-xl border border-hairline bg-surface px-2.5 text-[12.5px] text-ink"
      >
        <option value="">{s.filters.allClients}</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <>
      <div className="sticky top-14 z-20 -mx-4 mb-4 border-b border-hairline bg-plane/85 px-4 py-2.5 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <div className="flex items-center gap-2">
          {periodButtons}

          {/* desktop: tutto in linea */}
          <div className="hidden items-center gap-2 lg:flex">
            {platformChips}
            {clientSelect}
          </div>

          {/* mobile: il resto in un pannello */}
          <button
            type="button"
            onClick={() => setSheet(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-hairline bg-surface px-2.5 text-[12px] font-medium text-ink-secondary lg:hidden"
          >
            <IconFilter className="h-4 w-4" />
            {s.filters.filtersTitle}
            {activeFilters > 0 && (
              <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-plane">
                {activeFilters}
              </span>
            )}
          </button>

          <span className="tnum ml-auto hidden whitespace-nowrap text-[11.5px] text-ink-muted lg:inline">
            {rangeLabel(from, to, lang)}
          </span>
        </div>
      </div>

      <div className={cx(isPending && "is-pending")}>{children}</div>

      {/* ---------------- bottom sheet mobile ---------------- */}
      {sheet && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={s.filters.filtersTitle}>
          <button
            type="button"
            aria-label={s.filters.close}
            onClick={() => setSheet(false)}
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
          />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-hairline bg-surface p-4 shadow-[var(--shadow-raised)]"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-baseline" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">{s.filters.filtersTitle}</h2>
              <button
                type="button"
                onClick={() => setSheet(false)}
                aria-label={s.filters.close}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted"
              >
                <IconClose className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2 text-[11px] font-medium tracking-[0.02em] text-ink-muted">
                  {s.filters.platform}
                </div>
                {platformChips}
              </div>
              <div>
                <div className="mb-2 text-[11px] font-medium tracking-[0.02em] text-ink-muted">
                  {s.filters.client}
                </div>
                <select
                  value={clientId ?? ""}
                  onChange={(e) => setClient(e.target.value)}
                  className="h-11 w-full rounded-xl border border-hairline bg-plane px-3 text-[14px] text-ink"
                >
                  <option value="">{s.filters.allClients}</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="tnum pt-1 text-center text-[11.5px] text-ink-muted">
                {rangeLabel(from, to, lang)}
              </div>
              <button
                type="button"
                onClick={() => setSheet(false)}
                className="h-11 w-full rounded-xl bg-ink text-[14px] font-semibold text-plane"
              >
                {s.filters.apply}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
