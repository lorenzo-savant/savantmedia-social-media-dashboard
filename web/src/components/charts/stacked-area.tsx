"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { compact, money, shortDate, type Lang } from "@/lib/format";
import type { Platform } from "@/lib/types";

export interface AreaPoint {
  date: string;
  meta: number;
  google: number;
  snapchat: number;
  total: number;
}

export interface AreaSeries {
  key: Platform;
  label: string;
  color: string;
}

/**
 * Passo dell'asse arrotondato a 1/2/2,5/5/10 × potenza di dieci: i tick cadono
 * su numeri tondi (0 / 4 000 / 8 000 …) invece che su 11 250, che si legge male
 * e produce etichette lunghe che finiscono tagliate.
 */
function niceStep(v: number): number {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  const n = v / mag;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * mag;
}

const PAD = { top: 12, right: 12, bottom: 24, left: 44 };

/**
 * Area impilata: la somma delle bande È il totale del giorno, quindi l'asse
 * unico ha significato. Nessun secondo asse — due scale sullo stesso riquadro
 * inventano correlazioni che nei dati non ci sono.
 *
 * Le bande sono separate da un alone di 2,5px nel colore della superficie
 * disegnato sotto la linea di serie: è lo "spacer" che separa i riempimenti
 * senza aggiungere un bordo (che sarebbe inchiostro non-dato).
 */
export function StackedAreaChart({
  data,
  series,
  lang,
  maturingDays = 0,
}: {
  data: AreaPoint[];
  series: AreaSeries[];
  lang: Lang;
  /** Ultimi N giorni ancora in maturazione: vengono marcati sull'asse. */
  maturingDays?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const height = width && width < 520 ? 196 : 252;
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;
  const n = data.length;

  const { yMax, cumulative, ticks } = useMemo(() => {
    const max = Math.max(0, ...data.map((d) => d.total));
    const step = niceStep((max || 1) / 4);
    const yMax = step * 4;
    // cumulative[i][s] = somma delle serie fino a s compresa, al punto i
    const cumulative = data.map((d) => {
      let acc = 0;
      return series.map((s) => {
        acc += d[s.key];
        return acc;
      });
    });
    const ticks = [0, 1, 2, 3, 4].map((k) => k * step);
    return { yMax, cumulative, ticks };
  }, [data, series]);

  const x = useCallback(
    (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i * innerW) / (n - 1)),
    [innerW, n],
  );
  const y = useCallback((v: number) => PAD.top + innerH - (v / yMax) * innerH, [innerH, yMax]);

  const onPointer = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (n === 0 || innerW <= 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left - PAD.left;
      const idx = Math.round((px / innerW) * (n - 1));
      setActive(Math.max(0, Math.min(n - 1, idx)));
    },
    [innerW, n],
  );

  const onKey = useCallback(
    (e: React.KeyboardEvent<SVGSVGElement>) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        setActive((prev) => {
          const base = prev ?? n - 1;
          return Math.max(0, Math.min(n - 1, base + (e.key === "ArrowRight" ? 1 : -1)));
        });
      } else if (e.key === "Escape") {
        setActive(null);
      }
    },
    [n],
  );

  // etichette asse X: ~5 riferimenti, mai sovrapposti
  const xTickIdx = useMemo(() => {
    if (n === 0) return [];
    const want = width < 480 ? 3 : width < 760 ? 5 : 7;
    const stride = Math.max(1, Math.round((n - 1) / (want - 1)));
    const out: number[] = [];
    for (let i = 0; i < n; i += stride) out.push(i);
    if (out[out.length - 1] !== n - 1) out.push(n - 1);
    return out;
  }, [n, width]);

  const point = active != null ? data[active] : null;

  return (
    <div ref={wrapRef} className="relative w-full">
      {width > 0 && n > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          tabIndex={0}
          aria-label={`${series.map((s) => s.label).join(", ")} — ${data[0].date} → ${data[n - 1].date}`}
          className="touch-pan-y select-none outline-none"
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          onPointerLeave={() => setActive(null)}
          onKeyDown={onKey}
          onBlur={() => setActive(null)}
        >
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.34} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.13} />
              </linearGradient>
            ))}
          </defs>

          {/* griglia: hairline solide, mai tratteggiate */}
          {ticks.map((tv) => (
            <line
              key={tv}
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(tv)}
              y2={y(tv)}
              stroke="var(--gridline)"
              strokeWidth={1}
              shapeRendering="crispEdges"
            />
          ))}

          {/* riempimenti, dal basso verso l'alto */}
          {series.map((s, si) => {
            const top = cumulative.map((c, i) => `${x(i)},${y(c[si])}`);
            const bottom = cumulative
              .map((c, i) => `${x(i)},${y(si === 0 ? 0 : c[si - 1])}`)
              .reverse();
            return (
              <polygon
                key={s.key}
                points={[...top, ...bottom].join(" ")}
                fill={`url(#fill-${s.key})`}
              />
            );
          })}

          {/* bordi: alone superficie 5px + linea serie 2px = il "gap" tra bande */}
          {series.map((s, si) => {
            const d = cumulative.map((c, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(c[si])}`).join(" ");
            return (
              <g key={`edge-${s.key}`}>
                <path d={d} fill="none" stroke="var(--surface)" strokeWidth={5} strokeLinejoin="round" />
                <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              </g>
            );
          })}

          {/* baseline */}
          <line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={y(0)}
            y2={y(0)}
            stroke="var(--baseline)"
            strokeWidth={1}
            shapeRendering="crispEdges"
          />

          {/* fascia "dati ancora in maturazione" */}
          {maturingDays > 0 && n > maturingDays && (
            <rect
              x={x(n - maturingDays) - (innerW / (n - 1)) / 2}
              y={PAD.top}
              width={width - PAD.right - (x(n - maturingDays) - (innerW / (n - 1)) / 2)}
              height={innerH}
              fill="var(--ink)"
              opacity={0.035}
            />
          )}

          {/* Etichette asse Y. L'unità sta solo sul tick più alto: ripeterla su
              ogni riga allunga le etichette e le fa collidere con il grafico. */}
          {ticks.map((tv, i) => (
            <text
              key={`yl-${tv}`}
              x={PAD.left - 8}
              y={y(tv) + 3.5}
              textAnchor="end"
              className="tnum"
              fontSize={10.5}
              fill="var(--ink-muted)"
            >
              {tv === 0 ? "0" : i === ticks.length - 1 ? `${compact(tv, lang)} kr` : compact(tv, lang)}
            </text>
          ))}

          {/* etichette asse X */}
          {xTickIdx.map((i) => (
            <text
              key={`xl-${i}`}
              x={x(i)}
              y={height - 7}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              fontSize={10.5}
              fill="var(--ink-muted)"
            >
              {shortDate(data[i].date, lang)}
            </text>
          ))}

          {/* crosshair + punti */}
          {active != null && (
            <g pointerEvents="none">
              <line
                x1={x(active)}
                x2={x(active)}
                y1={PAD.top}
                y2={PAD.top + innerH}
                stroke="var(--baseline)"
                strokeWidth={1}
              />
              {series.map((s, si) => (
                <g key={`dot-${s.key}`}>
                  <circle cx={x(active)} cy={y(cumulative[active][si])} r={5} fill="var(--surface)" />
                  <circle cx={x(active)} cy={y(cumulative[active][si])} r={3.2} fill={s.color} />
                </g>
              ))}
            </g>
          )}
        </svg>
      )}

      {width === 0 && <div style={{ height: 252 }} />}

      {/* tooltip: il valore guida, il nome della serie segue */}
      {point && width > 0 && (
        <div
          className="pointer-events-none absolute z-10 min-w-[168px] rounded-xl border border-hairline bg-raised px-3 py-2.5 shadow-[var(--shadow-raised)]"
          style={{
            left: Math.min(Math.max(x(active!) - 84, 4), Math.max(4, width - 176)),
            top: 4,
          }}
        >
          <div className="mb-1.5 text-[11px] font-medium text-ink-muted">
            {shortDate(point.date, lang)}
          </div>
          <ul className="space-y-1">
            {series.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-[2px] w-3 shrink-0 rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="text-[11px] text-ink-muted">{s.label}</span>
                </span>
                <span className="tnum text-[12px] font-semibold text-ink">
                  {money(point[s.key], lang)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-hairline pt-1.5">
            <span className="text-[11px] text-ink-muted">Σ</span>
            <span className="tnum text-[12px] font-semibold text-ink">{money(point.total, lang)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
