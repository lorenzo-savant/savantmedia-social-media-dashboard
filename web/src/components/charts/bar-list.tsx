import { cx } from "@/components/ui/primitives";

export interface BarItem {
  key: string;
  label: string;
  /** Valore già formattato: l'etichetta diretta sulla barra. */
  valueLabel: string;
  /** Valore numerico grezzo, per la lunghezza della barra. */
  value: number;
  /** Colore della barra. Omesso = serie singola → slot 1 per tutte le barre. */
  color?: string;
  /** Dettagli aggiuntivi, rivelati al passaggio del mouse o al focus. */
  details?: { label: string; value: string }[];
}

/**
 * Lista di barre orizzontali.
 *
 * Ogni valore è etichettato direttamente: la barra non è l'unico modo di
 * leggerlo, quindi il grafico funziona anche per chi non distingue le tinte
 * (è la "relief rule" richiesta dalla palette chiara). L'hover/focus rivela i
 * dettagli in più senza nasconderci nulla di essenziale.
 *
 * Spec del mark: spessore 8px (ben sotto il tetto di 24), estremità dati
 * arrotondata 4px, lato baseline squadrato, crescita da un'unica baseline.
 */
export function BarList({
  items,
  max,
  className,
}: {
  items: BarItem[];
  /** Riferimento per il 100%. Default: il valore più alto della lista. */
  max?: number;
  className?: string;
}) {
  const top = max ?? Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className={cx("space-y-2.5", className)}>
      {items.map((it) => {
        const w = top > 0 ? Math.max((it.value / top) * 100, it.value > 0 ? 1.5 : 0) : 0;
        return (
          <li
            key={it.key}
            tabIndex={it.details ? 0 : undefined}
            className="group -mx-2 rounded-lg px-2 py-1 outline-none transition-colors hover:bg-sunken/70 focus-visible:bg-sunken/70"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-[12.5px] text-ink-secondary">{it.label}</span>
              <span className="tnum shrink-0 text-[12.5px] font-semibold text-ink">
                {it.valueLabel}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-[2px] bg-sunken">
              <div
                className="h-full rounded-r-[4px] transition-[width] duration-500 ease-out"
                style={{ width: `${w}%`, background: it.color ?? "var(--seq-450)" }}
              />
            </div>
            {it.details && (
              <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr]">
                <div className="overflow-hidden">
                  <dl className="flex flex-wrap gap-x-4 gap-y-0.5 pt-1.5">
                    {it.details.map((d) => (
                      <div key={d.label} className="flex items-baseline gap-1.5">
                        <dt className="text-[10.5px] text-ink-muted">{d.label}</dt>
                        <dd className="tnum text-[11px] text-ink-secondary">{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
