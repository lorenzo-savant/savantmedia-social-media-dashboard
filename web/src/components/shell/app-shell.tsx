"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { Lang } from "@/lib/format";
import { t } from "@/lib/i18n";
import {
  IconAccounts,
  IconCampaigns,
  IconClients,
  IconInsights,
  IconMoon,
  IconOverview,
  IconSources,
  IconSun,
  Mark,
} from "@/components/ui/icons";

type NavItem = {
  href: string;
  label: (s: ReturnType<typeof t>) => string;
  Icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  /** Nella bottom bar mobile stanno solo le voci primarie. */
  primary: boolean;
};

const NAV: NavItem[] = [
  { href: "/", label: (s) => s.nav.overview, Icon: IconOverview, primary: true },
  { href: "/kampanjer", label: (s) => s.nav.campaigns, Icon: IconCampaigns, primary: true },
  { href: "/kunder", label: (s) => s.nav.clients, Icon: IconClients, primary: true },
  { href: "/insikter", label: (s) => s.nav.insights, Icon: IconInsights, primary: true },
  { href: "/konton", label: (s) => s.nav.accounts, Icon: IconAccounts, primary: true },
  { href: "/datakallor", label: (s) => s.nav.sources, Icon: IconSources, primary: false },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** I filtri sono nella URL: navigando tra le tab devono seguirci. */
function useQueryString(): string {
  const sp = useSearchParams();
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function NavLinks({ lang, variant }: { lang: Lang; variant: "rail" | "bar" }) {
  const pathname = usePathname();
  const qs = useQueryString();
  const s = t(lang);
  const items = variant === "bar" ? NAV.filter((n) => n.primary) : NAV;

  if (variant === "bar") {
    return (
      <>
        {items.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href + qs}
              aria-current={active ? "page" : undefined}
              className="group flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors"
            >
              <span
                className={`flex h-8 w-full max-w-14 items-center justify-center rounded-full transition-colors ${
                  active ? "bg-ink text-plane" : "text-ink-muted group-hover:text-ink-secondary"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span
                className={`w-full truncate text-center text-[10px] leading-none tracking-tight ${
                  active ? "font-semibold text-ink" : "text-ink-muted"
                }`}
              >
                {label(s)}
              </span>
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <nav className="flex flex-col gap-0.5" aria-label={s.a11y.menu}>
      {items.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href + qs}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] transition-colors ${
              active
                ? "bg-sunken font-semibold text-ink"
                : "text-ink-secondary hover:bg-sunken/60 hover:text-ink"
            }`}
          >
            <Icon className={`h-[17px] w-[17px] shrink-0 ${active ? "" : "text-ink-muted"}`} />
            <span className="truncate">{label(s)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function ThemeToggle({ lang }: { lang: Lang }) {
  const s = t(lang);
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const stamped = document.documentElement.getAttribute("data-theme");
    if (stamped === "dark" || stamped === "light") setDark(stamped === "dark");
    else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      localStorage.setItem("savant-theme", next ? "dark" : "light");
    } catch {
      /* modalità privata: il tema resta valido per la sessione */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={s.a11y.theme}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-hairline text-ink-secondary transition-colors hover:bg-sunken hover:text-ink"
    >
      {dark ? <IconSun className="h-[17px] w-[17px]" /> : <IconMoon className="h-[17px] w-[17px]" />}
    </button>
  );
}

function LangToggle({ lang }: { lang: Lang }) {
  const router = useRouter();
  const s = t(lang);

  function set(next: Lang) {
    if (next === lang) return;
    // 1 anno, path root: il server legge il cookie e rende già nella lingua giusta.
    document.cookie = `savant-lang=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div
      role="group"
      aria-label={s.a11y.lang}
      className="flex items-center rounded-lg border border-hairline p-0.5"
    >
      {(["sv", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => set(l)}
          aria-pressed={lang === l}
          className={`rounded-[6px] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
            lang === l ? "bg-ink text-plane" : "text-ink-muted hover:text-ink-secondary"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function BrandBlock({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  const s = t(lang);
  return (
    <div className="flex items-center gap-2.5">
      <Mark className="h-6 w-6 shrink-0" />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[15px] font-semibold tracking-[-0.01em]">{s.brand}</span>
          <span className="rounded-full border border-hairline-strong px-1.5 py-px text-[9px] font-bold tracking-[0.08em] text-ink-muted">
            {s.demoBadge}
          </span>
        </div>
        {!compact && (
          <p className="truncate text-[11.5px] leading-tight text-ink-muted">{s.tagline}</p>
        )}
      </div>
    </div>
  );
}

export function AppShell({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <div className="lg:flex">
      {/* ---------- rail desktop ---------- */}
      <aside className="sticky top-0 hidden h-dvh w-[236px] shrink-0 flex-col border-r border-hairline bg-surface px-3 py-4 lg:flex">
        <div className="px-1.5 pb-5">
          <BrandBlock lang={lang} />
        </div>
        <Suspense fallback={<div className="h-64" />}>
          <NavLinks lang={lang} variant="rail" />
        </Suspense>
        <div className="mt-auto flex items-center justify-between gap-2 px-1 pt-4">
          <LangToggle lang={lang} />
          <ThemeToggle lang={lang} />
        </div>
      </aside>

      {/* ---------- topbar mobile ---------- */}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-hairline bg-plane/85 px-4 backdrop-blur-xl lg:hidden">
          <BrandBlock lang={lang} compact />
          <div className="flex items-center gap-2">
            <LangToggle lang={lang} />
            <ThemeToggle lang={lang} />
          </div>
        </header>

        <main id="main" className="px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12 lg:pt-7">
          <div className="mx-auto w-full max-w-[1360px]">{children}</div>
        </main>
      </div>

      {/* ---------- bottom nav mobile ---------- */}
      <nav
        aria-label={t(lang).a11y.menu}
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch gap-0.5 border-t border-hairline bg-surface/92 px-1.5 pt-1.5 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
      >
        <Suspense fallback={null}>
          <NavLinks lang={lang} variant="bar" />
        </Suspense>
      </nav>
    </div>
  );
}
