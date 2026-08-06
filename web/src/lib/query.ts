/**
 * I filtri vivono nella URL (?d=30&p=meta,google&c=helix-labs).
 *
 * Perché non nello stato React: così un link a "Helix Labs, ultimi 7 giorni" è
 * condivisibile, il tasto Indietro funziona, e il render resta lato server —
 * il payload che arriva al browser è già filtrato invece di essere l'intero
 * dataset. Su mobile è la differenza tra 40 KB e qualche MB.
 */

import { PLATFORMS, type Filters, type Platform } from "./types";

export const RANGE_OPTIONS = [7, 14, 30, 90] as const;
export const DEFAULT_RANGE = 30;

export type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseFilters(sp: SearchParams): Filters {
  const rawDays = Number(first(sp.d));
  const days = (RANGE_OPTIONS as readonly number[]).includes(rawDays) ? rawDays : DEFAULT_RANGE;

  const rawPlatforms = (first(sp.p) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is Platform => (PLATFORMS as string[]).includes(s));
  const platforms = rawPlatforms.length ? rawPlatforms : PLATFORMS;

  const clientId = first(sp.c) || null;

  return { days, platforms, clientId };
}

/** Serializza i filtri omettendo i default: le URL restano leggibili. */
export function toSearch(f: Filters): string {
  const q = new URLSearchParams();
  if (f.days !== DEFAULT_RANGE) q.set("d", String(f.days));
  if (f.platforms.length !== PLATFORMS.length) q.set("p", f.platforms.join(","));
  if (f.clientId) q.set("c", f.clientId);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function withFilters(pathname: string, f: Filters): string {
  return pathname + toSearch(f);
}
