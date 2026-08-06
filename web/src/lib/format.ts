/**
 * Formattazione numerica e di data, dipendente dalla lingua.
 *
 * La valuta è SEK perché è la valuta degli account (nell'API arriva da
 * `account_currency` / `customer.currency_code`). Nessuna conversione di valuta
 * viene fatta: sommare account in valute diverse senza un tasso di cambio è uno
 * dei modi più comuni di produrre numeri sbagliati in una dashboard ads.
 */

export type Lang = "sv" | "en";

export const LOCALE: Record<Lang, string> = { sv: "sv-SE", en: "en-GB" };

export function nf(lang: Lang, digits = 0): Intl.NumberFormat {
  return new Intl.NumberFormat(LOCALE[lang], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function num(value: number, lang: Lang, digits = 0): string {
  return nf(lang, digits).format(value);
}

/** Valuta piena: "128 450 kr" (sv) · "SEK 128,450" (en). */
export function money(value: number, lang: Lang, digits = 0): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    style: "currency",
    currency: "SEK",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Valuta compatta per titoli e assi: "128,5 tn kr". */
export function moneyCompact(value: number, lang: Lang): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    style: "currency",
    currency: "SEK",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function compact(value: number, lang: Lang): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function pct(value: number, lang: Lang, digits = 2): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Delta con segno esplicito: "+12,4 %". null → "–". */
export function signedPct(value: number | null, lang: Lang, digits = 1): string {
  if (value == null) return "–";
  const s = new Intl.NumberFormat(LOCALE[lang], {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: "exceptZero",
  }).format(value);
  return s;
}

export function roasText(value: number | null, lang: Lang): string {
  if (value == null) return "–";
  return num(value, lang, 2) + "×";
}

/** "4 aug" · "4 Aug" */
export function shortDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(LOCALE[lang], { day: "numeric", month: "short" }).format(
    new Date(y, m - 1, d),
  );
}

/** "4 augusti 2026" */
export function longDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(LOCALE[lang], {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

export function dateTime(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(LOCALE[lang], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** "senast 30 dagar" → intervallo esplicito "6 juli – 4 aug" */
export function rangeLabel(from: string, to: string, lang: Lang): string {
  return `${shortDate(from, lang)} – ${shortDate(to, lang)}`;
}
