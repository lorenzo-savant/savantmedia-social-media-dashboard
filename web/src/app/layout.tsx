import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AppShell } from "@/components/shell/app-shell";
import { getLang } from "@/lib/prefs";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Savant Ads — enad annonsrapportering",
  description:
    "Meta, Google Ads och Snapchat i en vy. Kostnad, konverteringar, ROAS och budgetpacing per kund.",
  icons: { icon: "/mark.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
};

/**
 * Stampa data-theme PRIMA del primo paint, così chi ha scelto il tema scuro non
 * vede il lampo bianco. Con un useEffect il lampo ci sarebbe sempre: quando
 * l'effetto gira, la pagina è già dipinta. `beforeInteractive` inietta lo
 * script nell'HTML iniziale servito dal server, che è esattamente ciò che serve.
 */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('savant-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})()`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const strings = t(lang);

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <Script id="savant-theme" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-raised focus:px-3 focus:py-2 focus:text-sm focus:shadow-raised"
        >
          {strings.a11y.menu}
        </a>
        <AppShell lang={lang}>{children}</AppShell>
      </body>
    </html>
  );
}
