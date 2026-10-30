import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";

import { Providers } from "#/app/providers";
import { REFRESH_COOKIE } from "#/lib/auth/cookies";
import "./globals.css";

const TITLE = "Rabotka Business";
const DESCRIPTION =
  "Le recrutement des organisations au même endroit : offres rédigées en quelques mots, CV lus et classés pour chaque poste (même depuis Gmail ou Outlook), candidatures triées, entretiens synchronisés avec votre agenda.";

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
      locale: "fr_FR",
      title: "Recrutez avec Rabotka",
      description: DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title: "Recrutez avec Rabotka",
      description: DESCRIPTION,
    },
    // Keep Chrome from machine-translating the page: its <font> wrappers break
    // React's DOM reconciliation (see rabotka-admin index.html).
    other: { google: "notranslate" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  // Lets env(safe-area-inset-top) report the status bar's height.
  viewportFit: "cover",
};

/**
 * `modal` is the parallel-route slot that renders /auth/sign-in as a dialog
 * when it is reached by a link from inside the app (src/app/@modal).
 */
export default async function RootLayout({ children, modal }: LayoutProps<"/">) {
  const isAuthenticated = (await cookies()).has(REFRESH_COOKIE);

  return (
    // The document background is the browser chrome's colour: Safari (iOS 26+)
    // tints its bars with it, ignoring theme-color, and overscroll shows it
    // too. The grey page colour lives on the wrapper below.
    <html lang="fr" translate="no" className="bg-chrome" suppressHydrationWarning>
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
          <Providers isAuthenticated={isAuthenticated}>
            {children}
            {modal}
          </Providers>
        </div>
      </body>
    </html>
  );
}
