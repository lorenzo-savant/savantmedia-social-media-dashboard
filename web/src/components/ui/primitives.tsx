import type { Platform } from "@/lib/types";
import { IconInfo } from "./icons";

/* ============================================================================
   Primitive condivise. Sono server component (niente "use client"): la maggior
   parte della dashboard è statica, e ciò che non serve al browser non ci va.
   ========================================================================== */

export const PLATFORM_LABEL: Record<Platform, string> = {
  meta: "Meta",
  google: "Google Ads",
  snapchat: "Snapchat",
};

/** Var CSS del colore di serie — cambia da sola col tema. */
export const PLATFORM_VAR: Record<Platform, string> = {
  meta: "var(--series-meta)",
  google: "var(--series-google)",
  snapchat: "var(--series-snapchat)",
};

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
  as: As = "section",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <As
      className={cx(
        "rounded-2xl border border-hairline bg-surface shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </As>
  );
}

export function CardHead({
  title,
  sub,
  right,
  className,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5", className)}>
      <div className="min-w-0">
        <h2 className="text-[13px] font-semibold tracking-[-0.005em] text-ink">{title}</h2>
        {sub && <p className="mt-0.5 text-[11.5px] leading-snug text-ink-muted">{sub}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink sm:text-[26px]">
          {title}
        </h1>
        {sub && <p className="mt-1 text-[13px] leading-snug text-ink-secondary">{sub}</p>}
      </div>
      {right && <div className="hidden shrink-0 sm:block">{right}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------- badge */

type Tone = "neutral" | "good" | "warning" | "serious" | "critical" | "quiet";

const TONE: Record<Tone, string> = {
  neutral: "border-hairline-strong text-ink-secondary",
  quiet: "border-transparent bg-sunken text-ink-muted",
  good: "border-transparent text-[#0b5f0b] bg-[color-mix(in_oklab,var(--status-good)_16%,transparent)] dark:text-[#7fdf7f]",
  warning:
    "border-transparent text-[#6b4a00] bg-[color-mix(in_oklab,var(--status-warning)_22%,transparent)] dark:text-[#f6cf7a]",
  serious:
    "border-transparent text-[#8a3a13] bg-[color-mix(in_oklab,var(--status-serious)_22%,transparent)] dark:text-[#f0a986]",
  critical:
    "border-transparent text-[#8f1f1f] bg-[color-mix(in_oklab,var(--status-critical)_18%,transparent)] dark:text-[#f09a9a]",
};

export function Badge({
  children,
  tone = "neutral",
  icon,
}: {
  children: React.ReactNode;
  tone?: Tone;
  icon?: React.ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        TONE[tone],
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Pastiglia piattaforma: il pallino colorato porta l'identità, il testo resta ink. */
export function PlatformTag({ platform, short }: { platform: Platform; short?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] text-ink-secondary">
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: PLATFORM_VAR[platform] }}
      />
      {short ? PLATFORM_LABEL[platform].split(" ")[0] : PLATFORM_LABEL[platform]}
    </span>
  );
}

/* -------------------------------------------------------------------- note */

export function Note({
  title,
  children,
  tone = "quiet",
}: {
  title?: string;
  children: React.ReactNode;
  tone?: "quiet" | "warning";
}) {
  return (
    <div
      className={cx(
        "flex gap-2.5 rounded-xl border px-3.5 py-3 text-[12px] leading-relaxed",
        tone === "warning"
          ? "border-transparent bg-[color-mix(in_oklab,var(--status-warning)_12%,transparent)] text-ink-secondary"
          : "border-hairline bg-sunken/60 text-ink-secondary",
      )}
    >
      <IconInfo className="mt-px h-4 w-4 shrink-0 text-ink-muted" />
      <p className="min-w-0">
        {title && <span className="font-semibold text-ink">{title}. </span>}
        {children}
      </p>
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-32 items-center justify-center px-4 py-10 text-[13px] text-ink-muted">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------- meter */

const METER_FILL: Record<"ok" | "near" | "over" | "under", string> = {
  under: "var(--seq-350)",
  ok: "var(--seq-450)",
  near: "var(--status-warning)",
  over: "var(--status-critical)",
};

/**
 * Barra di pacing. Il riempimento porta la severità; la tacca è il punto in cui
 * la spesa *dovrebbe* essere oggi se il budget fosse consumato in modo lineare.
 * Senza quella tacca "60% del budget" non dice nulla: il 60% è ottimo il giorno
 * 20 del mese e allarmante il giorno 8.
 */
export function Meter({
  value,
  target,
  status,
  label,
}: {
  value: number;
  target?: number;
  status: "ok" | "near" | "over" | "under";
  label?: string;
}) {
  const w = Math.max(0, Math.min(value, 1)) * 100;
  const overflow = value > 1;
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-sunken" role="img" aria-label={label}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${w}%`, background: METER_FILL[status] }}
      />
      {overflow && (
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-1 rounded-full"
          style={{ background: "var(--status-critical)" }}
        />
      )}
      {target != null && target > 0 && target < 1 && (
        <div
          aria-hidden
          className="absolute inset-y-0 w-px bg-ink/45"
          style={{ left: `${Math.min(target, 1) * 100}%` }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------ key/value row */

export function KeyValue({
  k,
  v,
  mono,
}: {
  k: React.ReactNode;
  v: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="shrink-0 text-[12px] text-ink-muted">{k}</dt>
      <dd
        className={cx(
          "min-w-0 text-right text-[12.5px] text-ink",
          mono && "tnum font-mono text-[11.5px] break-all",
        )}
      >
        {v}
      </dd>
    </div>
  );
}
