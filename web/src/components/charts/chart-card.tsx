"use client";

import { useId, useState } from "react";
import { Card, CardHead, cx } from "@/components/ui/primitives";
import { t, type Lang } from "@/lib/i18n";

/**
 * Contenitore di un grafico con il gemello in tabella.
 *
 * La vista tabella non è un extra: è il canale accessibile obbligatorio. Tre
 * dei colori categorici stanno sotto 3:1 di contrasto sulla superficie chiara
 * (è la "relief rule" della palette), quindi ogni valore deve essere
 * raggiungibile anche senza distinguere le tinte.
 */
export function ChartCard({
  title,
  sub,
  legend,
  chart,
  table,
  footer,
  lang,
  className,
}: {
  title: string;
  sub?: string;
  legend?: React.ReactNode;
  chart: React.ReactNode;
  table?: React.ReactNode;
  footer?: React.ReactNode;
  lang: Lang;
  className?: string;
}) {
  const [mode, setMode] = useState<"chart" | "table">("chart");
  const s = t(lang);
  const id = useId();

  return (
    <Card className={cx("flex flex-col overflow-hidden", className)}>
      <CardHead
        title={title}
        sub={sub}
        right={
          table ? (
            <div className="flex items-center rounded-lg border border-hairline p-0.5">
              {(["chart", "table"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  aria-controls={id}
                  className={cx(
                    "rounded-[6px] px-2 py-1 text-[11px] font-medium transition-colors",
                    mode === m ? "bg-ink text-plane" : "text-ink-muted hover:text-ink-secondary",
                  )}
                >
                  {m === "chart" ? s.chart.chartView : s.chart.tableView}
                </button>
              ))}
            </div>
          ) : undefined
        }
      />

      {legend && <div className="px-4 pt-3 sm:px-5">{legend}</div>}

      <div id={id} className="min-w-0 flex-1 px-1 pb-1 pt-2 sm:px-2">
        {mode === "chart" ? chart : <div className="px-3 pb-2 sm:px-3">{table}</div>}
      </div>

      {footer && (
        <div className="border-t border-hairline px-4 py-2.5 text-[11px] leading-relaxed text-ink-muted sm:px-5">
          {footer}
        </div>
      )}
    </Card>
  );
}
