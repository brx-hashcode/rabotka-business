import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import { Providers } from "#/app/providers";
import { OG_LOCALE } from "#/i18n/config";
import { REFRESH_COOKIE } from "#/lib/auth/cookies";
import "./globals.css";

const TITLE = "Rabotka Business";

/**
 * Social previews need absolute image URLs. The base is the host the request
 * came in on (behind the tunnel: x-forwarded-*), so no site URL has to be
 * configured per environment.
 */
export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3500";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const locale = await getLocale();
  const t = await getTranslations("pages.site");
  const DESCRIPTION = t("description");

  return {
    metadataBase: new URL(`${proto}://${host}`),
    title: TITLE,
    description: DESCRIPTION,
    applicationName: "Rabotka Business",
    manifest: "/manifest.json",
    // Added to an iPhone home screen, open full screen like an app, under the
    // install icon (src/app/apple-icon.png, from public/rabotka-app-icon.jpg).
    // default: iOS's own bar, with a dark clock on white. black-translucent
    // forces a white clock, unreadable on the white chrome.
    appleWebApp: {
      capable: true,
      title: "Rabotka Business",
      statusBarStyle: "default",
    },
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: "Rabotka",
      locale: OG_LOCALE[locale],
      title: t("shareTitle"),
      description: DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title: t("shareTitle"),
      description: DESCRIPTION,
    },
    // Keep Chrome from machine-translating the page: its <font> wrappers break
    // React's DOM reconciliation (see rabotka-admin index.html).
    other: { google: "notranslate" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#cbffa5" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  // Lets env(safe-area-inset-top) report the status bar's height.
  viewportFit: "cover",
};

/**
 * `modal` is the parallel-route slot that renders a candidate as a dialog
 * when reached by a link from inside the app (src/app/@modal).
 */
export default async function RootLayout({ children, modal }: LayoutProps<"/">) {
  const isAuthenticated = (await cookies()).has(REFRESH_COOKIE);
  const locale = await getLocale();
  // Everything but the public site's long copy, which its own layout adds.
  const messages = Object.fromEntries(Object.entries(await getMessages()).filter(([namespace]) => namespace !== "siteCopy"));

  return (
    // The document background is the browser chrome's colour: Safari (iOS 26+)
    // tints its bars with it, ignoring theme-color, and overscroll shows it
    // too. The grey page colour lives on the wrapper below.
    <html lang={locale} translate="no" className="bg-chrome" data-scroll-behavior="smooth" suppressHydrationWarning>
      {/* Extensions such as Grammarly add attributes to <body> before React
          hydrates; only this element's own attributes are exempt. */}
      <body className="min-h-svh bg-chrome antialiased" suppressHydrationWarning>
        {/* Behind the iPhone status bar in the installed app (zero tall
            anywhere else), fixed so scrolled content never slides under the
            clock. The wrapper below starts beneath it. */}
        <div
          aria-hidden
          className="fixed inset-x-0 top-0 z-50 h-[env(safe-area-inset-top)] bg-chrome"
        />
        <div className="min-h-svh bg-page pt-[env(safe-area-inset-top)]">
          {/* The request's language and messages, for client components. */}
          <NextIntlClientProvider messages={messages}>
            <Providers isAuthenticated={isAuthenticated}>
              {children}
              {modal}
            </Providers>
          </NextIntlClientProvider>
        </div>
      </body>
    </html>
  );
}
