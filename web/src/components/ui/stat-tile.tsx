import { signedPct, type Lang } from "@/lib/format";
import { cx } from "./primitives";
import { IconArrowDown, IconArrowUp } from "./icons";

/**
 * Sparkline: 12+ punti, tratto sottile in tinta smorzata, punto finale in
 * accento con anello nel colore della superficie (così resta leggibile anche
 * quando si sovrappone alla linea). Nessuna etichetta: la forma basta, il
 * numero esatto è già il valore grande sopra.
 */
function Sparkline({ points, className }: { points: number[]; className?: string }) {
  if (points.length < 2) return null;
  const w = 100;
  const h = 26;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const step = w / (points.length - 1);
  const y = (v: number) => h - 3 - ((v - min) / span) * (h - 6);
  const d = points.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)} ${y(v).toFixed(2)}`).join(" ");
  const lastX = w;
  const lastY = y(points[points.length - 1]);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cx("h-6 w-full", className)}
      aria-hidden="true"
    >
      <path d={d} fill="none" stroke="var(--seq-250)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={lastX} cy={lastY} r={3.4} fill="var(--surface)" />
      <circle cx={lastX} cy={lastY} r={2.2} fill="var(--seq-450)" />
    </svg>
  );
}

export type GoodDirection = "up" | "down" | "neutral";

function deltaTone(value: number, good: GoodDirection): "up" | "down" | "flat" {
  if (Math.abs(value) < 0.005) return "flat";
  if (good === "neutral") return "flat";
  const positive = value > 0;
  const isGood = good === "up" ? positive : !positive;
  return isGood ? "up" : "down";
}

export function StatTile({
  label,
  value,
  delta,
  good = "neutral",
  sub,
  spark,
  lang,
  emphasis,
}: {
  label: string;
  value: string;
  delta?: number | null;
  good?: GoodDirection;
  sub?: string;
  spark?: number[];
  lang: Lang;
  /** Il tile "hero" della vista: uno solo per pagina. */
  emphasis?: boolean;
}) {
  const tone = delta != null ? deltaTone(delta, good) : "flat";
  const Arrow = delta != null && delta > 0 ? IconArrowUp : IconArrowDown;

  return (
    <div
      className={cx(
        "flex flex-col justify-between rounded-2xl border border-hairline bg-surface p-4 shadow-[var(--shadow-card)]",
        // Il tile hero occupa l'intera riga anche su telefono: in una sola
        // colonna il sottotitolo finiva schiacciato accanto allo sparkline e
        // andava a capo una parola per riga.
        emphasis && "col-span-2",
      )}
    >
      <div>
        <div className="text-[11px] font-medium tracking-[0.02em] text-ink-muted">{label}</div>
        <div
          className={cx(
            "mt-1.5 font-semibold tracking-[-0.025em] text-ink",
            emphasis ? "text-[30px] leading-[1.05] sm:text-[38px]" : "text-[21px] leading-tight sm:text-[23px]",
          )}
        >
          {value}
        </div>
      </div>

      {/* Il sottotitolo va a capo invece di essere troncato: su un tile stretto
          "CTR 1,00 % · CPC 7,67 kr" tagliato a metà non serve a nessuno. */}
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          {delta !== undefined && (
            <span
              className={cx(
                "inline-flex items-center gap-0.5 text-[11.5px] font-medium tabular-nums",
                tone === "up" && "text-delta-up",
                tone === "down" && "text-delta-down",
                tone === "flat" && "text-ink-muted",
              )}
            >
              {delta != null && <Arrow className="h-3 w-3" />}
              {signedPct(delta, lang)}
            </span>
          )}
          {sub && <div className="text-[11px] leading-snug text-ink-muted">{sub}</div>}
        </div>
        {spark && spark.length > 1 && (
          <div className={cx("shrink-0", emphasis ? "w-32" : "w-12 sm:w-16")}>
            <Sparkline points={spark} />
          </div>
        )}
      </div>
    </div>
  );
}
