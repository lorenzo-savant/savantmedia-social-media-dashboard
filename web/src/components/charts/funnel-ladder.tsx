import { cx } from "@/components/ui/primitives";

/**
 * Scala visning → klick → konvertering.
 *
 * Deliberatamente NON è un imbuto disegnato: i tre valori differiscono di tre
 * ordini di grandezza, quindi qualunque imbuto proporzionale renderebbe
 * invisibile l'ultimo segmento (o, peggio, lo gonfierebbe per farlo vedere).
 * Qui la forma giusta sono i numeri, con il tasso di passaggio tra uno step e
 * l'altro — che è l'informazione che si sta davvero cercando.
 */
export function FunnelLadder({
  steps,
}: {
  steps: { label: string; value: string; rate?: string; rateLabel?: string }[];
}) {
  return (
    <ol className="px-4 pb-4 pt-1 sm:px-5">
      {steps.map((s, i) => (
        <li key={s.label}>
          {i > 0 && (
            <div className="flex items-center gap-2 py-1.5 pl-1">
              <span aria-hidden className="ml-[3px] h-6 w-px bg-baseline" />
              <span className="rounded-full bg-sunken px-2 py-0.5 text-[10.5px] font-medium text-ink-secondary">
                {s.rateLabel} <span className="tnum font-semibold text-ink">{s.rate}</span>
              </span>
            </div>
          )}
          <div className="flex items-baseline justify-between gap-3">
            <span className="flex items-center gap-2 text-[12.5px] text-ink-secondary">
              <span
                aria-hidden
                className={cx("h-[7px] w-[7px] rounded-full")}
                style={{ background: i === 0 ? "var(--seq-250)" : i === 1 ? "var(--seq-450)" : "var(--seq-650)" }}
              />
              {s.label}
            </span>
            <span className="tnum text-[15px] font-semibold tracking-[-0.01em] text-ink">
              {s.value}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
